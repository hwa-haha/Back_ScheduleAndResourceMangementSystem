import { Module } from '@nestjs/common';

// Context Modules
import { FileContextModule } from '../../context/file/file.context.module';

// Business Services
import { FileManagementService } from './file-management.service';
import { FileCronService } from './services/file-cron.service';

// Controllers
import { FileController } from './controllers/file.controller';
import { CronFileController } from './controllers/cron.file.controller';

/**
 * 파일 관리 비즈니스 모듈
 *
 * 파일 관련 비즈니스 로직을 처리하는 모듈입니다:
 * - 파일 업로드/다운로드/삭제 API
 * - 다중 파일 처리
 * - Presigned URL 생성
 * - 크론 작업을 통한 임시 파일 정리
 * - Context layer의 파일 서비스들을 orchestrate
 *
 * 특징:
 * - Context layer만 의존 (MDC 규칙 준수)
 * - v2 API 엔드포인트 제공
 * - 비즈니스 플로우 중심의 서비스 설계
 */
@Module({
    imports: [
        // Context Layer Dependencies
        FileContextModule,
    ],
    controllers: [FileController, CronFileController],
    providers: [FileManagementService, FileCronService],
    exports: [FileManagementService],
})
export class FileManagementModule {}
