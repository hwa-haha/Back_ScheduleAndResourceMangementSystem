import { EmployeeDepartmentPositionHistory } from '@libs/modules/employee-department-position-history/employee-department-position-history.entity';

/**
 * 월간 요약 조회 Query 인터페이스
 * employeeHistories가 있으면 해당 목록으로 직원 범위를 한정하고, 없으면 departmentId로 조회한다.
 */
export interface IGetMonthlySummariesQuery {
    year: string;
    month: string;
    departmentId: string;
    /** 연월·부서 기준으로 조회한 배치이력 목록. 있으면 이 목록으로 직원 범위를 한정한다. */
    employeeHistories?: EmployeeDepartmentPositionHistory[];
}
