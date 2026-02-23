/**
 * 근태 이슈 요청 Command 인터페이스 (PENDING → REQUEST, 단건)
 */
export interface IRequestAttendanceIssueCommand {
    id: string;
    userId: string;
}
