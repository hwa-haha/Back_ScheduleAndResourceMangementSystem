import { MonthlyEventSummaryDTO } from '../../../../domain/monthly-event-summary/monthly-event-summary.types';

/**
 * 특정 직원의 월간 요약 업데이트 응답 인터페이스
 */
export interface IUpdateMonthlySummaryForEmployeeResponse {
    monthlySummary: MonthlyEventSummaryDTO;
}
