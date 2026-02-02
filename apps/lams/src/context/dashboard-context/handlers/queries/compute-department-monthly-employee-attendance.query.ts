import { IQuery } from '@nestjs/cqrs';
import { IComputeDepartmentMonthlyEmployeeAttendanceQuery } from '../../interfaces/query/compute-department-monthly-employee-attendance-query.interface';

/**
 * 부서별 월별 직원별 근무내역 계산 Query (선택된 child 기반)
 */
export class ComputeDepartmentMonthlyEmployeeAttendanceQuery implements IQuery {
    constructor(public readonly data: IComputeDepartmentMonthlyEmployeeAttendanceQuery) {}
}
