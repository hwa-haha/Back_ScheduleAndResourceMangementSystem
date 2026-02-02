import { IQuery } from '@nestjs/cqrs';
import { IGetEmployeesForWorkHoursStatisticsQuery } from '../../../interfaces/query/get-employees-for-work-hours-statistics-query.interface';

/**
 * 시수 통계 대상 직원 결정 Query
 */
export class GetEmployeesForWorkHoursStatisticsQuery implements IQuery {
    constructor(public readonly data: IGetEmployeesForWorkHoursStatisticsQuery) {}
}
