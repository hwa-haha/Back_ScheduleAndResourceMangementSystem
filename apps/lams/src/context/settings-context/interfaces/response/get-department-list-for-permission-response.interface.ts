/**
 * 권한 목록에 포함될 직원 요약 정보
 */
export interface IEmployeeInfoForPermission {
    id: string;
    employeeNumber: string;
    employeeName: string;
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
}

/**
 * 권한 관리용 부서 목록 조회 응답 인터페이스
 */
export interface IGetDepartmentListForPermissionResponse {
    departments: IDepartmentInfoForPermission[];
    totalCount: number;
}
