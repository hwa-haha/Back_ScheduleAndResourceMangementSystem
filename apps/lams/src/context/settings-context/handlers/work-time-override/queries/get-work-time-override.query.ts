import { IQuery } from '@nestjs/cqrs';
import { IGetWorkTimeOverrideQuery } from '../../../interfaces/query/get-work-time-override-query.interface';

/**
 * 특별근태시간 단건 조회 Query (id 또는 date로 조회)
 */
export class GetWorkTimeOverrideQuery implements IQuery {
    constructor(public readonly data: IGetWorkTimeOverrideQuery) {}
}
