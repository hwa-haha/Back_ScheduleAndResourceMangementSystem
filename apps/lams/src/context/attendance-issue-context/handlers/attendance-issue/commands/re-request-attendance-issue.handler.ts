import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { ReRequestAttendanceIssueCommand } from './re-request-attendance-issue.command';
import { IReRequestAttendanceIssueResponse } from '../../../interfaces';
import { DomainAttendanceIssueService } from '../../../../../domain/attendance-issue/attendance-issue.service';
import { AttendanceIssueStatus } from '../../../../../domain/attendance-issue/attendance-issue.types';

/**
 * 근태 이슈 재요청 Handler
 */
@CommandHandler(ReRequestAttendanceIssueCommand)
export class ReRequestAttendanceIssueHandler implements ICommandHandler<
    ReRequestAttendanceIssueCommand,
    IReRequestAttendanceIssueResponse
> {
    constructor(private readonly attendanceIssueService: DomainAttendanceIssueService) {}

    async execute(command: ReRequestAttendanceIssueCommand): Promise<IReRequestAttendanceIssueResponse> {
        const { command: cmd } = command;

        const issue = await this.attendanceIssueService.ID로조회한다(cmd.id);

        // 이미 반영된 이슈는 재요청 불가
        if (issue.status === AttendanceIssueStatus.APPLIED) {
            throw new BadRequestException('이미 반영된 이슈는 재요청할 수 없습니다.');
        }

        // 재요청 시 상태를 REQUEST로 변경
        const updatedIssue = await this.attendanceIssueService.요청한다(cmd.id, cmd.userId);

        return { issue: updatedIssue };
    }
}
