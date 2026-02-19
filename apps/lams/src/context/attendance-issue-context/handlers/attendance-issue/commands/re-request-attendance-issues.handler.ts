import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { ReRequestAttendanceIssuesCommand } from './re-request-attendance-issues.command';
import { IReRequestAttendanceIssuesResponse } from '../../../interfaces';
import { DomainAttendanceIssueService } from '../../../../../domain/attendance-issue/attendance-issue.service';
import { AttendanceIssueStatus } from '../../../../../domain/attendance-issue/attendance-issue.types';

/**
 * 근태 이슈 재요청 Handler (복수 ID)
 * 이미 반영(APPLIED)된 이슈는 제외하고, 나머지는 REQUEST로 변경한다.
 */
@CommandHandler(ReRequestAttendanceIssuesCommand)
export class ReRequestAttendanceIssuesHandler
    implements ICommandHandler<ReRequestAttendanceIssuesCommand, IReRequestAttendanceIssuesResponse>
{
    constructor(private readonly attendanceIssueService: DomainAttendanceIssueService) {}

    async execute(
        command: ReRequestAttendanceIssuesCommand,
    ): Promise<IReRequestAttendanceIssuesResponse> {
        const { command: cmd } = command;

        if (!cmd.ids?.length) {
            throw new BadRequestException('재요청할 이슈 ID를 1개 이상 입력해 주세요.');
        }

        const updatedIssues: Awaited<ReturnType<DomainAttendanceIssueService['ID로조회한다']>>[] = [];

        for (const id of cmd.ids) {
            const issue = await this.attendanceIssueService.ID로조회한다(id);

            if (issue.status === AttendanceIssueStatus.APPLIED) {
                throw new BadRequestException(
                    `이슈(id: ${id})는 이미 반영되어 재요청할 수 없습니다.`,
                );
            }

            const updated = await this.attendanceIssueService.수정한다(
                id,
                { status: AttendanceIssueStatus.REQUEST },
                cmd.userId,
            );
            updatedIssues.push(updated);
        }

        return {
            issues: updatedIssues,
            reRequestedCount: updatedIssues.length,
        };
    }
}
