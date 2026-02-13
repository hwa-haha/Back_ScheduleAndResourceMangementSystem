import { IQuery } from '@nestjs/cqrs';
import { IGetAssignmentHistoryByYearMonthDepartmentQuery } from '../../../interfaces/query/get-assignment-history-by-year-month-department-query.interface';

/**
 * 특정 연월·부서(및 하위 부서) 배치이력 조회 Query
 */
export class GetAssignmentHistoryByYearMonthDepartmentQuery implements IQuery {
    constructor(public readonly data: IGetAssignmentHistoryByYearMonthDepartmentQuery) {}
}
