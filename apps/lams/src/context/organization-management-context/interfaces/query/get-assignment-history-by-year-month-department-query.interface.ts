/**
 * 특정 연월·부서(및 하위 부서) 배치이력 조회 Query 인터페이스
 */
export interface IGetAssignmentHistoryByYearMonthDepartmentQuery {
    year: string;
    month: string;
    departmentId: string;
}
