import { IQuery } from '@nestjs/cqrs';
import { IGetSnapshotListQuery } from '../../../interfaces/query/get-snapshot-list-query.interface';

/**
 * 제출일(submitted_at) 기준 연·월로 스냅샷 목록 조회 Query
 */
export class GetSnapshotListBySubmittedYearMonthQuery implements IQuery {
    constructor(public readonly data: IGetSnapshotListQuery) {}
}
