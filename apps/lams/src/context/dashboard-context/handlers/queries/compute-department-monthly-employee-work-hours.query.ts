import { IQuery } from '@nestjs/cqrs';
import { IComputeDepartmentMonthlyEmployeeWorkHoursQuery } from '../../interfaces/query/compute-department-monthly-employee-work-hours-query.interface';

/**
 * 부서별 월별 직원별 근무시간 계산 Query (선택된 child 기반)
 */
export class ComputeDepartmentMonthlyEmployeeWorkHoursQuery implements IQuery {
    constructor(public readonly data: IComputeDepartmentMonthlyEmployeeWorkHoursQuery) {}
}
