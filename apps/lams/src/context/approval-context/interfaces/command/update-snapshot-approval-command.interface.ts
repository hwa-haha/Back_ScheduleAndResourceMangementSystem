/**
 * 결재 관련 스냅샷 업데이트 명령 인터페이스
 *
 * approval_document_id, submitted_at, approver_name 업데이트. approval_status 는 핸들러에서 "제출됨"으로 고정.
 */
export interface IUpdateSnapshotApprovalCommand {
    snapshotId: string;
    approvalDocumentId?: string | null;
    submittedAt?: Date | null;
    approverName?: string | null;
    performedBy: string;
}
