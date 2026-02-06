import { CommandHandler, ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReJudgeDailySummaryCommand } from './re-judge-daily-summary.command';
import { DailySummaryJudgmentService } from '../../../services/daily-summary-judgment.service';
import { DomainHolidayInfoService } from '../../../../../domain/holiday-info/holiday-info.service';
import { DailyEventSummary } from '../../../../../domain/daily-event-summary/daily-event-summary.entity';
import { DailyEventSummaryDTO } from '../../../../../domain/daily-event-summary/daily-event-summary.types';
import { AttendanceIssue } from '../../../../../domain/attendance-issue/attendance-issue.entity';
import { CreateAttendanceIssuesCommand } from '../../../../attendance-issue-context/handlers/attendance-issue/commands';

/**
 * 일간 요약 결근/지각/조퇴 재판정 Command Handler
 *
 * 기존 출퇴근·근태유형은 그대로 두고, 결근/지각/조퇴 판정만 다시 계산하여 일간 요약에 반영한다.
 * 공휴일·주말 여부(is_holiday)도 휴일 목록과 주말 계산으로 다시 반영한다.
 * (update-daily-summary.handler.ts의 출퇴근 시간 수정 시 판정·업데이트 블록만 실행)
 */
@CommandHandler(ReJudgeDailySummaryCommand)
export class ReJudgeDailySummaryHandler implements ICommandHandler<ReJudgeDailySummaryCommand, DailyEventSummaryDTO[]> {
    private readonly logger = new Logger(ReJudgeDailySummaryHandler.name);

    constructor(
        private readonly dailySummaryJudgmentService: DailySummaryJudgmentService,
        private readonly holidayInfoService: DomainHolidayInfoService,
        private readonly dataSource: DataSource,
        private readonly commandBus: CommandBus,
    ) {}

    async execute(command: ReJudgeDailySummaryCommand): Promise<DailyEventSummaryDTO[]> {
        const { date, performedBy } = command.data;

        this.logger.log(`일간 요약 재판정 시작: date=${date} (해당 날짜 전체)`);

        return await this.dataSource.transaction(async (manager) => {
            const dailySummaries = await manager.find(DailyEventSummary, {
                where: { date },
            });

            // 공휴일·주말 여부 계산 (generate-daily-summaries와 동일)
            const holidays = await this.holidayInfoService.목록조회한다();
            const holidaySet = new Set(holidays.map((h) => h.holidayDate));

            const results: DailyEventSummaryDTO[] = [];

            for (const dailySummary of dailySummaries) {
                const updatedEnter = dailySummary.enter;
                const updatedLeave = dailySummary.leave;
                const updatedRealEnter = dailySummary.real_enter ?? dailySummary.enter;
                const updatedRealLeave = dailySummary.real_leave ?? dailySummary.leave;
                const usedAttendances = dailySummary.used_attendances || undefined;

                const is_holiday = holidaySet.has(dailySummary.date) || this.주말여부확인(dailySummary.date);

                const workTime = this.근무시간을계산한다(
                    updatedEnter,
                    updatedLeave,
                    this.usedAttendances를UsedAttendance형태로변환(usedAttendances),
                );

                const 판정결과 = await this.dailySummaryJudgmentService.결근지각조퇴판정한다(
                    dailySummary,
                    updatedRealEnter,
                    updatedRealLeave,
                    usedAttendances,
                    manager,
                );

                // 판정 결과를 먼저 반영하여 노트 생성에 사용
                dailySummary.is_late = 판정결과.isLate;
                dailySummary.is_early_leave = 판정결과.isEarlyLeave;
                dailySummary.is_absent = 판정결과.isAbsent;

                // 노트 생성
                this.노트를생성한다(dailySummary);

                dailySummary.업데이트한다(
                    undefined,
                    is_holiday,
                    updatedEnter,
                    updatedLeave,
                    updatedRealEnter,
                    updatedRealLeave,
                    undefined,
                    판정결과.isLate,
                    판정결과.isEarlyLeave,
                    판정결과.isAbsent,
                    판정결과.hasAttendanceConflict,
                    판정결과.hasAttendanceOverlap,
                    workTime,
                    dailySummary.note ?? undefined,
                    undefined,
                );

                if (performedBy) {
                    dailySummary.수정자설정한다(performedBy);
                    dailySummary.메타데이터업데이트한다(performedBy);
                }

                const saved = await manager.save(dailySummary);
                results.push(saved.DTO변환한다());
            }

            this.logger.log(`일간 요약 재판정 완료: date=${date}, 처리 건수=${results.length}`);

            // 재판정된 일간 요약을 엔티티로 변환하여 근태 이슈 재생성
            const rejudgedSummaries = await manager.find(DailyEventSummary, {
                where: { date },
            });

            // 해당 날짜의 기존 근태 이슈 소프트 삭제
            await this.해당날짜근태이슈소프트삭제(date, performedBy || '', manager);

            // 근태 이슈 재생성
            if (rejudgedSummaries.length > 0 && performedBy) {
                await this.commandBus.execute(
                    new CreateAttendanceIssuesCommand({
                        summaries: rejudgedSummaries,
                        performedBy,
                    }),
                );
            }

            return results;
        });
    }

    /**
     * 해당 날짜의 기존 근태 이슈를 소프트 삭제한다
     *
     * @param date 날짜 (YYYY-MM-DD)
     * @param performedBy 수행자 ID
     * @param manager EntityManager
     */
    private async 해당날짜근태이슈소프트삭제(date: string, performedBy: string, manager: any): Promise<void> {
        const existingIssues = await manager
            .createQueryBuilder(AttendanceIssue, 'ai')
            .where('ai.date = :date', { date })
            .andWhere('ai.deleted_at IS NULL')
            .getMany();

        if (existingIssues.length === 0) {
            return;
        }

        const now = new Date();
        for (const issue of existingIssues) {
            issue.deleted_at = now;
            issue.수정자설정한다(performedBy);
            issue.메타데이터업데이트한다(performedBy);
        }

        await manager.save(AttendanceIssue, existingIssues);
        this.logger.log(`해당 날짜 근태 이슈 소프트 삭제 완료: ${existingIssues.length}건 (date=${date})`);
    }

    private 근무시간을계산한다(
        enter: string | null,
        leave: string | null,
        recognizedAttendances: Array<{ attendanceType?: { work_time?: number } }>,
    ): number | null {
        if (enter && leave) {
            const enterTime = this.시간문자열을분으로변환(enter);
            const leaveTime = this.시간문자열을분으로변환(leave);
            const totalWorkMinutes = leaveTime - enterTime;
            const requiredRestMinutes = this.법정휴식시간을계산한다(totalWorkMinutes);
            const workTime = totalWorkMinutes - requiredRestMinutes;
            return workTime > 0 ? workTime : 0;
        }
        if (recognizedAttendances.length > 0) {
            const totalWorkTime = recognizedAttendances.reduce(
                (sum, ua) => sum + (ua.attendanceType?.work_time || 0),
                0,
            );
            return totalWorkTime > 0 ? totalWorkTime : null;
        }
        return null;
    }

    private usedAttendances를UsedAttendance형태로변환(
        usedAttendances:
            | Array<{
                  attendanceTypeId: string;
                  title: string;
                  workTime?: number;
                  isRecognizedWorkTime?: boolean;
                  startWorkTime?: string | null;
                  endWorkTime?: string | null;
                  deductedAnnualLeave?: number;
              }>
            | null
            | undefined,
    ): Array<{ attendanceType?: { work_time?: number } }> {
        if (!usedAttendances || usedAttendances.length === 0) return [];
        return usedAttendances.map((ua) => ({
            attendanceType: { work_time: ua.workTime },
        }));
    }

    private 시간문자열을분으로변환(timeStr: string): number {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        return hours * 60 + minutes;
    }

    private 법정휴식시간을계산한다(totalWorkMinutes: number): number {
        const FOUR_HOURS = 4 * 60;
        const EIGHT_HOURS = 8 * 60;
        if (totalWorkMinutes < FOUR_HOURS) return 0;
        if (totalWorkMinutes < EIGHT_HOURS) return 30;
        return 60;
    }

    /**
     * 주말 여부 확인 (generate-daily-summaries, daily-summary-judgment와 동일)
     */
    private 주말여부확인(dateString: string): boolean {
        const date = new Date(dateString);
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    }

    /**
     * 일간 요약 노트를 생성한다
     *
     * 지각, 조퇴, 결근 정보를 노트에 추가합니다.
     */
    private 노트를생성한다(summary: DailyEventSummary): void {
        let newNote = '';

        if (summary.is_late) {
            newNote += `출근 시간: ${summary.enter} 지각\n`;
        }

        if (summary.is_early_leave) {
            newNote += `퇴근 시간: ${summary.leave} 조퇴\n`;
        }

        if (summary.is_absent) {
            newNote += '결근\n';
        }

        if (newNote) {
            summary.note = newNote.trim();
        } else {
            summary.note = '';
        }
    }
}
