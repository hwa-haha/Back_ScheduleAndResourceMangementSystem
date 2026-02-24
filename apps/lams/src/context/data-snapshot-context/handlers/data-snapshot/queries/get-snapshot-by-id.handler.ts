import { QueryHandler, IQueryHandler, QueryBus } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { GetSnapshotByIdQuery } from './get-snapshot-by-id.query';
import { IGetSnapshotByIdResponse } from '../../../interfaces/response/get-snapshot-by-id-response.interface';
import { DomainDataSnapshotInfoService } from '../../../../../domain/data-snapshot-info/data-snapshot-info.service';
import { GetAssignmentHistoryByYearMonthDepartmentQuery } from '../../../../organization-management-context';

/**
 * 스냅샷 ID로 스냅샷과 하위 스냅샷 조회 핸들러
 *
 * departmentId가 있으면 QueryBus로 배치이력 조회 핸들러를 호출해 해당 부서 직원 child만 필터링합니다.
 */
@QueryHandler(GetSnapshotByIdQuery)
export class GetSnapshotByIdHandler implements IQueryHandler<GetSnapshotByIdQuery, IGetSnapshotByIdResponse> {
    private readonly logger = new Logger(GetSnapshotByIdHandler.name);

    constructor(
        private readonly dataSnapshotInfoService: DomainDataSnapshotInfoService,
        private readonly queryBus: QueryBus,
    ) {}

    async execute(query: GetSnapshotByIdQuery): Promise<IGetSnapshotByIdResponse> {
        const { snapshotId, departmentId } = query.data;

        this.logger.log(`스냅샷 조회 시작: snapshotId=${snapshotId}, departmentId=${departmentId}`);

        const snapshot = await this.dataSnapshotInfoService.자식포함조회한다(snapshotId);

        if (!snapshot) {
            throw new NotFoundException(`스냅샷을 찾을 수 없습니다. (snapshotId: ${snapshotId})`);
        }

        if (departmentId && snapshot.children?.length) {
            const departmentEmployees = await this.queryBus.execute(
                new GetAssignmentHistoryByYearMonthDepartmentQuery({
                    year: snapshot.yyyy,
                    month: snapshot.mm,
                    departmentId,
                }),
            );
            const employeeIds = new Set(departmentEmployees.map((h) => h.employeeId));
            const filteredChildren = snapshot.children
                .filter((child) => employeeIds.has(child.employeeId))
                .sort((a, b) => a.employeeNumber.localeCompare(b.employeeNumber));
            this.logger.log(`스냅샷 조회 완료: snapshotId=${snapshotId}, filteredChildren=${filteredChildren.length}`);
            return { snapshot: { ...snapshot, children: filteredChildren } };
        }
        this.logger.log(`스냅샷 조회 완료: snapshotId=${snapshotId}, children=${snapshot.children?.length || 0}`);
        return { snapshot };
    }
}
