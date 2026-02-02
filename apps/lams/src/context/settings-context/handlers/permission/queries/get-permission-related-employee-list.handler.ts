import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetPermissionRelatedEmployeeListQuery } from './get-permission-related-employee-list.query';
import { IGetPermissionRelatedEmployeeListResponse } from '../../../interfaces/response/get-permission-related-employee-list-response.interface';
import { Employee, EmployeeStatus } from '@libs/modules/employee/employee.entity';
import { EmployeeDepartmentPermission } from '../../../../../domain/employee-department-permission/employee-department-permission.entity';
import { EmployeeDepartmentPosition } from '@libs/modules/employee-department-position/employee-department-position.entity';
import { IEmployeeDepartmentPermissionInfo } from '../../../interfaces/response/employee-department-permission-info.interface';
import { IEmployeeWithPermissions } from '../../../interfaces/response/employee-department-permission-info.interface';

/**
 * 권한 관련 직원 목록 조회 Query Handler
 *
 * 현재 조직도(employee-department-position)에 재직 중인 직원 목록을 조회하고, 각 직원별로 어느 부서에 권한을 가지고 있는지 정보를 반환합니다.
 * 직원명과 부서명으로 검색이 가능합니다.
 */
@QueryHandler(GetPermissionRelatedEmployeeListQuery)
export class GetPermissionRelatedEmployeeListHandler implements IQueryHandler<
    GetPermissionRelatedEmployeeListQuery,
    IGetPermissionRelatedEmployeeListResponse
> {
    private readonly logger = new Logger(GetPermissionRelatedEmployeeListHandler.name);

    constructor(private readonly dataSource: DataSource) {}

    async execute(query: GetPermissionRelatedEmployeeListQuery): Promise<IGetPermissionRelatedEmployeeListResponse> {
        const { employeeName, departmentName } = query.data;

        this.logger.log(
            `권한 관련 직원 목록 조회 시작: employeeName=${employeeName}, departmentName=${departmentName}`,
        );

        // 1. 현재 조직도에 재직 중인 직원 조회 (employee-department-position 기반, 퇴사자 제외, 검색 조건 적용)
        const employeeQueryBuilder = this.dataSource.manager
            .createQueryBuilder(Employee, 'emp')
            .innerJoin(EmployeeDepartmentPosition, 'edp', 'edp.employeeId = emp.id')
            .where('emp.status = :status', { status: EmployeeStatus.Active })
            .distinct(true);

        if (employeeName) {
            employeeQueryBuilder.andWhere('emp.name LIKE :employeeName', { employeeName: `%${employeeName}%` });
        }

        const employees = await employeeQueryBuilder.orderBy('emp.employeeNumber', 'ASC').getMany();

        if (employees.length === 0) {
            this.logger.warn('조건에 맞는 직원이 없습니다.');
            return { employees: [], totalCount: 0 };
        }

        const employeeIds = employees.map((emp) => emp.id);

        // 2. 모든 권한 조회 (직원 ID 목록으로 필터링)
        const allPermissions = await this.dataSource.manager
            .createQueryBuilder(EmployeeDepartmentPermission, 'permission')
            .leftJoinAndSelect('permission.department', 'department')
            .where('permission.employee_id IN (:...employeeIds)', { employeeIds })
            .andWhere('permission.deleted_at IS NULL')
            .getMany();

        // 3. 부서명으로 필터링 (필요한 경우)
        let filteredPermissions = allPermissions;
        if (departmentName) {
            filteredPermissions = allPermissions.filter(
                (permission) => permission.department && permission.department.departmentName.includes(departmentName),
            );
        }

        // 4. 권한을 직원별로 그룹핑
        const permissionsByEmployee = new Map<string, IEmployeeDepartmentPermissionInfo[]>();

        for (const permission of filteredPermissions) {
            const deptInfo: IEmployeeDepartmentPermissionInfo = {
                departmentId: permission.department_id,
                departmentName: permission.department?.departmentName || '',
                hasAccessPermission: permission.has_access_permission,
                hasReviewPermission: permission.has_review_permission,
            };

            if (!permissionsByEmployee.has(permission.employee_id)) {
                permissionsByEmployee.set(permission.employee_id, []);
            }
            permissionsByEmployee.get(permission.employee_id)!.push(deptInfo);
        }

        // 5. 직원 정보와 권한 정보 결합
        const employeesWithPermissions: IEmployeeWithPermissions[] = employees
            .map((employee) => {
                const permissions = permissionsByEmployee.get(employee.id) || [];

                // 부서명 필터가 있고 권한이 없는 경우 제외
                if (departmentName && permissions.length === 0) {
                    return null;
                }

                return {
                    id: employee.id,
                    employeeNumber: employee.employeeNumber,
                    employeeName: employee.name,
                    permissions,
                };
            })
            .filter((emp): emp is IEmployeeWithPermissions => emp !== null);

        this.logger.log(`권한 관련 직원 목록 조회 완료: totalCount=${employeesWithPermissions.length}`);

        return {
            employees: employeesWithPermissions,
            totalCount: employeesWithPermissions.length,
        };
    }
}
