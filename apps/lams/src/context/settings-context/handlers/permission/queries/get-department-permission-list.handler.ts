import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { GetDepartmentPermissionListQuery } from './get-department-permission-list.query';
import {
    IGetDepartmentPermissionListResponse,
    IDepartmentPermissionEmployeeInfo,
} from '../../../interfaces/response/get-department-permission-list-response.interface';
import { DomainDepartmentService } from '@libs/modules/department/department.service';
import { DomainEmployeeDepartmentPermissionService } from '../../../../../domain/employee-department-permission/employee-department-permission.service';

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

        const employees: IDepartmentPermissionEmployeeInfo[] = permissions.map((p) => {
            const emp = p.employee as { id: string; employeeNumber?: string; name?: string } | undefined;
            return {
                id: p.employee_id,
                employeeNumber: emp?.employeeNumber ?? '',
                employeeName: emp?.name ?? '',
                hasAccessPermission: p.has_access_permission,
                hasReviewPermission: p.has_review_permission,
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
