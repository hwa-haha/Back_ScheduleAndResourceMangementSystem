import { ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { RequestAttendanceIssueCommand } from './request-attendance-issue.command';
import { IRequestAttendanceIssueResponse } from '../../../interfaces';
import { DomainAttendanceIssueService } from '../../../../../domain/attendance-issue/attendance-issue.service';
import { AttendanceIssueStatus } from '../../../../../domain/attendance-issue/attendance-issue.types';

/**
 * 근태 이슈 요청 Handler (PENDING → REQUEST)
 * 복수 ID 처리: PENDING 상태인 이슈만 REQUEST로 변경한다.
 */
@CommandHandler(RequestAttendanceIssueCommand)
export class RequestAttendanceIssueHandler
    implements ICommandHandler<RequestAttendanceIssueCommand, IRequestAttendanceIssueResponse>
{
    constructor(private readonly attendanceIssueService: DomainAttendanceIssueService) {}

    async execute(command: RequestAttendanceIssueCommand): Promise<IRequestAttendanceIssueResponse> {
        const { command: cmd } = command;

        if (!cmd.ids?.length) {
            throw new BadRequestException('요청할 이슈 ID를 1개 이상 입력해 주세요.');
        }

        const updatedIssues: Awaited<ReturnType<DomainAttendanceIssueService['ID로조회한다']>>[] = [];

        for (const id of cmd.ids) {
            const issue = await this.attendanceIssueService.ID로조회한다(id);

            if (issue.status !== AttendanceIssueStatus.PENDING) {
                throw new BadRequestException(
                    `이슈(id: ${id})는 대기 상태가 아니라 요청할 수 없습니다. (현재 상태: ${issue.status})`,
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
            requestedCount: updatedIssues.length,
        };
    }
}
