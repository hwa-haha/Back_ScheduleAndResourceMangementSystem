import { QueryHandler, IQueryHandler, QueryBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetDepartmentSnapshotsQuery } from './get-department-snapshots.query';
import { IGetDepartmentSnapshotsResponse, ISnapshotInfo } from '../../interfaces';
import { GetDepartmentMonthlySnapshotChildrenQuery } from './get-department-monthly-snapshot-children.query';

/**
 * 부서별 연도, 월별 스냅샷 조회 Query Handler
 *
 * 특정 부서의 연도, 월별 스냅샷 목록을 조회합니다.
 */
@QueryHandler(GetDepartmentSnapshotsQuery)
export class GetDepartmentSnapshotsHandler implements IQueryHandler<
    GetDepartmentSnapshotsQuery,
    IGetDepartmentSnapshotsResponse
> {
    private readonly logger = new Logger(GetDepartmentSnapshotsHandler.name);

    constructor(private readonly queryBus: QueryBus) {}

    async execute(query: GetDepartmentSnapshotsQuery): Promise<IGetDepartmentSnapshotsResponse> {
        const { departmentId, year, month } = query.data;

        this.logger.log(`부서별 연도, 월별 스냅샷 조회: departmentId=${departmentId}, year=${year}, month=${month}`);

        // GetDepartmentMonthlySnapshotChildrenQuery를 실행하여 selectedChildren 조회
        const snapshotChildrenResult = await this.queryBus.execute(
            new GetDepartmentMonthlySnapshotChildrenQuery({ departmentId, year, month }),
        );

        // selectedChildren이 없으면 null 반환
        if (snapshotChildrenResult.selectedChildren.length === 0) {
            return null;
        }

        // 첫 번째 child의 parentSnapshot을 기준으로 스냅샷 정보 생성 (스냅샷은 하나만 조회됨)
        const firstChild = snapshotChildrenResult.selectedChildren[0];
        const parentSnapshot = firstChild.parentSnapshot;

        if (!parentSnapshot) {
            return null;
        }

        // createdAt 또는 created_at 필드에서 날짜 가져오기
        const createdAtValue = (parentSnapshot as any).createdAt || (parentSnapshot as any).created_at;

        // Date 객체인지 확인하고 변환
        const createdAt =
            createdAtValue instanceof Date
                ? createdAtValue.toISOString()
                : typeof createdAtValue === 'string'
                  ? createdAtValue
                  : createdAtValue
                    ? new Date(createdAtValue).toISOString()
                    : new Date().toISOString();

        // 모든 children을 변환
        const children = snapshotChildrenResult.selectedChildren.map((child) => ({
            id: child.id,
            employeeId: child.employee_id,
            employeeName: child.employee_name,
            employeeNumber: child.employee_number,
            yyyy: child.yyyy,
            mm: child.mm,
            snapshotData: child.snapshot_data,
            // rawData는 제거
        }));

        return {
            id: parentSnapshot.id,
            snapshotName: parentSnapshot.snapshotName,
            year: parentSnapshot.yyyy,
            month: parentSnapshot.mm,
            createdAt,
            children,
        };
    }
}
