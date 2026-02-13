/**
 * 연월/부서별 근태 이슈 조회 Query 인터페이스
 *
 * 핸들러 내부에서 QueryBus로 배치이력 조회 핸들러를 호출합니다.
 */
export interface IGetAttendanceIssuesByDepartmentQuery {
    year: string;
    month: string;
    departmentId: string;
}
