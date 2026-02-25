import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { GetDepartmentPermissionListQuery } from './get-department-permission-list.query';
import {
    IGetDepartmentPermissionListResponse,
    IDepartmentPermissionEmployeeInfo,
} from '../../../interfaces/response/get-department-permission-list-response.interface';
import { DomainDepartmentService } from '@libs/modules/department/department.service';
import { DomainEmployeeDepartmentPermissionService } from '../../../../../domain/employee-department-permission/employee-department-permission.service';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';
import { EmployeeStatus } from '@libs/modules/employee/employee.entity';

/**
 * 특정 부서별 직원 권한 목록 조회 Query Handler
 *
 * 특정 부서에 대한 권한을 가진 직원 목록과 권한 정보(보기/검토)를 조회합니다.
 */
@QueryHandler(GetDepartmentPermissionListQuery)
export class GetDepartmentPermissionListHandler
    implements IQueryHandler<GetDepartmentPermissionListQuery, IGetDepartmentPermissionListResponse>
{
    private readonly logger = new Logger(GetDepartmentPermissionListHandler.name);

    constructor(
        private readonly departmentService: DomainDepartmentService,
        private readonly permissionService: DomainEmployeeDepartmentPermissionService,
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
    ) {}

    async execute(
        query: GetDepartmentPermissionListQuery,
    ): Promise<IGetDepartmentPermissionListResponse> {
        const { departmentId } = query.data;

        this.logger.log(`부서별 직원 권한 목록 조회 시작: departmentId=${departmentId}`);

        const department = await this.departmentService.findOne(departmentId);
        if (!department) {
            throw new NotFoundException(`부서를 찾을 수 없습니다: ${departmentId}`);
        }

        const permissions = await this.permissionService.부서ID목록으로권한목록조회한다([
            departmentId,
        ]);

        // 권한자 직원 ID 목록으로 퇴사 여부 조회 (배치 이력 기준, permission 직원만 조회)
        const permissionEmployeeIds = [...new Set(permissions.map((p) => p.employee_id))];
        const terminatedEmployeeIds = new Set<string>();
        if (permissionEmployeeIds.length > 0) {
            const currentHistories =
                await this.employeeDepartmentPositionHistoryService.findCurrentByEmployeeIds(
                    permissionEmployeeIds,
                );
            for (const history of currentHistories) {
                const isTerminated =
                    history.employee?.status === EmployeeStatus.Terminated ||
                    history.department?.departmentCode === '퇴사자';
                if (isTerminated) terminatedEmployeeIds.add(history.employeeId);
            }
        }

        const employees: IDepartmentPermissionEmployeeInfo[] = permissions.map((p) => {
            const emp = p.employee as { id: string; employeeNumber?: string; name?: string } | undefined;
            return {
                id: p.employee_id,
                employeeNumber: emp?.employeeNumber ?? '',
                employeeName: emp?.name ?? '',
                hasAccessPermission: p.has_access_permission,
                hasReviewPermission: p.has_review_permission,
                isTerminated: terminatedEmployeeIds.has(p.employee_id),
            };
        });

        this.logger.log(
            `부서별 직원 권한 목록 조회 완료: departmentId=${departmentId}, employeeCount=${employees.length}`,
        );

        return {
            departmentId: department.id,
            departmentName: department.departmentName,
            employees,
        };
    }
}
