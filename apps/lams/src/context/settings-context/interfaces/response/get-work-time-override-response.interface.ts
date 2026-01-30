import { WorkTimeOverrideDTO } from '../../../../domain/work-time-override/work-time-override.types';

/**
 * 특별근태시간 단건 조회 응답 인터페이스
 */
export interface IGetWorkTimeOverrideResponse {
    workTimeOverride: WorkTimeOverrideDTO;
}
