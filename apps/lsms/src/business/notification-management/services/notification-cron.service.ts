import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationManagementService } from '../notification-management.service';

/**
 * 알림 크론 작업 (EC2 등 서버 환경)
 * 호환용 기존 API: GET /v1/notifications/cron-job/send-upcoming-notification
 */
@Injectable()
export class NotificationCronService {
    private readonly logger = new Logger(NotificationCronService.name);

    constructor(private readonly notificationManagementService: NotificationManagementService) {}

    /** 매분 실행, 월~금 (Every minute, Monday through Friday) */
    @Cron('0 * * * * 1-5', { timeZone: 'Asia/Seoul' })
    async sendUpcomingNotification(): Promise<void> {
        this.logger.log('Cron: 다가오는 일정 알림 전송 실행');
        try {
            await this.notificationManagementService.다가오는_일정의_알림을_전송한다();
            this.logger.log('Cron: 다가오는 일정 알림 전송 완료');
        } catch (error) {
            this.logger.error('Cron: 다가오는 일정 알림 전송 실패', error);
        }
    }
}
