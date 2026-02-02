import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetDepartmentMonthlyAverageWorkHoursQuery } from './get-department-monthly-average-work-hours.query';
import { IGetDepartmentMonthlyAverageWorkHoursResponse } from '../../interfaces';
import { ApprovalStatus } from '../../../../domain/data-snapshot-info/data-snapshot-info.types';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSnapshotChild } from '../../../../domain/data-snapshot-child/data-snapshot-child.entity';

/**
 * 부서별 월별 일평균 근무시간 조회 Query Handler
 *
 * 연도별로 1월부터 12월까지의 월별 일평균 근무시간만 조회합니다.
 * 하위 스냅샷 데이터를 기반으로 조회합니다.
 * 동일 연월에 여러 개의 스냅샷이 있다면 결재 상태가 "제출됨"이면서 제출 시간이 가장 최신인 스냅샷을 사용합니다.
 */
@QueryHandler(GetDepartmentMonthlyAverageWorkHoursQuery)
export class GetDepartmentMonthlyAverageWorkHoursHandler implements IQueryHandler<
    GetDepartmentMonthlyAverageWorkHoursQuery,
    IGetDepartmentMonthlyAverageWorkHoursResponse
> {
    private readonly logger = new Logger(GetDepartmentMonthlyAverageWorkHoursHandler.name);

    constructor(
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
        @InjectRepository(DataSnapshotChild)
        private readonly dataSnapshotChildRepository: Repository<DataSnapshotChild>,
    ) {}

    async execute(
        query: GetDepartmentMonthlyAverageWorkHoursQuery,
    ): Promise<IGetDepartmentMonthlyAverageWorkHoursResponse> {
        const { departmentId, year } = query.data;

        this.logger.log(`부서별 월별 일평균 근무시간 조회: departmentId=${departmentId}, year=${year}`);

        // 1. 연도 전체 월별 일평균 근무시간만 집계 (1~12월)
        const monthlyAverages: Array<{ month: string; averageWorkHours: number }> = [];

        for (let month = 1; month <= 12; month++) {
            const monthStr = month.toString().padStart(2, '0');
            const mm = monthStr;

            // 1-1. 해당 월의 부서별 직원 목록 조회
            const employeeHistories =
                await this.employeeDepartmentPositionHistoryService.특정연월부서의배치이력목록을조회한다(
                    year,
                    monthStr,
                    departmentId,
                );
            const employeeIds = employeeHistories.map((eh) => eh.employeeId).filter((id) => id);

            if (employeeIds.length === 0) {
                monthlyAverages.push({ month: monthStr, averageWorkHours: 0 });
                continue;
            }

            // 1-2. 각 직원별로 하위 스냅샷 조회 (연도, 월, 직원ID로)
            const allChildren = await this.dataSnapshotChildRepository
                .createQueryBuilder('child')
                .leftJoinAndSelect('child.parentSnapshot', 'parent')
                .where('child.yyyy = :yyyy', { yyyy: year })
                .andWhere('child.mm = :mm', { mm })
                .andWhere('child.employee_id IN (:...employeeIds)', { employeeIds })
                .andWhere('child.deleted_at IS NULL')
                .getMany();

            if (allChildren.length === 0) {
                monthlyAverages.push({ month: monthStr, averageWorkHours: 0 });
                continue;
            }

            // 1-3. 직원별로 여러 스냅샷이 있을 경우, 결재 상태가 "제출됨"이고 제출 시간이 가장 최신인 스냅샷의 child 선택
            const selectedChildrenMap = new Map<string, DataSnapshotChild>();

            const childrenByEmployee = new Map<string, DataSnapshotChild[]>();
            allChildren.forEach((child) => {
                const employeeId = child.employee_id;
                if (!childrenByEmployee.has(employeeId)) {
                    childrenByEmployee.set(employeeId, []);
                }
                childrenByEmployee.get(employeeId)!.push(child);
            });

            childrenByEmployee.forEach((children, employeeId) => {
                if (children.length === 1) {
                    selectedChildrenMap.set(employeeId, children[0]);
                } else {
                    const submittedChildren = children.filter(
                        (c) =>
                            c.parentSnapshot?.approval_status === ApprovalStatus.SUBMITTED &&
                            c.parentSnapshot?.submitted_at !== null,
                    );

                    let selectedChild: DataSnapshotChild | null = null;
                    if (submittedChildren.length > 0) {
                        selectedChild = submittedChildren.sort((a, b) => {
                            const dateA = a.parentSnapshot?.submitted_at
                                ? new Date(a.parentSnapshot.submitted_at).getTime()
                                : 0;
                            const dateB = b.parentSnapshot?.submitted_at
                                ? new Date(b.parentSnapshot.submitted_at).getTime()
                                : 0;
                            return dateB - dateA;
                        })[0];
                    } else {
                        selectedChild = children.sort((a, b) => {
                            const dateA = a.parentSnapshot?.created_at
                                ? new Date(a.parentSnapshot.created_at).getTime()
                                : 0;
                            const dateB = b.parentSnapshot?.created_at
                                ? new Date(b.parentSnapshot.created_at).getTime()
                                : 0;
                            return dateB - dateA;
                        })[0];
                    }

                    if (selectedChild) {
                        selectedChildrenMap.set(employeeId, selectedChild);
                    }
                }
            });

            // 1-4. 선택된 child들에서 총 근무시간·근무일수만 집계 (일평균 계산용)
            let totalWorkTime = 0;
            let totalWorkDays = 0;

            selectedChildrenMap.forEach((child) => {
                try {
                    const snapshotData =
                        typeof child.snapshot_data === 'string' ? JSON.parse(child.snapshot_data) : child.snapshot_data;

                    const workDaysCount = snapshotData.workDaysCount || 0;
                    const totalWorkTimeValue = snapshotData.totalWorkTime || 0; // 분 단위

                    totalWorkTime += totalWorkTimeValue;
                    totalWorkDays += workDaysCount;
                } catch (error) {
                    this.logger.warn(`스냅샷 데이터 파싱 실패: childId=${child.id}, error=${error.message}`);
                }
            });

            const averageWorkHours = totalWorkDays > 0 ? totalWorkTime / totalWorkDays / 60 : 0; // 분 → 시간
            monthlyAverages.push({
                month: monthStr,
                averageWorkHours: Math.round(averageWorkHours * 100) / 100,
            });
        }

        return {
            departmentId,
            year,
            monthlyAverages,
        };
    }
}
