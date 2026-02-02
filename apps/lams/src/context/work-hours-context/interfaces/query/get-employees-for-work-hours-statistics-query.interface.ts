/**
 * 시수 통계 대상 직원 결정 쿼리 인터페이스
 *
 * 부서 ID 또는 직원 ID가 없으면 해당 연월 전체 직원을 대상으로 하고,
 * 직원명·부서명 검색으로 필터링합니다.
 */
export interface IGetEmployeesForWorkHoursStatisticsQuery {
    /** 연도 */
    year: string;
    /** 월 (01-12) */
    month: string;
    /** 선택된 부서 ID 목록 (비어 있거나 없으면 전체 부서 = 전체 직원) */
    departmentIds?: string[];
    /** 직원명 검색 (부분 일치, 선택) */
    employeeNameSearch?: string;
    /** 부서명 검색 (부분 일치, 선택) */
    departmentNameSearch?: string;
    /** 직원 ID 필터 (이 목록에 있는 직원만, 선택) */
    employeeIds?: string[];
}
