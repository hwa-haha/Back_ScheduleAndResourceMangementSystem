import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { GetSnapshotContentForApprovalQuery } from './get-snapshot-content-for-approval.query';
import {
    IGetSnapshotContentForApprovalResponse,
    IDepartmentSnapshotContent,
} from '../../interfaces/response/get-snapshot-content-for-approval-response.interface';
import { DomainDataSnapshotInfoService } from '../../../../domain/data-snapshot-info/data-snapshot-info.service';
import { DomainEmployeeDepartmentPermissionService } from '../../../../domain/employee-department-permission/employee-department-permission.service';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';
import { DomainDepartmentService } from '@libs/modules/department/department.service';

/**
 * 결재시 스냅샷 내용 보기 Query Handler
 *
 * 스냅샷 ID로 스냅샷을 조회하고, 토큰의 직원 ID가 검토 권한이 있는 부서들에 대해서만
 * 해당 연·월에 소속된 직원들의 스냅샷 child 데이터를 부서별로 필터링하여 반환합니다.
 */
@QueryHandler(GetSnapshotContentForApprovalQuery)
export class GetSnapshotContentForApprovalHandler implements IQueryHandler<
    GetSnapshotContentForApprovalQuery,
    IGetSnapshotContentForApprovalResponse
> {
    private readonly logger = new Logger(GetSnapshotContentForApprovalHandler.name);

    constructor(
        private readonly dataSnapshotInfoService: DomainDataSnapshotInfoService,
        private readonly employeeDepartmentPermissionService: DomainEmployeeDepartmentPermissionService,
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
        private readonly departmentService: DomainDepartmentService,
    ) {}

    async execute(query: GetSnapshotContentForApprovalQuery): Promise<IGetSnapshotContentForApprovalResponse> {
        const { snapshotId, employeeId, year, month } = query.data;
        const monthStr = month.padStart(2, '0');

        this.logger.log(
            `결재시 스냅샷 내용 보기: snapshotId=${snapshotId}, employeeId=${employeeId}, year=${year}, month=${monthStr}`,
        );

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
            const departmentEmployees =
                await this.employeeDepartmentPositionHistoryService.특정연월부서와하위부서의배치이력목록을조회한다(
                    year,
                    monthStr,
                    departmentId,
                );
            const employeeIds = departmentEmployees.map((h) => h.employeeId);

            const filtered = (snapshot.children ?? []).filter((child) => employeeIds.includes(child.employeeId));
            const children = filtered.map(({ rawData: _raw, ...rest }) => rest);

            let departmentName = '';
            const dept = await this.departmentService.findOne(departmentId);
            if (dept) {
                departmentName = dept.departmentName ?? '';
            } else if (departmentEmployees[0]?.department) {
                const d = departmentEmployees[0].department as { departmentName?: string };
                departmentName = d?.departmentName ?? '';
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
