import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SchedulePostProcessingService } from '../../../context/schedule/services/schedule-post-processing.service';
import { ReservationContextService } from '../../../context/reservation/services/reservation.context.service';

/**
 * 예약 크론 작업 (EC2 등 서버 환경)
 * 호환용 기존 API: GET /v1/reservations/cron-job/close, GET /v1/reservations/cron-job/start-odometer
 */
@Injectable()
export class CronReservationService {
    private readonly logger = new Logger(CronReservationService.name);

    constructor(
        private readonly reservationContextService: ReservationContextService,
        private readonly schedulePostProcessingService: SchedulePostProcessingService,
    ) {}

    /** 매시 1분(At 1 minutes past the hour) 예약 마감·일정 배치 처리 */
    @Cron('0 1 * * * *', { timeZone: 'Asia/Seoul' })
    async closeReservationByCronAt1(): Promise<void> {
        await this.runCloseReservation();
    }

    /** 매시 31분(At 31 minutes past the hour) 예약 마감·일정 배치 처리 */
    @Cron('0 31 * * * *', { timeZone: 'Asia/Seoul' })
    async closeReservationByCronAt31(): Promise<void> {
        await this.runCloseReservation();
    }

    /** 매시 0분(Every hour) 시작 주행거리 처리 */
    @Cron('0 0 * * * *', { timeZone: 'Asia/Seoul' })
    async handleStartOdometerByCronAt0(): Promise<void> {
        await this.runHandleStartOdometer();
    }

    /** 매시 30분(At 30 minutes past the hour) 시작 주행거리 처리 */
    @Cron('0 30 * * * *', { timeZone: 'Asia/Seoul' })
    async handleStartOdometerByCronAt30(): Promise<void> {
        await this.runHandleStartOdometer();
    }

    private async runCloseReservation(): Promise<void> {
        this.logger.log('Cron: 예약 마감·배치 처리 실행');
        try {
            await this.closeReservation();
            this.logger.log('Cron: 예약 마감·배치 처리 완료');
        } catch (error) {
            this.logger.error('Cron: 예약 마감·배치 처리 실패', error);
        }
    }

    private async runHandleStartOdometer(): Promise<void> {
        this.logger.log('Cron: 시작 주행거리 처리 실행');
        try {
            await this.handleStartOdometer();
            this.logger.log('Cron: 시작 주행거리 처리 완료');
        } catch (error) {
            this.logger.error('Cron: 시작 주행거리 처리 실패', error);
        }
    }

    // ==================== 크론/API 공통 (호환용 API에서 그대로 호출) ====================
    async closeReservation(): Promise<void> {
        await this.schedulePostProcessingService.일정관련_배치_작업을_처리한다();
        return this.reservationContextService.예약관련_배치_작업을_처리한다();
    }

    async handleStartOdometer(): Promise<void> {
        return this.reservationContextService.시작주행거리를_처리한다();
    }
}
