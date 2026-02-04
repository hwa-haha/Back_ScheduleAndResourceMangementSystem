/**
 * 스냅샷 자식 정보
 */
export interface ISnapshotChildInfo {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    yyyy: string;
    mm: string;
    snapshotData: string;
}

/**
 * 스냅샷 정보
 */
export interface ISnapshotInfo {
    id: string;
    snapshotName: string;
    year: string;
    month: string;
    createdAt: string;
    children?: ISnapshotChildInfo[];
}

/**
 * 부서별 연도, 월별 스냅샷 조회 응답 인터페이스
 */
export type IGetDepartmentSnapshotsResponse = ISnapshotInfo | null;
