import { IQuery } from '@nestjs/cqrs';
import { IComputeDepartmentWeeklyTopEmployeesQuery } from '../../interfaces/query/compute-department-weekly-top-employees-query.interface';

/**
 * 부서별 월별 주차별 주간근무시간 상위 5명 계산 Query (선택된 child 기반)
 */
export class ComputeDepartmentWeeklyTopEmployeesQuery implements IQuery {
    constructor(public readonly data: IComputeDepartmentWeeklyTopEmployeesQuery) {}
}
