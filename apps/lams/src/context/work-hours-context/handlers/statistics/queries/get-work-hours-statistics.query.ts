import { IQuery } from '@nestjs/cqrs';
import { IGetWorkHoursStatisticsResolvedPayload } from '../../../interfaces/query/get-work-hours-statistics-query.interface';

/**
 * 시수 통계 조회 Query (직원 결정이 완료된 페이로드만 받음)
 */
export class GetWorkHoursStatisticsQuery implements IQuery {
    constructor(public readonly data: IGetWorkHoursStatisticsResolvedPayload) {}
}
