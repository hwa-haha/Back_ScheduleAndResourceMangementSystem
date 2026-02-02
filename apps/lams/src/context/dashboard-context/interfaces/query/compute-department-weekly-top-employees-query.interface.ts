import { DataSnapshotChild } from '../../../../domain/data-snapshot-child/data-snapshot-child.entity';

/**
 * 부서별 월별 주차별 주간근무시간 상위 5명 계산 쿼리 인터페이스 (선택된 child 기반)
 */
export interface IComputeDepartmentWeeklyTopEmployeesQuery {
    departmentId: string;
    year: string;
    month: string;
    selectedChildren: DataSnapshotChild[];
}
