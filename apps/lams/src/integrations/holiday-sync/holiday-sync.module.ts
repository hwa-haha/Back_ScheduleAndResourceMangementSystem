import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DomainHolidayInfoModule } from '../../domain/holiday-info/holiday-info.module';
import { HolidaySyncService } from './holiday-sync.service';

/**
 * 공휴일 공공 API 동기화 모듈
 * - 매년 1월 1일 00:00(KST)에 해당 연도 휴일 API 조회 후 DB 업데이트
 */
@Module({
    imports: [
        HttpModule.register({ timeout: 10000, maxRedirects: 5 }),
        DomainHolidayInfoModule,
    ],
    providers: [HolidaySyncService],
    exports: [HolidaySyncService],
})
export class HolidaySyncModule {}
