import { IQuery } from '@nestjs/cqrs';
import { IGetEmployeeExtraInfoListQuery } from '../../../interfaces/query/get-employee-extra-info-list-query.interface';

/**
 * 직원 목록 및 추가정보 조회 Query
 */
export class GetEmployeeExtraInfoListQuery implements IQuery {
    constructor(public readonly data: IGetEmployeeExtraInfoListQuery) {}
}
