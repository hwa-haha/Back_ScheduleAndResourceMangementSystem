import { ICommand } from '@nestjs/cqrs';
import { IUpdateSnapshotApprovalCommand } from '../../interfaces/command/update-snapshot-approval-command.interface';

/**
 * 결재 관련 스냅샷 업데이트 Command
 */
export class UpdateSnapshotApprovalCommand implements ICommand {
    constructor(public readonly data: IUpdateSnapshotApprovalCommand) {}
}
