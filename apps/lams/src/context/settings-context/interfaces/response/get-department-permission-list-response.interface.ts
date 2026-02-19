/**
 * 특정 부서의 직원별 권한 정보
 */
export interface IDepartmentPermissionEmployeeInfo {
    id: string;
    employeeNumber: string;
    employeeName: string;
    hasAccessPermission: boolean;
    hasReviewPermission: boolean;
}

/**
 * 특정 부서별 직원 권한 목록 조회 응답 인터페이스
 */
export interface IGetDepartmentPermissionListResponse {
    departmentId: string;
    departmentName: string;
    employees: IDepartmentPermissionEmployeeInfo[];
}
