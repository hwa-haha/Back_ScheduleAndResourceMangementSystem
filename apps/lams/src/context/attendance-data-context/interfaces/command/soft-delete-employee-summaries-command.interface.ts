/**
 * 특정 직원의 특정 연월 일간/월간 요약 소프트 삭제 커맨드 인터페이스
 */
export interface ISoftDeleteEmployeeSummariesCommand {
    employeeId: string;
    year: string;
    month: string;
    performedBy: string;
}
