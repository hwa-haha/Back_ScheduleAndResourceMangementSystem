/**
 * 시수 수정 Command 인터페이스
 */
export interface IUpdateWorkHoursCommand {
    id: string;
    startTime?: string;
    endTime?: string;
    workMinutes?: number;
    performedBy?: string;
}
