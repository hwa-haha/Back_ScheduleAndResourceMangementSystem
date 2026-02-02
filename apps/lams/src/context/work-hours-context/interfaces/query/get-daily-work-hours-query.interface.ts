/**
 * 일별 시수 조회 Query 인터페이스
 */
export interface IGetDailyWorkHoursQuery {
    employeeId: string;
    date: string; // yyyy-MM-dd
}
