import { Injectable } from '@nestjs/common';
import { EmployeeContextService } from '../../context/employee/employee.context.service';
import { EmplyeesByDepartmentResponseDto } from './dtos/employees-by-department-response.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { ChangeRoleDto } from './dtos/change-role.dto';
import { UpdateNotificationSettingsDto } from './dtos/notification-settings.dto';
import { DepartmentListResponseDto, DepartmentHierarchyResponseDto } from './dtos/department-response.dto';

@Injectable()
export class EmployeeManagementService {
    constructor(private readonly employeeContextService: EmployeeContextService) {}

    async syncEmployees(authorization: string): Promise<void> {
        // await this.employeeContextService.전체_조직_정보를_동기화한다(authorization);
        // await this.employeeContextService.구독정보를_동기화한다();
    }

    async findResourceManagers(): Promise<EmplyeesByDepartmentResponseDto[]> {
        const employeesByDepartment = await this.employeeContextService.자원관리자_목록을_조회한다();
        return this.부서_계층구조_순서로_정렬한다(employeesByDepartment);
    }

    async findManagerCandidates(): Promise<EmplyeesByDepartmentResponseDto[]> {
        const employeesByDepartment = await this.employeeContextService.관리자_후보_목록을_조회한다();
        return this.부서_계층구조_순서로_정렬한다(employeesByDepartment);
    }

    async changeRole(changeRoleDto: ChangeRoleDto): Promise<any> {
        await this.employeeContextService.직원_역할을_변경한다(changeRoleDto);
        return { success: true };
    }

    async findEmployeeList(useHiddenInFilter?: boolean): Promise<EmplyeesByDepartmentResponseDto[]> {
        const employeesByDepartment = await this.employeeContextService.직원_목록을_조회한다(useHiddenInFilter);
        return this.부서_계층구조_순서로_정렬한다(employeesByDepartment);
    }

    async findAllDepartments(): Promise<DepartmentListResponseDto> {
        const departments = await this.employeeContextService.모든_부서를_조회한다();

        return {
            departments: departments,
            totalCount: departments.length,
        };
    }

    async findSubDepartments(): Promise<DepartmentListResponseDto> {
        const departments = await this.employeeContextService.하위_부서_목록을_조회한다();

        return {
            departments: departments,
            totalCount: departments.length,
        };
    }

    async findRootDepartments(): Promise<DepartmentListResponseDto> {
        const departments = await this.employeeContextService.루트_부서_목록을_조회한다();

        return {
            departments: departments,
            totalCount: departments.length,
        };
    }

    async findDepartmentHierarchy(): Promise<DepartmentHierarchyResponseDto> {
        const hierarchy = await this.employeeContextService.부서_계층구조를_조회한다();

        // 총 부서 수 계산 (재귀적으로)
        const calculateTotalCount = (depts: any[]): number => {
            return depts.reduce((total, dept) => {
                return total + 1 + calculateTotalCount(dept.childDepartments || []);
            }, 0);
        };

        // 최대 깊이 계산 (재귀적으로)
        const calculateMaxDepth = (depts: any[], currentDepth = 0): number => {
            if (depts.length === 0) return currentDepth;

            return Math.max(...depts.map((dept) => calculateMaxDepth(dept.childDepartments || [], currentDepth + 1)));
        };

        const totalCount = calculateTotalCount(hierarchy);
        const maxDepth = calculateMaxDepth(hierarchy);

        return {
            departments: hierarchy,
            totalCount: totalCount,
            rootCount: hierarchy.length,
            maxDepth: maxDepth,
        };
    }

    async findEmployeeDetail(employeeId: string): Promise<UserResponseDto> {
        return this.employeeContextService.직원_상세정보를_조회한다(employeeId);
    }

    async checkPassword(employeeId: string, password: string): Promise<any> {
        const isValid = await this.employeeContextService.비밀번호를_확인한다(employeeId, password);
        return { isValid };
    }

    async changePassword(employeeId: string, newPassword: string): Promise<any> {
        await this.employeeContextService.비밀번호를_변경한다(employeeId, newPassword);
        return { success: true };
    }

    async changeNotificationSettings(
        employeeId: string,
        updateDto: UpdateNotificationSettingsDto,
    ): Promise<UserResponseDto> {
        return this.employeeContextService.알림설정을_변경한다(employeeId, updateDto);
    }

    /**
     * 부서별로 그룹핑된 직원 목록을 부서 계층구조 순서대로 정렬합니다.
     * 깊이 우선 탐색(DFS) 방식으로 최상단 부서부터 하위 부서 순으로 정렬하며,
     * 직원이 없는 부서는 결과에서 제외됩니다.
     */
    private async 부서_계층구조_순서로_정렬한다(
        employeesByDepartment: EmplyeesByDepartmentResponseDto[],
    ): Promise<EmplyeesByDepartmentResponseDto[]> {
        // 부서 계층구조를 조회한다
        const departmentHierarchy = await this.employeeContextService.부서_계층구조를_조회한다();

        // 부서명(부서코드)를 키로 하는 Map으로 변환 (빠른 조회를 위해)
        const employeesByDepartmentMap = new Map<string, EmplyeesByDepartmentResponseDto>();
        employeesByDepartment.forEach((item) => {
            employeesByDepartmentMap.set(item.department, item);
        });

        // 계층구조 순서대로 정렬된 결과 배열
        const sortedResult: EmplyeesByDepartmentResponseDto[] = [];

        // 깊이 우선 탐색(DFS)으로 부서 계층구조를 순회하면서 직원이 있는 부서만 추가
        const traverseHierarchy = (departments: any[]) => {
            for (const dept of departments) {
                // 해당 부서에 직원이 있으면 결과에 추가

                const employeesInDept = employeesByDepartmentMap.get(dept.departmentName);
                if (employeesInDept) {
                    sortedResult.push(employeesInDept);
                }

                // 하위 부서들을 재귀적으로 순회 (order 순서대로 이미 정렬되어 있음)
                if (dept.childDepartments && dept.childDepartments.length > 0) {
                    traverseHierarchy(dept.childDepartments);
                }
            }
        };

        // 계층구조 순회 시작
        traverseHierarchy(departmentHierarchy);

        // 계층구조에 없는 부서의 직원들도 마지막에 추가 (혹시 모를 데이터 손실 방지)
        employeesByDepartment.forEach((item) => {
            if (!sortedResult.find((sorted) => sorted.department === item.department)) {
                sortedResult.push(item);
            }
        });

        return sortedResult;
    }
}
