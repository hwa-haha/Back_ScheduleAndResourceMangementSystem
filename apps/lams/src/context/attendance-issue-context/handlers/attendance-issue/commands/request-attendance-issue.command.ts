import { ICommand } from '@nestjs/cqrs';
import { IRequestAttendanceIssueCommand } from '../../../interfaces';

/**
 * 근태 이슈 요청 Command (PENDING → REQUEST, 단건)
 */
export class RequestAttendanceIssueCommand implements ICommand {
    constructor(public readonly command: IRequestAttendanceIssueCommand) {}
}
