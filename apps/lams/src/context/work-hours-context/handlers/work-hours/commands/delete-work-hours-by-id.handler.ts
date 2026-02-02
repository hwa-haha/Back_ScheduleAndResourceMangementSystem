import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DeleteWorkHoursByIdCommand } from './delete-work-hours-by-id.command';
import { DomainWorkHoursService } from '../../../../../domain/work-hours/work-hours.service';

/**
 * 시수 ID별 삭제 Handler (완전 삭제)
 */
@CommandHandler(DeleteWorkHoursByIdCommand)
export class DeleteWorkHoursByIdHandler implements ICommandHandler<DeleteWorkHoursByIdCommand, void> {
    private readonly logger = new Logger(DeleteWorkHoursByIdHandler.name);

    constructor(private readonly workHoursService: DomainWorkHoursService) {}

    async execute(command: DeleteWorkHoursByIdCommand): Promise<void> {
        const { id, performedBy } = command.data;

        this.logger.log(`시수 삭제: id=${id}`);

        await this.workHoursService.완전삭제한다(id, performedBy ?? '');

        this.logger.log(`시수 삭제 완료: id=${id}`);
    }
}
