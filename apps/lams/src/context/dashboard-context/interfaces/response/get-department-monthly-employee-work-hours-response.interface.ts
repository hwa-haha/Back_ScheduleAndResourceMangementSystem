/**
 * 주차별 근무시간 정보
 */
export interface IWeeklyWorkHours {
    weekNumber: number;
    startDate: string;
    endDate: string;
    weeklyWorkHours: number; // 시간 단위
    /** 주별 지각 횟수 */
    lateCount: number;
    /** 주별 조퇴 횟수 */
    earlyLeaveCount: number;
    /** 주별 결근 횟수 */
    absentCount: number;
}

/**
 * 직원별 근무시간 정보
 */
export interface IEmployeeWorkHours {
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    totalWorkHours: number;
    lateCount: number;
    earlyLeaveCount: number;
    weeklyWorkHours: IWeeklyWorkHours[];
}

/**
 * 부서별 월별 직원별 근무시간 조회 응답 인터페이스
 */
export interface IGetDepartmentMonthlyEmployeeWorkHoursResponse {
    departmentId: string;
    year: string;
    month: string;
    employeeWorkHours: IEmployeeWorkHours[];
}
