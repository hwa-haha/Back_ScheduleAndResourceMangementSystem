import { IQuery } from '@nestjs/cqrs';
import { IComputeDepartmentMonthlyAveragesQuery } from '../../interfaces/query/compute-department-monthly-averages-query.interface';

/**
 * 부서별 월별 일평균 근무시간 계산 Query (선택된 child 기반)
 */
export class ComputeDepartmentMonthlyAveragesQuery implements IQuery {
    constructor(public readonly data: IComputeDepartmentMonthlyAveragesQuery) {}
}
