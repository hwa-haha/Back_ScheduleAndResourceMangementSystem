/**
 * 월간 요약 생성 커맨드 인터페이스
 */
export interface IGenerateMonthlySummariesCommand {
    year: string;
    month: string;
    performedBy: string;
    /**
     * 특정 직원 ID 목록 (선택적)
     * 제공되면 해당 직원들만 생성, 없으면 전체 직원 생성
     */
    employeeIds?: string[];
}
