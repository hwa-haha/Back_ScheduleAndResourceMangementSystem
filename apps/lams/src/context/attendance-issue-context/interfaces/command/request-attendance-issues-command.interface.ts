/**
 * 근태 이슈 요청 Command 인터페이스 (PENDING → REQUEST, 복수 ID 벌크)
 */
export interface IRequestAttendanceIssuesCommand {
    ids: string[];
    userId: string;
}
