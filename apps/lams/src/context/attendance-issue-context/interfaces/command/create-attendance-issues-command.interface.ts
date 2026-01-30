import { DailyEventSummary } from '../../../../domain/daily-event-summary/daily-event-summary.entity';

/**
 * 근태 이슈 생성 커맨드 인터페이스
 */
export interface ICreateAttendanceIssuesCommand {
    summaries: DailyEventSummary[];
    performedBy: string;
}
