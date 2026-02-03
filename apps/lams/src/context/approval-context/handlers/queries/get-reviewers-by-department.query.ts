import { IQuery } from '@nestjs/cqrs';
import { IGetReviewersByDepartmentQuery } from '../../interfaces/query/get-reviewers-by-department-query.interface';

/**
 * 결재 관련 부서별 권한자 조회 Query
 */
export class GetReviewersByDepartmentQuery implements IQuery {
    constructor(public readonly data: IGetReviewersByDepartmentQuery) {}
}
