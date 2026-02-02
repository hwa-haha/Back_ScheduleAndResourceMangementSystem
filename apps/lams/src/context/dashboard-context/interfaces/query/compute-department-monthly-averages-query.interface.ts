import { DataSnapshotChild } from '../../../../domain/data-snapshot-child/data-snapshot-child.entity';

/**
 * 부서별 월별 일평균 근무시간 계산 쿼리 인터페이스 (선택된 child 기반)
 */
export interface IComputeDepartmentMonthlyAveragesQuery {
    departmentId: string;
    year: string;
    monthlySelections: Array<{
        month: string;
        selectedChildren: DataSnapshotChild[];
    }>;
}
