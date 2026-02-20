import { AttendanceIssueStatus } from '../../../../domain/attendance-issue/attendance-issue.types';

/**
 * 근태 이슈 목록 조회 Query 인터페이스
 */
export interface IGetAttendanceIssuesQuery {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: AttendanceIssueStatus;
    /** 지정 시 해당 ID 목록만 조회 (날짜/상태 필터와 함께 사용 가능) */
    issueIds?: string[];
}
