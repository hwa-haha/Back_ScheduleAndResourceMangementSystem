/**
 * 특별근태시간 단건 조회 Query 인터페이스
 * id 또는 date 중 하나는 반드시 제공해야 한다.
 */
export interface IGetWorkTimeOverrideQuery {
    /** 특별근태시간 ID (UUID) */
    id?: string;
    /** 적용 날짜 (YYYY-MM-DD) */
    date?: string;
}
