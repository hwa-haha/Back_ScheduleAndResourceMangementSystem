import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FileManagementService } from '../file-management.service';

/**
 * 파일 관리 크론 작업 (EC2 등 서버 환경)
 * 호환용 기존 API: GET /v2/files/cron-job/delete-temporary-file
 */
@Injectable()
export class FileCronService {
    private readonly logger = new Logger(FileCronService.name);

    constructor(private readonly fileManagementService: FileManagementService) {}

    /** 매일 0시(At 12:00 AM) 임시 파일 삭제 */
    @Cron('0 0 0 * * *', { timeZone: 'Asia/Seoul' })
    async deleteTemporaryFile(): Promise<void> {
        this.logger.log('Cron: 임시 파일 삭제 실행');
        try {
            await this.fileManagementService.deleteTemporaryFiles();
            this.logger.log('Cron: 임시 파일 삭제 완료');
        } catch (error) {
            this.logger.error('Cron: 임시 파일 삭제 실패', error);
        }
    }
}
