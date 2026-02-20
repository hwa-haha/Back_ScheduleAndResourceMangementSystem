import { IQuery } from '@nestjs/cqrs';
import { IGetEmployeeDepartmentPositionHistoryListQuery } from '../../../interfaces/query/get-employee-department-position-history-list-query.interface';

/**
 * 연월별 직원배치이력 목록 조회 Query
 */
export class GetEmployeeDepartmentPositionHistoryListQuery implements IQuery {
    constructor(public readonly data: IGetEmployeeDepartmentPositionHistoryListQuery) {}
}
