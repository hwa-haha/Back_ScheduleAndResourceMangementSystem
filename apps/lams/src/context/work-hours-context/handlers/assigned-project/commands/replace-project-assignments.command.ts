import { ICommand } from '@nestjs/cqrs';
import { IReplaceProjectAssignmentsCommand } from '../../../interfaces/command/replace-project-assignments-command.interface';

/**
 * 직원 프로젝트 할당 일괄 갱신 Command
 */
export class ReplaceProjectAssignmentsCommand implements ICommand {
    constructor(public readonly data: IReplaceProjectAssignmentsCommand) {}
}
