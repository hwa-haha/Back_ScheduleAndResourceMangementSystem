import { ICommand } from '@nestjs/cqrs';
import { IRequestAttendanceIssuesCommand } from '../../../interfaces';

/**
 * 근태 이슈 요청 Command (PENDING → REQUEST, 복수 ID 벌크)
 */
export class RequestAttendanceIssuesCommand implements ICommand {
    constructor(public readonly command: IRequestAttendanceIssuesCommand) {}
}
