import { Module } from '@nestjs/common';

// Context Modules
import { NotificationContextModule } from '../../context/notification/notification.context.module';
import { ScheduleContextModule } from '../../context/schedule/schedule.context.module';

// Business Services
import { NotificationManagementService } from './notification-management.service';
import { NotificationCronService } from './services/notification-cron.service';

// Controllers
import { NotificationController } from './controllers/notification.controller';
import { CronNotificationController } from './controllers/cron.notification.controller';

/**
 * 알림 관리 비즈니스 모듈
 *
 * 알림 관련 비즈니스 로직을 처리하는 모듈입니다:
 * - 알림 구독/전송/조회/읽음 처리 API
 * - 크론 작업을 통한 예약 알림 전송
 * - Context layer의 알림 서비스들을 orchestrate
 *
 * 특징:
 * - Context layer만 의존 (MDC 규칙 준수)
 * - v2 API 엔드포인트 제공
 * - 비즈니스 플로우 중심의 서비스 설계
 */
@Module({
    imports: [
        // Context Layer Dependencies
        NotificationContextModule,
        ScheduleContextModule,
    ],
    controllers: [NotificationController, CronNotificationController],
    providers: [NotificationManagementService, NotificationCronService],
    exports: [NotificationManagementService],
})
export class NotificationManagementModule {}
