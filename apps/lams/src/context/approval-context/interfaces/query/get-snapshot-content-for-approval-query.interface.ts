/**
 * 결재시 스냅샷 내용 보기 쿼리 인터페이스
 *
 * 핸들러 내부에서 QueryBus로 권한 부서별 배치이력 조회 핸들러를 호출합니다.
 */
export interface IGetSnapshotContentForApprovalQuery {
    snapshotId: string;
    employeeId: string;
    year: string;
    month: string;
}
