import { AttendanceIssueDTO } from '../../../../domain/attendance-issue/attendance-issue.types';

/**
 * 근태 이슈 요청 Response 인터페이스 (단건 처리 결과)
 */
export interface IRequestAttendanceIssueResponse {
    issue: AttendanceIssueDTO;
}
