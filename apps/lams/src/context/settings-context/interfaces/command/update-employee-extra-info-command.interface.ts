/**
 * 직원 추가 정보 변경 Command 인터페이스
 */
export interface IUpdateEmployeeExtraInfoCommand {
    employeeId: string;
    isExcludedFromSummary: boolean;
    performedBy: string;
    year?: string;
    month?: string;
}
