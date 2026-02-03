import { IQuery } from '@nestjs/cqrs';
import { IGetDepartmentListQuery } from '../../../interfaces/query/get-department-list-query.interface';

/**
 * 부서 목록 + 부서별 직원 조회 Query (시점 기준)
 */
export class GetDepartmentListWithEmployeesQuery implements IQuery {
    constructor(public readonly data: IGetDepartmentListQuery) {}
}
