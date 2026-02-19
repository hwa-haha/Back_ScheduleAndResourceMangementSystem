import { IQuery } from '@nestjs/cqrs';
import { IGetDepartmentPermissionListQuery } from '../../../interfaces/query/get-department-permission-list-query.interface';

/**
 * 특정 부서별 직원 권한 목록 조회 Query
 */
export class GetDepartmentPermissionListQuery implements IQuery {
    constructor(public readonly data: IGetDepartmentPermissionListQuery) {}
}
