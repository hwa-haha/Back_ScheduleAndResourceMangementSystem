/**
 * 부서별 월별 스냅샷 child 조회 쿼리 인터페이스
 */
export interface IGetDepartmentMonthlySnapshotChildrenQuery {
    departmentId: string;
    year: string;
    month: string;
}
