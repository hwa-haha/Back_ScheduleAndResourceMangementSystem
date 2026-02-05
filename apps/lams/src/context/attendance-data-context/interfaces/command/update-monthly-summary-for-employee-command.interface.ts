/**
 * 특정 직원의 월간 요약 업데이트 커맨드 인터페이스
 */
export interface IUpdateMonthlySummaryForEmployeeCommand {
    employeeId: string;
    year: string;
    month: string;
    performedBy: string;
}
