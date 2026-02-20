/**
 * 부서 권한 정보 인터페이스 (직원 기준 요청 시)
 */
export interface IDepartmentPermission {
    departmentId: string;
    hasAccessPermission: boolean;
    hasReviewPermission: boolean;
}

/**
 * 직원 권한 정보 인터페이스 (부서 기준 요청 시)
 */
export interface IEmployeePermission {
    employeeId: string;
    hasAccessPermission: boolean;
    hasReviewPermission: boolean;
}

/**
 * 직원-부서 권한 변경 Command 인터페이스 (부서별로 직원 권한 설정)
 */
export interface IUpdateEmployeeDepartmentPermissionCommand {
    departmentId: string;
    employees: IEmployeePermission[];
    performedBy: string;
}
