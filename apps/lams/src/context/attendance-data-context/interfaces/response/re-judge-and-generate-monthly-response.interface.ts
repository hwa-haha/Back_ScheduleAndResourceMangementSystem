import { DailyEventSummaryDTO } from '../../../../domain/daily-event-summary/daily-event-summary.types';
import { IGenerateMonthlySummariesResponse } from './generate-monthly-summaries-response.interface';

/**
 * 일간 요약 재판정 후 월간 요약 생성 응답
 */
export interface IReJudgeAndGenerateMonthlyResponse {
    /** 재판정된 일간 요약 목록 */
    reJudgeSummaries: DailyEventSummaryDTO[];
    /** 월간 요약 생성 결과 */
    monthlyResult: IGenerateMonthlySummariesResponse;
}
