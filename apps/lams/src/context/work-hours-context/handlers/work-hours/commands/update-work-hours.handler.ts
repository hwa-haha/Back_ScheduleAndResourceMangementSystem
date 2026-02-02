import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UpdateWorkHoursCommand } from './update-work-hours.command';
import { IUpdateWorkHoursResponse } from '../../../interfaces/response/update-work-hours-response.interface';
import { DomainWorkHoursService } from '../../../../../domain/work-hours/work-hours.service';

/**
 * 시수 수정 Handler
 */
@CommandHandler(UpdateWorkHoursCommand)
export class UpdateWorkHoursHandler implements ICommandHandler<UpdateWorkHoursCommand, IUpdateWorkHoursResponse> {
    private readonly logger = new Logger(UpdateWorkHoursHandler.name);

    constructor(private readonly workHoursService: DomainWorkHoursService) {}

    async execute(command: UpdateWorkHoursCommand): Promise<IUpdateWorkHoursResponse> {
        const { id, startTime, endTime, workMinutes, performedBy } = command.data;

        this.logger.log(`시수 수정: id=${id}`);

        const workHours = await this.workHoursService.수정한다(
            id,
            { startTime, endTime, workMinutes },
            performedBy ?? '',
        );

        this.logger.log(`시수 수정 완료: id=${id}`);

        return { workHours };
    }
}
