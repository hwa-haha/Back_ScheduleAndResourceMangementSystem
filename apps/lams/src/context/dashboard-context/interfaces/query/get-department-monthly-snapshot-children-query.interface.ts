/**
 * 부서별 월별 스냅샷 child 조회 쿼리 인터페이스
 *
 * 핸들러 내부에서 QueryBus로 배치이력 조회 쿼리를 실행해 직원 목록을 구합니다.
 */
export interface IGetDepartmentMonthlySnapshotChildrenQuery {
    departmentId: string;
    year: string;
    month: string;
}
