import { AttendanceIssueDTO } from '../../../../domain/attendance-issue/attendance-issue.types';

/**
 * 근태 이슈 재요청 Response 인터페이스 (복수 처리 결과)
 */
export interface IReRequestAttendanceIssuesResponse {
    issues: AttendanceIssueDTO[];
    reRequestedCount: number;
}
