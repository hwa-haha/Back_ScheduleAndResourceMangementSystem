import { DataSnapshotChild } from '../../../../domain/data-snapshot-child/data-snapshot-child.entity';

/**
 * 부서별 월별 직원별 근무시간 계산 쿼리 인터페이스 (선택된 child 기반)
 */
export interface IComputeDepartmentMonthlyEmployeeWorkHoursQuery {
    departmentId: string;
    year: string;
    month: string;
    selectedChildren: DataSnapshotChild[];
}
