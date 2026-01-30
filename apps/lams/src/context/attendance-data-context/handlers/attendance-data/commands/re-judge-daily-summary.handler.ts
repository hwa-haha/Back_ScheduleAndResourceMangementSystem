import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReJudgeDailySummaryCommand } from './re-judge-daily-summary.command';
import { DailySummaryJudgmentService } from '../../../services/daily-summary-judgment.service';
import { DailyEventSummary } from '../../../../../domain/daily-event-summary/daily-event-summary.entity';
import { DailyEventSummaryDTO } from '../../../../../domain/daily-event-summary/daily-event-summary.types';

/**
 * 일간 요약 결근/지각/조퇴 재판정 Command Handler
 *
 * 기존 출퇴근·근태유형은 그대로 두고, 결근/지각/조퇴 판정만 다시 계산하여 일간 요약에 반영한다.
 * (update-daily-summary.handler.ts의 출퇴근 시간 수정 시 판정·업데이트 블록만 실행)
 */
@CommandHandler(ReJudgeDailySummaryCommand)
export class ReJudgeDailySummaryHandler
    implements ICommandHandler<ReJudgeDailySummaryCommand, DailyEventSummaryDTO[]>
{
    private readonly logger = new Logger(ReJudgeDailySummaryHandler.name);

    constructor(
        private readonly dailySummaryJudgmentService: DailySummaryJudgmentService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(command: ReJudgeDailySummaryCommand): Promise<DailyEventSummaryDTO[]> {
        const { date, performedBy } = command.data;

        this.logger.log(`일간 요약 재판정 시작: date=${date} (해당 날짜 전체)`);

        return await this.dataSource.transaction(async (manager) => {
            const dailySummaries = await manager.find(DailyEventSummary, {
                where: { date },
            });

            const results: DailyEventSummaryDTO[] = [];

            for (const dailySummary of dailySummaries) {
                const updatedEnter = dailySummary.enter;
                const updatedLeave = dailySummary.leave;
                const updatedRealEnter = dailySummary.real_enter ?? dailySummary.enter;
                const updatedRealLeave = dailySummary.real_leave ?? dailySummary.leave;
                const usedAttendances = dailySummary.used_attendances || undefined;

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

                dailySummary.업데이트한다(
                    undefined,
                    undefined,
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

            return results;
        });
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
}
