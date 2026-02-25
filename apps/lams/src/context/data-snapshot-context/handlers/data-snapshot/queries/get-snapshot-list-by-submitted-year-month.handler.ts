import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetSnapshotListBySubmittedYearMonthQuery } from './get-snapshot-list-by-submitted-year-month.query';
import { IGetSnapshotListResponse } from '../../../interfaces/response/get-snapshot-list-response.interface';
import { DomainDataSnapshotInfoService } from '../../../../../domain/data-snapshot-info/data-snapshot-info.service';

/**
 * 제출일(submitted_at) 기준 연·월로 스냅샷 목록 조회 Query Handler
 *
 * 해당 연월에 제출된 스냅샷만 조회하며, 최신 제출순으로 반환합니다.
 */
@QueryHandler(GetSnapshotListBySubmittedYearMonthQuery)
export class GetSnapshotListBySubmittedYearMonthHandler
    implements IQueryHandler<GetSnapshotListBySubmittedYearMonthQuery, IGetSnapshotListResponse>
{
    private readonly logger = new Logger(GetSnapshotListBySubmittedYearMonthHandler.name);

    constructor(private readonly dataSnapshotInfoService: DomainDataSnapshotInfoService) {}

    async execute(query: GetSnapshotListBySubmittedYearMonthQuery): Promise<IGetSnapshotListResponse> {
        const { year, month } = query.data;
        const monthStr = month.padStart(2, '0');

        this.logger.log(`제출연월 기준 스냅샷 목록 조회: year=${year}, month=${monthStr}`);

        const snapshots = await this.dataSnapshotInfoService.제출연월로목록조회한다(year, monthStr);

        const withoutChildren = snapshots.map((snapshot) => {
            const copy = { ...snapshot };
            delete copy.children;
            return copy;
        });

        const latestSnapshot = withoutChildren.length > 0 ? withoutChildren[0] : null;

        this.logger.log(
            `제출연월 기준 스냅샷 목록 조회 완료: totalCount=${withoutChildren.length}, latestSnapshotId=${latestSnapshot?.id || '없음'}`,
        );

        return {
            latestSnapshot,
            snapshots: withoutChildren,
            totalCount: withoutChildren.length,
        };
    }
}
