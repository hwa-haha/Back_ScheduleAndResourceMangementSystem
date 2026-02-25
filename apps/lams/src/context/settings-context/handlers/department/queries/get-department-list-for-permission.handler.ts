import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetDepartmentListForPermissionQuery } from './get-department-list-for-permission.query';
import {
    IGetDepartmentListForPermissionResponse,
    IDepartmentInfoForPermission,
    IEmployeeInfoForPermission,
} from '../../../interfaces/response/get-department-list-for-permission-response.interface';
import { Department } from '@libs/modules/department/department.entity';
import { DomainDepartmentService } from '@libs/modules/department/department.service';
import { DomainEmployeeDepartmentPermissionService } from '../../../../../domain/employee-department-permission/employee-department-permission.service';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';
import { EmployeeStatus } from '@libs/modules/employee/employee.entity';

/**
 * 권한 관리용 부서 목록 조회 Query Handler
 *
 * 퇴사자 부서를 제외한 전체 부서 목록을 조회하고,
 * 부서별로 보기권한(접근권한)·검토권한을 가진 직원 목록을 함께 반환합니다.
 */
@QueryHandler(GetDepartmentListForPermissionQuery)
export class GetDepartmentListForPermissionHandler implements IQueryHandler<
    GetDepartmentListForPermissionQuery,
    IGetDepartmentListForPermissionResponse
> {
    private readonly logger = new Logger(GetDepartmentListForPermissionHandler.name);

    constructor(
        private readonly departmentService: DomainDepartmentService,
        private readonly permissionService: DomainEmployeeDepartmentPermissionService,
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
    ) {}

    async execute(query: GetDepartmentListForPermissionQuery): Promise<IGetDepartmentListForPermissionResponse> {
        this.logger.log('권한 관리용 부서 목록 조회 시작');

        // 1. 퇴사자 부서를 제외한 전체 부서 목록 조회
        const allDepartments = await this.departmentService.퇴사자를제외한전체부서목록을조회한다();

        if (allDepartments.length === 0) {
            this.logger.log('권한 관리용 부서 목록 조회 완료: totalCount=0');
            return { departments: [], totalCount: 0 };
        }

        // 2. 계층 구조로 만든 뒤, 루트→하위 order 기준으로 정렬하여 flat 목록 생성
        const departments = this.계층정렬후Flat한다(allDepartments);

        const departmentIds = departments.map((d) => d.id);

        // 3. 해당 부서들에 대한 직원-부서 권한 전체 조회 (직원 정보 포함)
        const permissions = await this.permissionService.부서ID목록으로권한목록조회한다(departmentIds);

        // 3-1. 권한자 직원 ID 목록으로 퇴사 여부 조회 (배치 이력 기준, permission 직원만 조회)
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

        // 4. 부서별로 보기권한/검토권한 직원 목록 구성 (직원 중복 제거: 동일 부서에 동일 직원은 한 행이므로 권한별로 나누면 됨)
        const accessByDept = new Map<string, IEmployeeInfoForPermission[]>();
        const reviewByDept = new Map<string, IEmployeeInfoForPermission[]>();

        for (const p of permissions) {
            const emp = p.employee;
            const empInfo: IEmployeeInfoForPermission = {
                id: emp.id,
                employeeNumber: emp.employeeNumber,
                employeeName: emp.name ?? '',
                isTerminated: terminatedEmployeeIds.has(emp.id),
            };

            if (p.has_access_permission) {
                const list = accessByDept.get(p.department_id) ?? [];
                if (!list.some((e) => e.id === emp.id)) list.push(empInfo);
                accessByDept.set(p.department_id, list);
            }
            if (p.has_review_permission) {
                const list = reviewByDept.get(p.department_id) ?? [];
                if (!list.some((e) => e.id === emp.id)) list.push(empInfo);
                reviewByDept.set(p.department_id, list);
            }
        }

        // 5. 부서 순서대로 응답 구성 (해당 부서 권한자 중 퇴사자 존재 여부 플래그 포함)
        const departmentList: IDepartmentInfoForPermission[] = departments.map((dept) => {
            const accessList = accessByDept.get(dept.id) ?? [];
            const reviewList = reviewByDept.get(dept.id) ?? [];
            const hasTerminatedPermissionHolder =
                accessList.some((e) => e.isTerminated) || reviewList.some((e) => e.isTerminated);
            return {
                id: dept.id,
                departmentCode: dept.departmentCode,
                departmentName: dept.departmentName,
                type: dept.type,
                order: dept.order,
                accessPermissionEmployees: accessList,
                reviewPermissionEmployees: reviewList,
                hasTerminatedPermissionHolder,
            };
        });

        this.logger.log(`권한 관리용 부서 목록 조회 완료: totalCount=${departmentList.length}`);

        return {
            departments: departmentList,
            totalCount: departmentList.length,
        };
    }

    /**
     * 부서 목록을 parentDepartmentId 기준 계층으로 묶은 뒤,
     * 루트 → 하위를 order 오름차순으로 방문하여 flat 배열로 반환한다.
     */
    private 계층정렬후Flat한다(allDepartments: Department[]): Department[] {
        const idSet = new Set(allDepartments.map((d) => d.id));
        const roots = allDepartments
            .filter((d) => !d.parentDepartmentId || !idSet.has(d.parentDepartmentId))
            .sort((a, b) => a.order - b.order);

        const childrenByParentId = new Map<string, Department[]>();
        for (const d of allDepartments) {
            if (!d.parentDepartmentId || !idSet.has(d.parentDepartmentId)) continue;
            const list = childrenByParentId.get(d.parentDepartmentId) ?? [];
            list.push(d);
            childrenByParentId.set(d.parentDepartmentId, list);
        }
        for (const list of childrenByParentId.values()) {
            list.sort((a, b) => a.order - b.order);
        }

        const result: Department[] = [];
        const visit = (dept: Department): void => {
            result.push(dept);
            const children = childrenByParentId.get(dept.id) ?? [];
            for (const child of children) visit(child);
        };
        for (const root of roots) visit(root);
        return result;
    }
}
