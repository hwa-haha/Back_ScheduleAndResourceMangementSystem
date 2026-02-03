import { Module } from '@nestjs/common';
import { ApprovalBusinessService } from './approval-business.service';
import { ApprovalContextModule } from '../../context/approval-context/approval-context.module';

/**
 * 결재 Business 모듈
 */
@Module({
    imports: [ApprovalContextModule],
    providers: [ApprovalBusinessService],
    exports: [ApprovalBusinessService],
})
export class ApprovalBusinessModule {}
