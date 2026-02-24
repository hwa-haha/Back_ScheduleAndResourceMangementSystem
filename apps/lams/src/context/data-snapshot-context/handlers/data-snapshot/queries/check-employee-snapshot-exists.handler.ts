import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { CheckEmployeeSnapshotExistsQuery } from './check-employee-snapshot-exists.query';
import { ICheckEmployeeSnapshotExistsResponse } from '../../../interfaces/response/check-employee-snapshot-exists-response.interface';
import { DomainDataSnapshotInfoService } from '../../../../../domain/data-snapshot-info/data-snapshot-info.service';
import { SnapshotType } from '../../../../../domain/data-snapshot-info/data-snapshot-info.types';

/**
 * 해당 직원 해당 연월 스냅샷 존재 여부 조회 Query Handler
 *
 * 근태 상세 조회와 동일한 기준으로, 해당 연월·MONTHLY 타입 스냅샷 중
 * 해당 직원에 대한 child 데이터가 있는지 여부만 반환합니다.
 */
@QueryHandler(CheckEmployeeSnapshotExistsQuery)
export class CheckEmployeeSnapshotExistsHandler implements IQueryHandler<
    CheckEmployeeSnapshotExistsQuery,
    ICheckEmployeeSnapshotExistsResponse
> {
    private readonly logger = new Logger(CheckEmployeeSnapshotExistsHandler.name);

    constructor(private readonly dataSnapshotInfoService: DomainDataSnapshotInfoService) {}

    async execute(query: CheckEmployeeSnapshotExistsQuery): Promise<ICheckEmployeeSnapshotExistsResponse> {
        const { employeeId, year, month } = query.data;
        const mm = month.padStart(2, '0');

        const snapshots = await this.dataSnapshotInfoService.연월과타입으로목록조회_자식직원필터한다(
            year,
            mm,
            SnapshotType.MONTHLY,
            [employeeId],
        );
        const exists = snapshots.length > 0 && snapshots.some((s) => s.children != null && s.children.length > 0);

        this.logger.log(`직원 스냅샷 존재 여부: employeeId=${employeeId}, year=${year}, month=${mm}, exists=${exists}`);

        return { exists };
    }
}
