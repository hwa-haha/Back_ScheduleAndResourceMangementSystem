/**
 * 일자별 시수 (날짜 + 시수)
 */
export interface IDailyWorkHoursItem {
    /** 날짜 (YYYY-MM-DD) */
    date: string;
    /** 해당 일 시수 (시간) */
    workHours: number;
}

/**
 * 직원별 시수 통계 항목
 */
export interface IWorkHoursStatisticsItem {
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    departmentName: string;
    /** 해당 월 일자별 시수 (날짜·시수 객체 배열) */
    dailyWorkHours: IDailyWorkHoursItem[];
    /** 해당 월 총 시수 (시간 단위) */
    totalWorkHours: number;
}

/**
 * 시수 통계 조회 응답 인터페이스
 */
export interface IGetWorkHoursStatisticsResponse {
    year: string;
    month: string;
    items: IWorkHoursStatisticsItem[];
}
