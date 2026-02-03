/**
 * 월별 시수 현황 조회 응답 인터페이스
 */
export interface IGetMonthlyWorkHoursResponse {
    employeeId: string;
    year: string;
    month: string;
    workHours: Array<{
        id: string;
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
