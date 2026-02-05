import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { GetSnapshotByIdQuery } from './get-snapshot-by-id.query';
import { IGetSnapshotByIdResponse } from '../../../interfaces/response/get-snapshot-by-id-response.interface';
import { DomainDataSnapshotInfoService } from '../../../../../domain/data-snapshot-info/data-snapshot-info.service';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';

/**
 * 스냅샷 ID로 스냅샷과 하위 스냅샷 조회 핸들러
 *
 * 부서 ID를 제공하면 해당 부서의 해당 연월(첫날부터 말일까지)에 소속되었던 직원들의 스냅샷 child 데이터만 반환합니다.
 */
@QueryHandler(GetSnapshotByIdQuery)
export class GetSnapshotByIdHandler implements IQueryHandler<GetSnapshotByIdQuery, IGetSnapshotByIdResponse> {
    private readonly logger = new Logger(GetSnapshotByIdHandler.name);

    constructor(
        private readonly dataSnapshotInfoService: DomainDataSnapshotInfoService,
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
    ) {}

    async execute(query: GetSnapshotByIdQuery): Promise<IGetSnapshotByIdResponse> {
        const { snapshotId, departmentId } = query.data;

        this.logger.log(`스냅샷 조회 시작: snapshotId=${snapshotId}, departmentId=${departmentId}`);

        const snapshot = await this.dataSnapshotInfoService.자식포함조회한다(snapshotId);

        if (!snapshot) {
            throw new NotFoundException(`스냅샷을 찾을 수 없습니다. (snapshotId: ${snapshotId})`);
        }

        // 부서 ID가 제공된 경우, 해당 부서의 해당 연월에 소속되었던 직원들의 child 데이터만 필터링
        if (departmentId && snapshot.children) {
            // 해당 부서의 해당 연월에 소속되었던 직원 리스트 조회
            const departmentEmployees =
                await this.employeeDepartmentPositionHistoryService.특정연월부서와하위부서의배치이력목록을조회한다(
                    snapshot.yyyy,
                    snapshot.mm,
                    departmentId,
                );

            // 직원 ID 목록 추출
            const employeeIds = departmentEmployees.map((history) => history.employeeId);
            this.logger.log(`부서별 직원 조회 완료: departmentId=${departmentId}, employeeCount=${employeeIds.length}`);

            // 해당 직원들의 child 데이터만 필터링
            const filteredChildren = snapshot.children
                .filter((child) => employeeIds.includes(child.employeeId))
                .sort((a, b) => a.employeeNumber.localeCompare(b.employeeNumber));

            this.logger.log(
                `스냅샷 조회 완료: snapshotId=${snapshotId}, totalChildren=${snapshot.children.length}, filteredChildren=${filteredChildren.length}`,
            );

            return {
                snapshot: {
                    ...snapshot,
                    children: filteredChildren,
                },
            };
        }

        this.logger.log(`스냅샷 조회 완료: snapshotId=${snapshotId}, children=${snapshot.children?.length || 0}`);

        return {
            snapshot,
        };
    }
}
