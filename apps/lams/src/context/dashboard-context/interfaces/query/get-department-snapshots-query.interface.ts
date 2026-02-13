/**
 * 부서별 연도, 월별 스냅샷 조회 쿼리 인터페이스
 *
 * 하위 핸들러(GetDepartmentMonthlySnapshotChildren)가 QueryBus로 배치이력 조회를 수행합니다.
 */
export interface IGetDepartmentSnapshotsQuery {
    departmentId: string;
    year: string;
    month: string;
}
