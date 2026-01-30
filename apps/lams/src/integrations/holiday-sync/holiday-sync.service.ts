import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DomainHolidayInfoService } from '../../domain/holiday-info/holiday-info.service';
import { CreateHolidayInfoData } from '../../domain/holiday-info/holiday-info.types';

/** 공공 API 휴일 응답 item 형식 */
interface HolidayApiItem {
    locdate?: number | string;
    dateName?: string;
    [key: string]: unknown;
}

@Injectable()
export class HolidaySyncService {
    private readonly logger = new Logger(HolidaySyncService.name);

    constructor(
        private readonly holidayInfoService: DomainHolidayInfoService,
        private readonly httpService: HttpService,
    ) {}

    /**
     * 매년 1월 1일 00:00에 해당 연도 공휴일 API 조회 후 DB 업데이트
     */
    @Cron('0 0 1 1 *', { timeZone: 'Asia/Seoul' })
    // 테스트용
    // 30초마다 동기화
    // @Cron('*/30 * * * * *', { timeZone: 'Asia/Seoul' })
    async 연도공휴일동기화한다(): Promise<void> {
        const year = String(new Date().getFullYear());
        this.logger.log(`공휴일 동기화 시작: ${year}년`);
        try {
            await this.공휴일을API로조회하여저장한다(year);
            this.logger.log(`공휴일 동기화 완료: ${year}년`);
        } catch (error) {
            this.logger.error(`공휴일 동기화 실패: ${year}년`, error);
        }
    }

    /**
     * 지정 연도의 공공 API 휴일을 조회한 뒤 기존 연도 데이터를 삭제하고 새로 저장한다.
     * (수동 호출 또는 cron 외에 API/테스트에서도 사용 가능)
     */
    async 공휴일을API로조회하여저장한다(year: string): Promise<void> {
        const url = process.env.HOLIDAY_API_URL;
        const apiKey = process.env.HOLIDAY_API_KEY;

        if (!url || !apiKey) {
            this.logger.warn('HOLIDAY_API_URL 또는 HOLIDAY_API_KEY 미설정으로 공휴일 동기화 스킵');
            return;
        }

        const foundHolidays: HolidayApiItem[] = [];
        for (let month = 1; month <= 12; month++) {
            const monthStr = String(month).padStart(2, '0');
            await this.월별휴일조회한다(url, apiKey, year, monthStr, foundHolidays);
        }

        await this.holidayInfoService.연도별공휴일일괄삭제한다(year);

        const toCreate: CreateHolidayInfoData[] = foundHolidays
            .map((item) => this.apiItemToCreateData(item))
            .filter((data): data is CreateHolidayInfoData => !!data.holidayDate && !!data.holidayName);

        for (const data of toCreate) {
            await this.holidayInfoService.생성한다(data);
        }
    }

    private async 월별휴일조회한다(
        baseUrl: string,
        apiKey: string,
        year: string,
        month: string,
        out: HolidayApiItem[],
    ): Promise<void> {
    
        try {
            const res = await firstValueFrom(
                this.httpService.get(
                    baseUrl ,
                    {
                        params: {
                            ServiceKey: apiKey,
                            solYear: year,
                            solMonth: month,
                        },
                    }
                ),
            )
         
            const items = res.data?.response?.body?.items;
            if (!items) return;

            const item = items.item;
            if (Array.isArray(item)) {
                out.push(...item);
            } else if (item && typeof item === 'object') {
                out.push(item);
            }
        } catch (error) {
            this.logger.warn(`휴일 API 조회 실패 ${year}-${month}`, error);
        }
    }

    private apiItemToCreateData(item: HolidayApiItem): CreateHolidayInfoData | null {
        const locdate = item.locdate;
        const dateName = item.dateName;
        if (locdate == null || dateName == null || typeof dateName !== 'string') return null;

        const dateStr = String(locdate);
        if (dateStr.length !== 8) return null;
        const holidayDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

        return { holidayName: dateName.trim(), holidayDate };
    }
}
