import { IQuery } from '@nestjs/cqrs';
import { ICheckEmployeeSnapshotExistsQuery } from '../../../interfaces/query/check-employee-snapshot-exists-query.interface';

/**
 * 해당 직원 해당 연월 스냅샷 존재 여부 조회 Query
 */
export class CheckEmployeeSnapshotExistsQuery implements IQuery {
    constructor(public readonly data: ICheckEmployeeSnapshotExistsQuery) {}
}
