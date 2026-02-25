/**
 * 특정 부서의 직원별 권한 정보
 */
export interface IDepartmentPermissionEmployeeInfo {
    id: string;
    employeeNumber: string;
    employeeName: string;
    hasAccessPermission: boolean;
    hasReviewPermission: boolean;
    /** 퇴사 여부 (직원 상태 퇴사 또는 퇴사자 부서 소속) */
    isTerminated: boolean;
}

/**
 * 특정 부서별 직원 권한 목록 조회 응답 인터페이스
 */
export interface IGetDepartmentPermissionListResponse {
    departmentId: string;
    departmentName: string;
    employees: IDepartmentPermissionEmployeeInfo[];
}
