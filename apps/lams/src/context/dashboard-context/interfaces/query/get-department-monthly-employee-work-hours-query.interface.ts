/**
 * 부서별 월별 직원별 근무시간 조회 쿼리 인터페이스
 */
export interface IGetDepartmentMonthlyEmployeeWorkHoursQuery {
    departmentId: string;
    year: string;
    month: string;
}
