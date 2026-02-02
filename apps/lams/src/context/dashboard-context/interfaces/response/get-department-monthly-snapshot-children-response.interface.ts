import { DataSnapshotChild } from '../../../../domain/data-snapshot-child/data-snapshot-child.entity';

/**
 * 부서별 월별 스냅샷 child 조회 응답 인터페이스
 */
export interface IGetDepartmentMonthlySnapshotChildrenResponse {
    departmentId: string;
    year: string;
    month: string;
    selectedChildren: DataSnapshotChild[];
}
