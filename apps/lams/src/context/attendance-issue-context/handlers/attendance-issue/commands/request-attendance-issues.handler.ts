import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { RequestAttendanceIssuesCommand } from './request-attendance-issues.command';
import { IRequestAttendanceIssuesResponse } from '../../../interfaces';
import { DomainAttendanceIssueService } from '../../../../../domain/attendance-issue/attendance-issue.service';

/**
 * 근태 이슈 요청 Handler (PENDING → REQUEST, 복수 ID 벌크)
 * PENDING 상태인 이슈만 도메인 벌크 메서드로 일괄 요청한다.
 */
@CommandHandler(RequestAttendanceIssuesCommand)
export class RequestAttendanceIssuesHandler
    implements ICommandHandler<RequestAttendanceIssuesCommand, IRequestAttendanceIssuesResponse>
{
    constructor(private readonly attendanceIssueService: DomainAttendanceIssueService) {}

    async execute(command: RequestAttendanceIssuesCommand): Promise<IRequestAttendanceIssuesResponse> {
        const { command: cmd } = command;

        if (!cmd.ids?.length) {
            throw new BadRequestException('요청할 이슈 ID를 1개 이상 입력해 주세요.');
        }

        const issues = await this.attendanceIssueService.ID목록으로요청한다(cmd.ids, cmd.userId);

        return {
            issues,
            requestedCount: issues.length,
        };
    }
}
