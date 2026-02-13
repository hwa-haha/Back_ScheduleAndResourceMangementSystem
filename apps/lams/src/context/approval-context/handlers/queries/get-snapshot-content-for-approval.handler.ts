import { QueryHandler, IQueryHandler, QueryBus } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { GetSnapshotContentForApprovalQuery } from './get-snapshot-content-for-approval.query';
import {
    IGetSnapshotContentForApprovalResponse,
    IDepartmentSnapshotContent,
} from '../../interfaces/response/get-snapshot-content-for-approval-response.interface';
import { DomainDataSnapshotInfoService } from '../../../../domain/data-snapshot-info/data-snapshot-info.service';
import { DomainDepartmentService } from '@libs/modules/department/department.service';
import { DomainEmployeeDepartmentPermissionService } from '../../../../domain/employee-department-permission/employee-department-permission.service';
import { GetAssignmentHistoryByYearMonthDepartmentQuery } from '../../../organization-management-context';

/**
 * 결재시 스냅샷 내용 보기 Query Handler
 *
 * 권한 부서 목록 조회 후, QueryBus로 부서별 배치이력 조회 핸들러를 호출해 스냅샷 child를 필터링합니다.
 */
@QueryHandler(GetSnapshotContentForApprovalQuery)
export class GetSnapshotContentForApprovalHandler implements IQueryHandler<
    GetSnapshotContentForApprovalQuery,
    IGetSnapshotContentForApprovalResponse
> {
    private readonly logger = new Logger(GetSnapshotContentForApprovalHandler.name);

    constructor(
        private readonly dataSnapshotInfoService: DomainDataSnapshotInfoService,
        private readonly departmentService: DomainDepartmentService,
        private readonly employeeDepartmentPermissionService: DomainEmployeeDepartmentPermissionService,
        private readonly queryBus: QueryBus,
    ) {}

    async execute(query: GetSnapshotContentForApprovalQuery): Promise<IGetSnapshotContentForApprovalResponse> {
        const { snapshotId, employeeId, year, month } = query.data;
        const monthStr = month.padStart(2, '0');

        this.logger.log(`결재시 스냅샷 내용 보기: snapshotId=${snapshotId}, employeeId=${employeeId}`);

        const snapshot = await this.dataSnapshotInfoService.자식포함조회한다(snapshotId);
        if (!snapshot) {
            throw new NotFoundException(`스냅샷을 찾을 수 없습니다. (snapshotId: ${snapshotId})`);
        }

        const permissions = await this.employeeDepartmentPermissionService.직원으로목록조회한다(employeeId);
        const reviewableDepartmentIds = permissions.filter((p) => p.hasReviewPermission).map((p) => p.departmentId);

        if (reviewableDepartmentIds.length === 0) {
            this.logger.log(`해당 직원은 검토 권한이 있는 부서가 없습니다. employeeId=${employeeId}`);
            return {
                snapshot: (() => {
                    const { children: _, ...rest } = snapshot;
                    return rest;
                })(),
                departments: [],
            };
        }

        const departments: IDepartmentSnapshotContent[] = [];

        for (const departmentId of reviewableDepartmentIds) {
            const departmentEmployees = await this.queryBus.execute(
                new GetAssignmentHistoryByYearMonthDepartmentQuery({
                    year,
                    month: monthStr,
                    departmentId,
                }),
            );
            const employeeIds = departmentEmployees.map((h) => h.employeeId);

            const filtered = (snapshot.children ?? []).filter((child) => employeeIds.includes(child.employeeId));
            const children = filtered.map(({ rawData: _raw, ...rest }) => rest);

            let departmentName = '';
            const dept = await this.departmentService.findOne(departmentId);
            if (dept) {
                departmentName = dept.departmentName ?? '';
            }

            departments.push({
                departmentId,
                departmentName,
                children,
            });
        }

        const { children: _, ...snapshotMeta } = snapshot;

        this.logger.log(`결재시 스냅샷 내용 보기 완료: snapshotId=${snapshotId}, departments=${departments.length}`);

        return {
            snapshot: snapshotMeta,
            departments,
        };
    }
}
