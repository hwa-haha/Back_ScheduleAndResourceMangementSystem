import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RemoveProjectAssignmentCommand } from './remove-project-assignment.command';
import { DomainAssignedProjectService } from '../../../../../domain/assigned-project/assigned-project.service';

/**
 * 프로젝트 할당 제거 Handler
 */
@CommandHandler(RemoveProjectAssignmentCommand)
export class RemoveProjectAssignmentHandler
    implements ICommandHandler<RemoveProjectAssignmentCommand, void>
{
    private readonly logger = new Logger(RemoveProjectAssignmentHandler.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly assignedProjectService: DomainAssignedProjectService,
    ) {}

    async execute(command: RemoveProjectAssignmentCommand): Promise<void> {
        const { assignedProjectId, performedBy } = command.data;

        this.logger.log(`프로젝트 할당 제거 시작: assignedProjectId=${assignedProjectId}`);

        await this.dataSource.transaction(async (manager) => {
            await this.assignedProjectService.완전삭제한다(assignedProjectId, performedBy, manager);
        });

        this.logger.log(`프로젝트 할당 제거 완료: assignedProjectId=${assignedProjectId}`);
    }
}
