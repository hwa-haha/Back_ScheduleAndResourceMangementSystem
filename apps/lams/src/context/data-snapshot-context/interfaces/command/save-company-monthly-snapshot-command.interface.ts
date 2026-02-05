/**
 * 회사 전체 월간 요약 스냅샷 저장 Command 인터페이스
 */
export interface ISaveCompanyMonthlySnapshotCommand {
    year: string;
    month: string;
    performedBy: string;
    snapshotName?: string;
    description?: string;
}
