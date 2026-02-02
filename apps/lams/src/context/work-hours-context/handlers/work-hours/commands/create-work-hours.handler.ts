import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateWorkHoursCommand } from './create-work-hours.command';
import { ICreateWorkHoursResponse } from '../../../interfaces/response/create-work-hours-response.interface';
import { DomainWorkHoursService } from '../../../../../domain/work-hours/work-hours.service';

/**
 * 시수 입력 Handler
 */
@CommandHandler(CreateWorkHoursCommand)
export class CreateWorkHoursHandler implements ICommandHandler<CreateWorkHoursCommand, ICreateWorkHoursResponse> {
    private readonly logger = new Logger(CreateWorkHoursHandler.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly workHoursService: DomainWorkHoursService,
    ) {}

    async execute(command: CreateWorkHoursCommand): Promise<ICreateWorkHoursResponse> {
        const { assignedProjectId, date, startTime, endTime, workMinutes, note } = command.data;

        this.logger.log(`시수 입력 시작: assignedProjectId=${assignedProjectId}, date=${date}`);

        return await this.dataSource.transaction(async (manager) => {
            const workHours = await this.workHoursService.생성한다(
                {
                    assignedProjectId,
                    date,
                    startTime,
                    endTime,
                    workMinutes,
                    note,
                },
                manager,
            );

            this.logger.log(`시수 입력 완료: workHoursId=${workHours.id}`);

            return {
                workHours,
            };
        });
    }
}
