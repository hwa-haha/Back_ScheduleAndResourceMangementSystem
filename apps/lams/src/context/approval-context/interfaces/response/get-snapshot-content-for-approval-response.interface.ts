import { DataSnapshotInfoDTO } from '../../../../domain/data-snapshot-info/data-snapshot-info.types';
import { DataSnapshotChildDTO } from '../../../../domain/data-snapshot-child/data-snapshot-child.types';

/**
 * 부서별 스냅샷 child 데이터 (결재용)
 */
export interface IDepartmentSnapshotContent {
    departmentId: string;
    departmentName: string;
    children: DataSnapshotChildDTO[];
}

/**
 * 결재시 스냅샷 내용 보기 응답 인터페이스
 *
 * 스냅샷 메타정보 + 해당 직원이 검토할 수 있는 부서별 스냅샷 child 목록
 */
export interface IGetSnapshotContentForApprovalResponse {
    snapshot: Omit<DataSnapshotInfoDTO, 'children'>;
    departments: IDepartmentSnapshotContent[];
}
