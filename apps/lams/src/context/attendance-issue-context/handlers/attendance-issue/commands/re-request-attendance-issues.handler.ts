import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { ReRequestAttendanceIssuesCommand } from './re-request-attendance-issues.command';
import { IReRequestAttendanceIssuesResponse } from '../../../interfaces';
import { DomainAttendanceIssueService } from '../../../../../domain/attendance-issue/attendance-issue.service';

/**
 * 근태 이슈 재요청 Handler (복수 ID 벌크)
 * 이미 반영(APPLIED)된 이슈는 제외하고, 나머지는 도메인 벌크로 REQUEST로 변경한다.
 */
@CommandHandler(ReRequestAttendanceIssuesCommand)
export class ReRequestAttendanceIssuesHandler implements ICommandHandler<
    ReRequestAttendanceIssuesCommand,
    IReRequestAttendanceIssuesResponse
> {
    constructor(private readonly attendanceIssueService: DomainAttendanceIssueService) {}

    async execute(command: ReRequestAttendanceIssuesCommand): Promise<IReRequestAttendanceIssuesResponse> {
        const { command: cmd } = command;

        if (!cmd.ids?.length) {
            throw new BadRequestException('재요청할 이슈 ID를 1개 이상 입력해 주세요.');
        }

        const issues = await this.attendanceIssueService.ID목록으로재요청한다(cmd.ids, cmd.userId);

        return {
            issues,
            reRequestedCount: issues.length,
        };
    }
}
