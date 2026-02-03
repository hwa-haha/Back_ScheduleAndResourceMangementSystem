import { Module } from '@nestjs/common';
import { ApprovalController } from './approval.controller';
import { ApprovalBusinessModule } from '../../business/approval-business/approval-business.module';

/**
 * 결재 Interface 모듈
 *
 * 결재 관련 API 엔드포인트를 제공합니다.
 */
@Module({
    imports: [ApprovalBusinessModule],
    controllers: [ApprovalController],
})
export class ApprovalInterfaceModule {}
