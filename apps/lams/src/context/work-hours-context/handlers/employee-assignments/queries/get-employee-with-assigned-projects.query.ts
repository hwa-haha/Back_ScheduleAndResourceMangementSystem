import { IQuery } from '@nestjs/cqrs';
import { IGetEmployeeWithAssignedProjectsQuery } from '../../../interfaces/query/get-employee-with-assigned-projects-query.interface';

/**
 * 직원 목록 및 할당 프로젝트 조회 Query
 */
export class GetEmployeeWithAssignedProjectsQuery implements IQuery {
    constructor(public readonly data: IGetEmployeeWithAssignedProjectsQuery) {}
}
