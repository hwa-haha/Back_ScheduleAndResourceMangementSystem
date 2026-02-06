import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateAttendanceIssuesCommand } from './create-attendance-issues.command';
import { DomainAttendanceIssueService } from '../../../../../domain/attendance-issue/attendance-issue.service';
import { DailyEventSummary } from '../../../../../domain/daily-event-summary/daily-event-summary.entity';
import { UsedAttendance } from '../../../../../domain/used-attendance/used-attendance.entity';
import { AttendanceIssue } from '../../../../../domain/attendance-issue/attendance-issue.entity';

/**
 * 근태 이슈 생성/복원 핸들러
 *
 * 정상근무 범위를 벗어난 경우 근태 이슈를 생성하거나 복원합니다.
 * 기존 이슈가 있으면 복원하고 업데이트하고, 없으면 새로 생성합니다.
 */
@CommandHandler(CreateAttendanceIssuesCommand)
export class CreateAttendanceIssuesHandler implements ICommandHandler<CreateAttendanceIssuesCommand, any[]> {
    private readonly logger = new Logger(CreateAttendanceIssuesHandler.name);

    constructor(
        private readonly attendanceIssueService: DomainAttendanceIssueService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(command: CreateAttendanceIssuesCommand): Promise<any[]> {
        const { summaries, performedBy } = command.data;

        return await this.dataSource.transaction(async (manager) => {
            return await this.근태이슈를생성한다(summaries, performedBy, manager);
        });
    }

    /**
     * 근태 이슈를 생성하거나 복원한다 (정상근무 범위를 벗어난 경우)
     *
     * 기존 이슈가 있으면 복원하고 업데이트하고, 없으면 새로 생성합니다.
     */
    private async 근태이슈를생성한다(
        summaries: DailyEventSummary[],
        performedBy: string,
        manager: any,
    ): Promise<any[]> {
        const issues: any[] = [];

        const summaryIds = summaries.map((s) => s.id);

        if (summaryIds.length === 0) {
            return issues;
        }

        // 기존 이슈 조회 (소프트 삭제된 것 포함)
        const existingIssues = await manager
            .createQueryBuilder(AttendanceIssue, 'ai')
            .where('ai.daily_event_summary_id IN (:...summaryIds)', { summaryIds })
            .withDeleted() // 소프트 삭제된 데이터도 조회
            .getMany();

        const existingIssueMap = new Map<string, AttendanceIssue>();
        existingIssues.forEach((issue) => {
            if (issue.daily_event_summary_id) {
                existingIssueMap.set(issue.daily_event_summary_id, issue);
            }
        });

        const dateSet = new Set(summaries.map((s) => s.date));
        const dateArray = Array.from(dateSet);
        const usedAttendancesMap = new Map<string, UsedAttendance[]>();

        if (dateArray.length > 0) {
            const minDate = dateArray.sort()[0];
            const maxDate = dateArray.sort().reverse()[0];
            const allUsedAttendances = await manager
                .createQueryBuilder('UsedAttendance', 'ua')
                .leftJoinAndSelect('ua.attendanceType', 'at')
                .where('ua.deleted_at IS NULL')
                .andWhere('ua.used_at >= :minDate', { minDate })
                .andWhere('ua.used_at <= :maxDate', { maxDate })
                .getMany();

            allUsedAttendances.forEach((ua) => {
                const key = `${ua.employee_id}_${ua.used_at}`;
                if (!usedAttendancesMap.has(key)) {
                    usedAttendancesMap.set(key, []);
                }
                usedAttendancesMap.get(key)!.push(ua);
            });
        }

        for (const summary of summaries) {
            const key = `${summary.employee_id}_${summary.date}`;
            const dayAttendances = usedAttendancesMap.get(key) || [];
            const problematicAttendanceTypeIds = dayAttendances
                .map((ua) => ua.attendance_type_id)
                .filter((id): id is string => !!id)
                .slice(0, 2);

            const isAttendanceIssue = summary.is_late || summary.is_early_leave || summary.is_absent;

            let isDuplicateTimeIssue = false;
            if (dayAttendances.length === 2) {
                const [attendance1, attendance2] = dayAttendances;
                const startTime1 = attendance1.attendanceType?.start_work_time;
                const endTime1 = attendance1.attendanceType?.end_work_time;
                const startTime2 = attendance2.attendanceType?.start_work_time;
                const endTime2 = attendance2.attendanceType?.end_work_time;

                if (
                    startTime1 &&
                    endTime1 &&
                    startTime2 &&
                    endTime2 &&
                    startTime1 === startTime2 &&
                    endTime1 === endTime2
                ) {
                    isDuplicateTimeIssue = true;
                }
            }

            if (isAttendanceIssue || isDuplicateTimeIssue) {
                const existingIssue = existingIssueMap.get(summary.id);

                try {
                    if (existingIssue) {
                        // 기존 이슈가 있으면 복원하고 업데이트
                        existingIssue.deleted_at = null; // 복원
                        existingIssue.employee_id = summary.employee_id!;
                        existingIssue.date = summary.date;
                        existingIssue.daily_event_summary_id = summary.id;
                        existingIssue.problematic_enter_time = summary.real_enter || summary.enter;
                        existingIssue.problematic_leave_time = summary.real_leave || summary.leave;
                        // corrected_* 필드는 기존 값 유지 (수정 정보 보존)
                        // existingIssue.corrected_enter_time = null;
                        // existingIssue.corrected_leave_time = null;
                        existingIssue.problematic_attendance_type_ids =
                            problematicAttendanceTypeIds.length > 0 ? problematicAttendanceTypeIds : null;
                        // existingIssue.corrected_attendance_type_ids = null;
                        // description, status, confirmed_by 등은 기존 값 유지 (복원 시 기존 값 유지)
                        existingIssue.수정자설정한다(performedBy);
                        existingIssue.메타데이터업데이트한다(performedBy);

                        await manager.save(AttendanceIssue, existingIssue);
                        issues.push(existingIssue);
                    } else {
                        // 기존 이슈가 없으면 새로 생성
                        const issue = await this.attendanceIssueService.생성한다(
                            {
                                employeeId: summary.employee_id!,
                                date: summary.date,
                                dailyEventSummaryId: summary.id,
                                problematicEnterTime: summary.real_enter || summary.enter,
                                problematicLeaveTime: summary.real_leave || summary.leave,
                                correctedEnterTime: null,
                                correctedLeaveTime: null,
                                problematicAttendanceTypeIds:
                                    problematicAttendanceTypeIds.length > 0 ? problematicAttendanceTypeIds : null,
                                correctedAttendanceTypeIds: null,
                                description: null,
                            },
                            manager,
                        );
                        issues.push(issue);
                    }
                } catch (error: any) {
                    this.logger.warn(
                        `근태 이슈 생성/복원 실패 (${summary.date}, ${summary.employee_id}): ${error.message}`,
                    );
                }
            }
        }

        return issues;
    }
}
