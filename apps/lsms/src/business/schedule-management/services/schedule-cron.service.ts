import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScheduleManagementService } from '../schedule-management.service';

/**
 * 일정 크론 작업 (EC2 등 서버 환경)
 * 호환용 기존 API: GET /v2/schedule/cron-job/post-processing
 */
@Injectable()
export class ScheduleCronService {
    private readonly logger = new Logger(ScheduleCronService.name);

    constructor(private readonly scheduleManagementService: ScheduleManagementService) {}

    /** 매시 0분(Every hour) 일정 후처리 */
    @Cron('0 0 * * * *', { timeZone: 'Asia/Seoul' })
    async postProcessingSchedulesAt0(): Promise<void> {
        await this.runPostProcessing();
    }

    /** 매시 30분(At 30 minutes past the hour) 일정 후처리 */
    @Cron('0 30 * * * *', { timeZone: 'Asia/Seoul' })
    async postProcessingSchedulesAt30(): Promise<void> {
        await this.runPostProcessing();
    }

    private async runPostProcessing(): Promise<void> {
        this.logger.log('Cron: 일정 후처리 실행');
        try {
            await this.scheduleManagementService.postProcessingSchedules();
            this.logger.log('Cron: 일정 후처리 완료');
        } catch (error) {
            this.logger.error('Cron: 일정 후처리 실패', error);
        }
    }
}
