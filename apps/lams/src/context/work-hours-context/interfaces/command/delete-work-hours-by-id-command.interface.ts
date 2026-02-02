/**
 * 시수 ID별 삭제 Command 인터페이스
 */
export interface IDeleteWorkHoursByIdCommand {
    id: string;
    performedBy?: string;
}
