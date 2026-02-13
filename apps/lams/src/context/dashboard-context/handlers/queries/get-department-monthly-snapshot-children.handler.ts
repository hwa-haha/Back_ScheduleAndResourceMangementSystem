import { QueryHandler, IQueryHandler, QueryBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetDepartmentMonthlySnapshotChildrenQuery } from './get-department-monthly-snapshot-children.query';
import { IGetDepartmentMonthlySnapshotChildrenResponse } from '../../interfaces/response/get-department-monthly-snapshot-children-response.interface';
import { ApprovalStatus } from '../../../../domain/data-snapshot-info/data-snapshot-info.types';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSnapshotChild } from '../../../../domain/data-snapshot-child/data-snapshot-child.entity';
import { GetAssignmentHistoryByYearMonthDepartmentQuery } from '../../../organization-management-context';

/**
 * 부서별 월별 스냅샷 child 조회 Query Handler
 *
 * QueryBus로 배치이력 조회 핸들러를 호출해 직원 목록을 구한 뒤, 직원별 최적 child를 선택하여 반환합니다.
 */
@QueryHandler(GetDepartmentMonthlySnapshotChildrenQuery)
export class GetDepartmentMonthlySnapshotChildrenHandler implements IQueryHandler<
    GetDepartmentMonthlySnapshotChildrenQuery,
    IGetDepartmentMonthlySnapshotChildrenResponse
> {
    private readonly logger = new Logger(GetDepartmentMonthlySnapshotChildrenHandler.name);

    constructor(
        private readonly queryBus: QueryBus,
        @InjectRepository(DataSnapshotChild)
        private readonly dataSnapshotChildRepository: Repository<DataSnapshotChild>,
    ) {}

    async execute(
        query: GetDepartmentMonthlySnapshotChildrenQuery,
    ): Promise<IGetDepartmentMonthlySnapshotChildrenResponse> {
        const { departmentId, year, month } = query.data;
        const monthStr = month.padStart(2, '0');
        const mm = monthStr;

        this.logger.log(`부서별 월별 스냅샷 child 조회: departmentId=${departmentId}, year=${year}, month=${monthStr}`);

        const employeeHistories = await this.queryBus.execute(
            new GetAssignmentHistoryByYearMonthDepartmentQuery({ year, month: monthStr, departmentId }),
        );
        const employeeIds = employeeHistories.map((eh) => eh.employeeId).filter((id) => id);

        if (employeeIds.length === 0) {
            return { departmentId, year, month: monthStr, selectedChildren: [] };
        }

        const allChildren = await this.dataSnapshotChildRepository
            .createQueryBuilder('child')
            .leftJoinAndSelect('child.parentSnapshot', 'parent')
            .where('child.yyyy = :yyyy', { yyyy: year })
            .andWhere('child.mm = :mm', { mm })
            .andWhere('child.employee_id IN (:...employeeIds)', { employeeIds })
            .andWhere('child.deleted_at IS NULL')
            .getMany();

        if (allChildren.length === 0) {
            return { departmentId, year, month: monthStr, selectedChildren: [] };
        }

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
                        const versionA = a.parentSnapshot?.snapshot_version ?? '';
                        const versionB = b.parentSnapshot?.snapshot_version ?? '';
                        return versionB.localeCompare(versionA);
                    })[0];
                }
                if (selectedChild) {
                    selectedChildrenMap.set(employeeId, selectedChild);
                }
            }
        });

        const selectedChildren = Array.from(selectedChildrenMap.values());
        return {
            departmentId,
            year,
            month: monthStr,
            selectedChildren,
        };
    }
}
