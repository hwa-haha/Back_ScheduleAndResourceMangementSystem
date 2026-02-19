import { ICommand } from '@nestjs/cqrs';
import { IRequestAttendanceIssueCommand } from '../../../interfaces';

/**
 * 근태 이슈 요청 Command (PENDING → REQUEST, 복수 ID)
 */
export class RequestAttendanceIssueCommand implements ICommand {
    constructor(public readonly command: IRequestAttendanceIssueCommand) {}
}
