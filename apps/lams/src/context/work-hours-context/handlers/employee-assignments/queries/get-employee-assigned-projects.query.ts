import { IQuery } from '@nestjs/cqrs';
import { IGetEmployeeAssignedProjectsQuery } from '../../../interfaces/query/get-employee-assigned-projects-query.interface';

/**
 * 직원별 할당 프로젝트 목록 조회 Query
 */
export class GetEmployeeAssignedProjectsQuery implements IQuery {
    constructor(public readonly data: IGetEmployeeAssignedProjectsQuery) {}
}
