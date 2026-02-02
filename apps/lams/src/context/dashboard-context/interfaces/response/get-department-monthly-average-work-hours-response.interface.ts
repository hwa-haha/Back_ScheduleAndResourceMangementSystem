/**
 * 월별 평균 근무시간 정보 (1~12월 연간 조회용)
 */
export interface IMonthlyAverageWorkHours {
    month: string;
    averageWorkHours: number;
}

/**
 * 부서별 월별 일평균 근무시간 조회 응답 인터페이스
 */
export interface IGetDepartmentMonthlyAverageWorkHoursResponse {
    departmentId: string;
    year: string;
    monthlyAverages: IMonthlyAverageWorkHours[];
}
