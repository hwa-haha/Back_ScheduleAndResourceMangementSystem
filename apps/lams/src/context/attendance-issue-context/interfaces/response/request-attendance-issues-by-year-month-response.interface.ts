import { AttendanceIssueDTO } from '../../../../domain/attendance-issue/attendance-issue.types';

/**
 * 연월별 근태 이슈 상태별 일괄 처리 Response
 * - pending → 요청, not_applied → 재요청, request/applied → 미동작
 */
export interface IRequestAttendanceIssuesByYearMonthResponse {
    issues: AttendanceIssueDTO[];
    requestedCount: number;
    reRequestedCount: number;
}
