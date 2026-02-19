/**
 * 부서 목록 조회 Query 인터페이스
 */
export interface IGetDepartmentListQuery {
    year: string;
    month: string;
    /** 지정 시 해당 직원의 접근 권한(has_access_permission)이 있는 부서와 그 하위 부서만 반환 */
    employeeId?: string;
}
