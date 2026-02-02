/**
 * 직원 + 추가정보 한 건 응답 항목
 */
export interface IEmployeeWithExtraInfo {
    id: string;
    employeeNumber: string;
    employeeName: string;
    /** 직원 추가 정보 (없을 수 있음) */
    extraInfo: {
        id: string;
        employeeId: string;
        isExcludedFromSummary: boolean;
    } | null;
}

/**
 * 직원 목록 및 추가정보 조회 응답 인터페이스
 */
export interface IGetEmployeeExtraInfoListResponse {
    employees: IEmployeeWithExtraInfo[];
    totalCount: number;
}
