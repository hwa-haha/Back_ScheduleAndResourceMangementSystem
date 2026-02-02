import type { IEmployeeInfoForWorkHoursStatistics } from '../response/get-employees-for-work-hours-statistics-response.interface';

/**
 * 시수 통계 조회 요청 쿼리 인터페이스 (API·서비스 진입용)
 *
 * 월별·부서(및 하위부서) 또는 전체 부서 기준, 직원명·부서명 검색, 직원 필터 지원
 */
export interface IGetWorkHoursStatisticsQuery {
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

/**
 * 시수 통계 조회용 해소된 페이로드 (직원 결정 후 통계 핸들러에 전달)
 */
export interface IGetWorkHoursStatisticsResolvedPayload {
    year: string;
    month: string;
    employeeIds: string[];
    employeeInfoItems: IEmployeeInfoForWorkHoursStatistics[];
}
