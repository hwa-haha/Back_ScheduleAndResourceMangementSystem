import { IQuery } from '@nestjs/cqrs';
import { IGetDailyWorkHoursQuery } from '../../../interfaces/query/get-daily-work-hours-query.interface';

/**
 * 일별 시수 조회 Query
 */
export class GetDailyWorkHoursQuery implements IQuery {
    constructor(public readonly data: IGetDailyWorkHoursQuery) {}
}
