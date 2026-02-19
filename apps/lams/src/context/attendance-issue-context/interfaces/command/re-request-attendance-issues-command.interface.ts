/**
 * 근태 이슈 재요청 Command 인터페이스 (복수 ID)
 */
export interface IReRequestAttendanceIssuesCommand {
    ids: string[];
    userId: string;
}
