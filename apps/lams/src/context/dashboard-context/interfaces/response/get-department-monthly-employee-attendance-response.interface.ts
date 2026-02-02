/**
 * 근태 사용 내역 정보
 */
export interface IAttendanceUsage {
    businessTrip: number;
    annualLeave: number;
    absence: number;
    late: number;
    earlyLeave: number;
}

/**
 * 직원별 근무내역 정보
 */
export interface IEmployeeAttendance {
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    attendanceUsage: IAttendanceUsage;
}

/**
 * 부서별 월별 직원별 근무내역 조회 응답 인터페이스
 */
export interface IGetDepartmentMonthlyEmployeeAttendanceResponse {
    departmentId: string;
    year: string;
    month: string;
    employeeAttendances: IEmployeeAttendance[];
}
