/**
 * 권한 목록에 포함될 직원 요약 정보
 */
export interface IEmployeeInfoForPermission {
    id: string;
    employeeNumber: string;
    employeeName: string;
    /** 퇴사 여부 (직원 상태 퇴사 또는 퇴사자 부서 소속) */
    isTerminated: boolean;
}

/**
 * 부서별 보기권한(접근권한) / 검토권한 구분 및 해당 권한을 가진 직원 목록
 */
export interface IDepartmentInfoForPermission {
    id: string;
    departmentCode: string;
    departmentName: string;
    type: string;
    order: number;
    /** 보기권한(접근권한, has_access_permission)을 가진 직원 목록 */
    accessPermissionEmployees: IEmployeeInfoForPermission[];
    /** 검토권한(has_review_permission)을 가진 직원 목록 */
    reviewPermissionEmployees: IEmployeeInfoForPermission[];
    /** 해당 부서 권한자 중 퇴사자가 한 명이라도 있는지 여부 */
    hasTerminatedPermissionHolder: boolean;
}

/**
 * 권한 관리용 부서 목록 조회 응답 인터페이스
 */
export interface IGetDepartmentListForPermissionResponse {
    departments: IDepartmentInfoForPermission[];
    totalCount: number;
}
