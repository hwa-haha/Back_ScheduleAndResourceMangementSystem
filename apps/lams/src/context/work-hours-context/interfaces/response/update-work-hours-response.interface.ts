import { WorkHoursDTO } from '../../../../domain/work-hours/work-hours.types';

/**
 * 시수 수정 응답 인터페이스
 */
export interface IUpdateWorkHoursResponse {
    workHours: WorkHoursDTO;
}
