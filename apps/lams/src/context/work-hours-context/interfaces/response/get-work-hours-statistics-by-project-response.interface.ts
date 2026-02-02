import { IDailyWorkHoursItem } from './get-work-hours-statistics-response.interface';

/**
 * 프로젝트별 시수 통계 항목
 */
export interface IWorkHoursStatisticsByProjectItem {
    projectId: string;
    projectName: string;
    projectCode: string;
    /** 해당 월 일자별 시수 (날짜·시수 객체 배열) */
    dailyWorkHours: IDailyWorkHoursItem[];
    /** 해당 월 총 시수 (시간 단위) */
    totalWorkHours: number;
}

/**
 * 프로젝트 기준 시수 통계 조회 응답 인터페이스
 */
export interface IGetWorkHoursStatisticsByProjectResponse {
    year: string;
    month: string;
    items: IWorkHoursStatisticsByProjectItem[];
}
