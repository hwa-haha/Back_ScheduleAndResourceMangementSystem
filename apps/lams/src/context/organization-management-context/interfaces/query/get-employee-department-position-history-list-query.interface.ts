/**
 * 연월별 직원배치이력 목록 조회 Query 인터페이스
 */
export interface IGetEmployeeDepartmentPositionHistoryListQuery {
    year: string;
    month: string;
    /** 지정 시 해당 부서와 그 하위 부서에 속한 배치이력만 반환 */
    departmentId?: string;
}
