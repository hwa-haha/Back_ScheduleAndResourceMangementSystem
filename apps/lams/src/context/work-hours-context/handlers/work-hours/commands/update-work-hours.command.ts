import { ICommand } from '@nestjs/cqrs';
import { IUpdateWorkHoursCommand } from '../../../interfaces/command/update-work-hours-command.interface';

/**
 * 시수 수정 Command
 */
export class UpdateWorkHoursCommand implements ICommand {
    constructor(public readonly data: IUpdateWorkHoursCommand) {}
}
