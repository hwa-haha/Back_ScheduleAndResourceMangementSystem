import { HolidayInfoDTO } from '../../../../domain/holiday-info/holiday-info.types';

/**
 * 휴일 단건 조회 응답 인터페이스
 */
export interface IGetHolidayResponse {
    holiday: HolidayInfoDTO;
}
