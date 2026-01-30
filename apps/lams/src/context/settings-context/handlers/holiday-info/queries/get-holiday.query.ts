import { IQuery } from '@nestjs/cqrs';
import { IGetHolidayQuery } from '../../../interfaces/query/get-holiday-query.interface';

/**
 * 휴일 단건 조회 Query (id 또는 date로 조회)
 */
export class GetHolidayQuery implements IQuery {
    constructor(public readonly data: IGetHolidayQuery) {}
}
