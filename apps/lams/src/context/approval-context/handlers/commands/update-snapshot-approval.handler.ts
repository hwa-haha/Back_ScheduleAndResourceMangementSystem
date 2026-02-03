import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UpdateSnapshotApprovalCommand } from './update-snapshot-approval.command';
import { IUpdateSnapshotApprovalResponse } from '../../interfaces/response/update-snapshot-approval-response.interface';
import { DomainDataSnapshotInfoService } from '../../../../domain/data-snapshot-info/data-snapshot-info.service';
import { ApprovalStatus } from '../../../../domain/data-snapshot-info/data-snapshot-info.types';

/**
 * 결재 관련 스냅샷 업데이트 Command Handler
 *
 * data_snapshot_info 의 approval_document_id, submitted_at, approver_name 필드를 업데이트하고,
 * approval_status 는 핸들러 내부에서 항상 "제출됨"(SUBMITTED)으로 설정합니다.
 */
@CommandHandler(UpdateSnapshotApprovalCommand)
export class UpdateSnapshotApprovalHandler implements ICommandHandler<
    UpdateSnapshotApprovalCommand,
    IUpdateSnapshotApprovalResponse
> {
    private readonly logger = new Logger(UpdateSnapshotApprovalHandler.name);

    constructor(private readonly dataSnapshotInfoService: DomainDataSnapshotInfoService) {}

    async execute(command: UpdateSnapshotApprovalCommand): Promise<IUpdateSnapshotApprovalResponse> {
        const { snapshotId, approvalDocumentId, submittedAt, approverName, performedBy } = command.data;

        this.logger.log(`결재 스냅샷 업데이트: snapshotId=${snapshotId}, approvalStatus=제출됨`);

        const snapshot = await this.dataSnapshotInfoService.수정한다(
            snapshotId,
            {
                approvalDocumentId,
                submittedAt,
                approverName,
                approvalStatus: ApprovalStatus.SUBMITTED,
            },
            performedBy,
        );

        return { snapshot };
    }
}
