/**
 * 해당 직원 해당 연월 스냅샷 존재 여부 조회 쿼리 인터페이스
 */
export interface ICheckEmployeeSnapshotExistsQuery {
    employeeId: string;
    year: string;
    month: string;
}
