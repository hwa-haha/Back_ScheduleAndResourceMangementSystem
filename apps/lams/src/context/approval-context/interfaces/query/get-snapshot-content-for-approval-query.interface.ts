/**
 * 결재시 스냅샷 내용 보기 쿼리 인터페이스
 *
 * 스냅샷 ID + 토큰의 직원 ID + 연·월로, 해당 직원이 검토할 수 있는 부서들의 스냅샷 데이터를 부서별로 조회
 */
export interface IGetSnapshotContentForApprovalQuery {
    snapshotId: string;
    employeeId: string;
    year: string;
    month: string;
}
