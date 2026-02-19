import { ICommand } from '@nestjs/cqrs';
import { IReRequestAttendanceIssuesCommand } from '../../../interfaces';

/**
 * 근태 이슈 재요청 Command (복수 ID)
 */
export class ReRequestAttendanceIssuesCommand implements ICommand {
    constructor(public readonly command: IReRequestAttendanceIssuesCommand) {}
}
