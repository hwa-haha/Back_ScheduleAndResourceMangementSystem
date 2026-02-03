import { DataSnapshotInfoDTO } from '../../../../domain/data-snapshot-info/data-snapshot-info.types';

/**
 * 결재 관련 스냅샷 업데이트 응답 인터페이스
 */
export interface IUpdateSnapshotApprovalResponse {
    snapshot: DataSnapshotInfoDTO;
}
