/**
 * 직원의 부서 권한 정보 인터페이스
 */
export interface IEmployeeDepartmentPermissionInfo {
    departmentId: string;
    departmentName: string;
    hasAccessPermission: boolean;
    hasReviewPermission: boolean;
}

/**
 * 직원 권한 정보 인터페이스
 */
export interface IEmployeeWithPermissions {
    id: string;
    employeeNumber: string;
    employeeName: string;
    permissions: IEmployeeDepartmentPermissionInfo[];
    /** 직원 추가 정보 (없을 수 있음) */
    extraInfo?: {
        id: string;
        employeeId: string;
        isExcludedFromSummary: boolean;
    } | null;
}
