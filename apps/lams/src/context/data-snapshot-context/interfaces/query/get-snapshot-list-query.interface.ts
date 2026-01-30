/**
 * 스냅샷 목록 조회 Query 인터페이스
 */
export interface IGetSnapshotListQuery {
    year: string;
    month: string;
    /**
     * 정렬 기준 (기본값: 'latest' - 최신순)
     * 향후 확장 가능: 'oldest', 'name', 'type' 등
     */
    // sortBy?: 'latest' | 'oldest' | 'name' | 'type';
    /**
     * 필터 조건 (향후 확장 가능)
     */
    // filters?: {
    //     snapshotType?: string;
    //     dateRange?: {
    //         startDate?: string;
    //         endDate?: string;
    //     };
    // };
}
