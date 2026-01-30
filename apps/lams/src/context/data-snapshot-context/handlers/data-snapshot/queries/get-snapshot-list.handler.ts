import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetSnapshotListQuery } from './get-snapshot-list.query';
import { IGetSnapshotListResponse } from '../../../interfaces/response/get-snapshot-list-response.interface';
import { DomainDataSnapshotInfoService } from '../../../../../domain/data-snapshot-info/data-snapshot-info.service';
import { DataSnapshotInfoDTO, SnapshotType } from '../../../../../domain/data-snapshot-info/data-snapshot-info.types';

/**
 * 스냅샷 목록 조회 Query Handler
 *
 * 연월을 기준으로 스냅샷 데이터를 조회합니다.
 * 기본적으로 가장 최신 스냅샷을 반환하며, 조건 변경에 유연하게 대응할 수 있도록 구성됩니다.
 */
@QueryHandler(GetSnapshotListQuery)
export class GetSnapshotListHandler implements IQueryHandler<GetSnapshotListQuery, IGetSnapshotListResponse> {
    private readonly logger = new Logger(GetSnapshotListHandler.name);

    constructor(private readonly dataSnapshotInfoService: DomainDataSnapshotInfoService) {}

    async execute(query: GetSnapshotListQuery): Promise<IGetSnapshotListResponse> {
        const { year, month } = query.data;

        this.logger.log(`스냅샷 목록 조회 시작: year=${year}, month=${month}`);

        // 1. 기본 조건으로 스냅샷 목록 조회
        const allSnapshots = await this.dataSnapshotInfoService.연월과타입으로목록조회한다(
            year,
            month,
            SnapshotType.MONTHLY, // 기본 타입 (향후 filters로 확장 가능)
        );

        // 2. 추가 필터 적용 (향후 확장 가능)
        let filteredSnapshots = allSnapshots;
        // if (filters) {
        //     filteredSnapshots = this.필터적용한다(filteredSnapshots, filters);
        // }
        filteredSnapshots = filteredSnapshots.map((snapshot) => {
            delete snapshot.children;
            return snapshot;
        });
        // 3. 정렬 적용
        const sortedSnapshots = this.정렬적용한다(filteredSnapshots);

        // 5. 가장 최신 스냅샷 추출
        const latestSnapshot = sortedSnapshots.length > 0 ? sortedSnapshots[0] : null;

        this.logger.log(
            `스냅샷 목록 조회 완료: totalCount=${sortedSnapshots.length}, latestSnapshotId=${latestSnapshot?.id || '없음'}`,
        );

        return {
            latestSnapshot,
            snapshots: sortedSnapshots,
            totalCount: sortedSnapshots.length,
        };
    }

    /**
     * 필터 조건을 적용한다
     *
     * 향후 확장 가능하도록 구조화된 필터링 로직
     */
    private 필터적용한다(
        snapshots: any[],
        filters: { snapshotType?: string; dateRange?: { startDate?: string; endDate?: string } },
    ): any[] {
        let filtered = [...snapshots];

        // 스냅샷 타입 필터
        if (filters.snapshotType) {
            filtered = filtered.filter((snapshot) => snapshot.snapshotType === filters.snapshotType);
        }

        // 날짜 범위 필터
        if (filters.dateRange) {
            const { startDate, endDate } = filters.dateRange;
            if (startDate) {
                filtered = filtered.filter((snapshot) => {
                    const createdAt = new Date(snapshot.createdAt);
                    return createdAt >= new Date(startDate);
                });
            }
            if (endDate) {
                filtered = filtered.filter((snapshot) => {
                    const createdAt = new Date(snapshot.createdAt);
                    return createdAt <= new Date(endDate);
                });
            }
        }

        return filtered;
    }

    /**
     * 정렬 조건을 적용한다
     *
     * 향후 확장 가능하도록 구조화된 정렬 로직
     */
    private 정렬적용한다(snapshots: DataSnapshotInfoDTO[], sortBy?: string): DataSnapshotInfoDTO[] {
        const sorted = [...snapshots];

        switch (sortBy) {
            // case 'latest':
            //     // 최신순 (기본값) - created_at DESC
            //     sorted.sort((a, b) => {
            //         const dateA = new Date(a.createdAt).getTime();
            //         const dateB = new Date(b.createdAt).getTime();
            //         return dateB - dateA;
            //     });
            //     break;
            // case 'oldest':
            //     // 오래된순 - created_at ASC
            //     sorted.sort((a, b) => {
            //         const dateA = new Date(a.createdAt).getTime();
            //         const dateB = new Date(b.createdAt).getTime();
            //         return dateA - dateB;
            //     });
            //     break;
            // case 'name':
            //     // 이름순
            //     sorted.sort((a, b) => a.snapshotName.localeCompare(b.snapshotName, 'ko'));
            //     break;
            // case 'type':
            //     // 타입순
            //     sorted.sort((a, b) => a.snapshotType.localeCompare(b.snapshotType));
            //     break;
            default:
                // 기본값: 최신순
                sorted.sort((a, b) => b.snapshotVersion.localeCompare(a.snapshotVersion));
            }

            return sorted;
        }
    }
