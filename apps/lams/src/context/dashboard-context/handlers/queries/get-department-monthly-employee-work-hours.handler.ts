import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetDepartmentMonthlyEmployeeWorkHoursQuery } from './get-department-monthly-employee-work-hours.query';
import { IGetDepartmentMonthlyEmployeeWorkHoursResponse } from '../../interfaces';
import { ApprovalStatus } from '../../../../domain/data-snapshot-info/data-snapshot-info.types';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSnapshotChild } from '../../../../domain/data-snapshot-child/data-snapshot-child.entity';

/**
 * 부서별 월별 직원별 근무시간 조회 Query Handler
 *
 * 특정 연·월에 해당 부서에 배치된 직원들의 근무시간 상세(총 근무시간, 지각·조퇴, 주차별 근무시간)를 조회합니다.
 * 하위 스냅샷 데이터를 기반으로 하며, 동일 연월에 여러 스냅샷이 있으면 결재 상태 "제출됨"·제출 시간 최신 스냅샷을 사용합니다.
 */
@QueryHandler(GetDepartmentMonthlyEmployeeWorkHoursQuery)
export class GetDepartmentMonthlyEmployeeWorkHoursHandler implements IQueryHandler<
    GetDepartmentMonthlyEmployeeWorkHoursQuery,
    IGetDepartmentMonthlyEmployeeWorkHoursResponse
> {
    private readonly logger = new Logger(GetDepartmentMonthlyEmployeeWorkHoursHandler.name);

    constructor(
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
        @InjectRepository(DataSnapshotChild)
        private readonly dataSnapshotChildRepository: Repository<DataSnapshotChild>,
    ) {}

    async execute(
        query: GetDepartmentMonthlyEmployeeWorkHoursQuery,
    ): Promise<IGetDepartmentMonthlyEmployeeWorkHoursResponse> {
        const { departmentId, year, month } = query.data;
        const monthStr = month.padStart(2, '0');
        const mm = monthStr;

        this.logger.log(
            `부서별 월별 직원별 근무시간 조회: departmentId=${departmentId}, year=${year}, month=${monthStr}`,
        );

        // 1. 해당 월 부서 직원 목록 조회
        const employeeHistories =
            await this.employeeDepartmentPositionHistoryService.특정연월부서의배치이력목록을조회한다(
                year,
                monthStr,
                departmentId,
            );
        const employeeIds = employeeHistories.map((eh) => eh.employeeId).filter((id) => id);

        if (employeeIds.length === 0) {
            return { departmentId, year, month: monthStr, employeeWorkHours: [] };
        }

        // 2. 직원별 하위 스냅샷 조회
        const allChildren = await this.dataSnapshotChildRepository
            .createQueryBuilder('child')
            .leftJoinAndSelect('child.parentSnapshot', 'parent')
            .where('child.yyyy = :yyyy', { yyyy: year })
            .andWhere('child.mm = :mm', { mm })
            .andWhere('child.employee_id IN (:...employeeIds)', { employeeIds })
            .andWhere('child.deleted_at IS NULL')
            .getMany();

        if (allChildren.length === 0) {
            return { departmentId, year, month: monthStr, employeeWorkHours: [] };
        }

        // 3. 직원별 최적 child 선택 (제출됨·최신 우선)
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

        // 4. 직원별 근무시간·지각·조퇴·주차별 근무시간 집계
        const monthEmployeeWorkHoursMap = new Map<
            string,
            {
                employeeId: string;
                employeeName: string;
                employeeNumber: string;
                totalWorkHours: number;
                lateCount: number;
                earlyLeaveCount: number;
                weeklyWorkHours: Array<{
                    weekNumber: number;
                    startDate: string;
                    endDate: string;
                    weeklyWorkHours: number;
                }>;
            }
        >();

        selectedChildrenMap.forEach((child) => {
            try {
                const snapshotData =
                    typeof child.snapshot_data === 'string' ? JSON.parse(child.snapshot_data) : child.snapshot_data;
                const totalWorkTimeValue = snapshotData.totalWorkTime || 0; // 분
                const attendanceTypeCount = snapshotData.attendanceTypeCount || {};
                const weeklyWorkTimeSummary = snapshotData.weeklyWorkTimeSummary || [];

                const employeeId = child.employee_id;
                if (!monthEmployeeWorkHoursMap.has(employeeId)) {
                    monthEmployeeWorkHoursMap.set(employeeId, {
                        employeeId,
                        employeeName: child.employee_name || '',
                        employeeNumber: child.employee_number || '',
                        totalWorkHours: 0,
                        lateCount: 0,
                        earlyLeaveCount: 0,
                        weeklyWorkHours: [],
                    });
                }
                const workHours = monthEmployeeWorkHoursMap.get(employeeId)!;
                workHours.totalWorkHours += totalWorkTimeValue;
                workHours.lateCount += attendanceTypeCount['지각'] || 0;
                workHours.earlyLeaveCount += attendanceTypeCount['조퇴'] || 0;
                weeklyWorkTimeSummary.forEach((week: any) => {
                    workHours.weeklyWorkHours.push({
                        weekNumber: week.weekNumber || 0,
                        startDate: week.startDate || '',
                        endDate: week.endDate || '',
                        weeklyWorkHours: Math.round(((week.weeklyWorkTime || 0) / 60) * 100) / 100,
                    });
                });
            } catch (error) {
                this.logger.warn(`스냅샷 데이터 파싱 실패: childId=${child.id}, error=${(error as Error).message}`);
            }
        });

        const employeeWorkHours = Array.from(monthEmployeeWorkHoursMap.values())
            .map((e) => ({
                ...e,
                totalWorkHours: Math.round((e.totalWorkHours / 60) * 100) / 100,
                weeklyWorkHours: e.weeklyWorkHours.sort((a, b) => a.weekNumber - b.weekNumber),
            }))
            .sort((a, b) => b.totalWorkHours - a.totalWorkHours);

        return {
            departmentId,
            year,
            month: monthStr,
            employeeWorkHours,
        };
    }
}
