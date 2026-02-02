/**
 * 일별 시수 조회 응답 인터페이스
 */
export interface IGetDailyWorkHoursResponse {
    employeeId: string;
    date: string;
    workHours: Array<{
        projectId: string;
        projectName: string;
        projectCode: string;
        date: string;
        startTime: string | null;
        endTime: string | null;
        workMinutes: number;
        note: string | null;
    }>;
    totalWorkMinutes: number;
}
