import { ICommand } from '@nestjs/cqrs';
import { IDeleteWorkHoursByIdCommand } from '../../../interfaces/command/delete-work-hours-by-id-command.interface';

/**
 * 시수 ID별 삭제 Command
 */
export class DeleteWorkHoursByIdCommand implements ICommand {
    constructor(public readonly data: IDeleteWorkHoursByIdCommand) {}
}
