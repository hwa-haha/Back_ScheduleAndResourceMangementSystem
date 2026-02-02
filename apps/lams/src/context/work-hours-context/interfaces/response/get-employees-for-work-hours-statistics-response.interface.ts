/**
 * 시수 통계 대상 직원 정보 항목
 */
export interface IEmployeeInfoForWorkHoursStatistics {
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    departmentName: string;
}

/**
 * 시수 통계 대상 직원 결정 응답 인터페이스
 */
export interface IGetEmployeesForWorkHoursStatisticsResponse {
    employeeIds: string[];
    items: IEmployeeInfoForWorkHoursStatistics[];
}
