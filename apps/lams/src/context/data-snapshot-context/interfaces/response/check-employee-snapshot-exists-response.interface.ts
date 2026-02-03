/**
 * 해당 직원 해당 연월 스냅샷 존재 여부 조회 응답 인터페이스
 */
export interface ICheckEmployeeSnapshotExistsResponse {
    /** 해당 연월에 해당 직원의 스냅샷 데이터가 존재하면 true */
    exists: boolean;
}
