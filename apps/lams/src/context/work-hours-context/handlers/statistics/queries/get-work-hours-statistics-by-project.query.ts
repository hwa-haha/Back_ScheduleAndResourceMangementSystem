import { IQuery } from '@nestjs/cqrs';
import { IGetWorkHoursStatisticsByProjectQuery } from '../../../interfaces/query/get-work-hours-statistics-by-project-query.interface';

/**
 * 프로젝트 기준 시수 통계 조회 Query
 */
export class GetWorkHoursStatisticsByProjectQuery implements IQuery {
    constructor(public readonly data: IGetWorkHoursStatisticsByProjectQuery) {}
}
