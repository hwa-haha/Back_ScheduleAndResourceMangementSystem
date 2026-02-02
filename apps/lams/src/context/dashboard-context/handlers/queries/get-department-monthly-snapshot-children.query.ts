import { IQuery } from '@nestjs/cqrs';
import { IGetDepartmentMonthlySnapshotChildrenQuery } from '../../interfaces/query/get-department-monthly-snapshot-children-query.interface';

/**
 * 부서별 월별 스냅샷 child 조회 Query
 */
export class GetDepartmentMonthlySnapshotChildrenQuery implements IQuery {
    constructor(public readonly data: IGetDepartmentMonthlySnapshotChildrenQuery) {}
}
