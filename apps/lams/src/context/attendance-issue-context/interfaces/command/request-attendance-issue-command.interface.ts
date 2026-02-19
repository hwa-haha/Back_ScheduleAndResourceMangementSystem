/**
 * 근태 이슈 요청 Command 인터페이스 (PENDING → REQUEST, 복수 ID)
 */
export interface IRequestAttendanceIssueCommand {
    ids: string[];
    userId: string;
}
