import { IQuery } from '@nestjs/cqrs';
import { IGetSnapshotContentForApprovalQuery } from '../../interfaces/query/get-snapshot-content-for-approval-query.interface';

/**
 * 결재시 스냅샷 내용 보기 Query
 */
export class GetSnapshotContentForApprovalQuery implements IQuery {
    constructor(public readonly data: IGetSnapshotContentForApprovalQuery) {}
}
