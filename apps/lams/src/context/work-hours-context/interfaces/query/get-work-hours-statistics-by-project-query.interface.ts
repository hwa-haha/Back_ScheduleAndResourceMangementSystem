/**
 * 프로젝트 기준 시수 통계 조회 쿼리 인터페이스
 */
export interface IGetWorkHoursStatisticsByProjectQuery {
    year: string;
    month: string;
    /** 프로젝트 ID 필터 (선택). 이 목록에 있는 프로젝트만 조회 */
    projectIds?: string[];
}
