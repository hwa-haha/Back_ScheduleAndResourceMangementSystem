import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RestoreMonthlySummariesFromSnapshotCommand } from './restore-monthly-summaries-from-snapshot.command';
import { MonthlyEventSummary } from '../../../../../domain/monthly-event-summary/monthly-event-summary.entity';
import { DomainMonthlyEventSummaryService } from '../../../../../domain/monthly-event-summary/monthly-event-summary.service';

/**
 * 스냅샷 기반 월간요약 복원 핸들러
 *
 * 스냅샷에 저장된 월간 요약 데이터를 복원합니다.
 */
@CommandHandler(RestoreMonthlySummariesFromSnapshotCommand)
export class RestoreMonthlySummariesFromSnapshotHandler implements ICommandHandler<
    RestoreMonthlySummariesFromSnapshotCommand,
    MonthlyEventSummary[]
> {
    private readonly logger = new Logger(RestoreMonthlySummariesFromSnapshotHandler.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly monthlyEventSummaryService: DomainMonthlyEventSummaryService,
    ) {}

    async execute(command: RestoreMonthlySummariesFromSnapshotCommand): Promise<MonthlyEventSummary[]> {
        const { snapshotData, year, month, performedBy } = command.data;

        return await this.dataSource.transaction(async (manager) => {
            const summaries: MonthlyEventSummary[] = [];
            const yyyymm = `${year}-${month.padStart(2, '0')}`;

            // 1. 스냅샷 데이터에서 월간요약 데이터 추출
            // 스냅샷 데이터는 IMonthlyEventSummaryWithDailySummaries 타입으로 저장되어 있으며,
            // 각 child의 snapshotData는 MonthlyEventSummaryDTO 전체 + dailySummaries 배열입니다.
            const monthlyEventSummaries: Array<any> = [];

            snapshotData.children?.forEach((child) => {
                try {
                    // TypeORM의 JSON 컬럼은 자동으로 파싱되므로 JSON.parse() 불필요
                    const childSnapshotData = child.snapshotData as any;
                    // 스냅샷 데이터는 IMonthlyEventSummaryWithDailySummaries 타입이므로 최상위 레벨에 MonthlyEventSummaryDTO 전체가 있음
                    if (childSnapshotData && childSnapshotData.employeeId && childSnapshotData.yyyymm) {
                        // MonthlyEventSummaryDTO 전체를 그대로 사용 (dailySummaries는 제외)
                        const { dailySummaries, ...monthlyDTO } = childSnapshotData;
                        monthlyEventSummaries.push(monthlyDTO);
                    }
                } catch (error) {
                    this.logger.error(`스냅샷 데이터 처리 실패 (childId=${child.id}): ${error.message}`, error.stack);
                }
            });

            // 2. 스냅샷 데이터를 기반으로 MonthlyEventSummary 생성
            for (const monthlyDTO of monthlyEventSummaries) {
                // 날짜 필터링 (해당 연월만)
                const snapshotYyyymm = monthlyDTO.yyyymm;
                if (snapshotYyyymm !== yyyymm) {
                    continue;
                }
                if (monthlyDTO.employeeNumber === '20029') {
                    console.log('monthlyDTO', monthlyDTO.note, typeof monthlyDTO.note);
                }
                // MonthlyEventSummary 엔티티 생성 (생성자 파라미터 순서에 맞춤)
                const summary = new MonthlyEventSummary(
                    monthlyDTO.employeeNumber,
                    monthlyDTO.employeeId,
                    monthlyDTO.yyyymm,
                    monthlyDTO.workDaysCount,
                    monthlyDTO.totalWorkTime,
                    monthlyDTO.avgWorkTimes,
                    monthlyDTO.attendanceTypeCount,
                    monthlyDTO.employeeName || undefined,
                    monthlyDTO.totalWorkableTime || undefined,
                    monthlyDTO.weeklyWorkTimeSummary || undefined,
                    monthlyDTO.dailyEventSummary || undefined,
                    monthlyDTO.lateDetails || undefined,
                    monthlyDTO.absenceDetails || undefined,
                    monthlyDTO.earlyLeaveDetails || undefined,
                    monthlyDTO.note,
                    monthlyDTO.additionalNote,
                );
                if (summary.employee_number === '20029') {
                    console.log('summary', summary.note, typeof summary.note);
                }
                summaries.push(summary);
            }

            // 기존 데이터 조회 (소프트 삭제된 데이터 포함)
            const existingSummaries = await manager
                .createQueryBuilder(MonthlyEventSummary, 'mes')
                .where('mes.yyyymm = :yyyymm', { yyyymm })
                .withDeleted() // 소프트 삭제된 데이터도 조회
                .getMany();

            const existingMap = new Map<string, MonthlyEventSummary>();
            existingSummaries.forEach((existing) => {
                const key = `${existing.employee_id}_${existing.yyyymm}`;
                existingMap.set(key, existing);
            });

            // 복원 및 생성 데이터 분리
            const toSave: MonthlyEventSummary[] = [];
            summaries.forEach((summary) => {
                const key = `${summary.employee_id}_${summary.yyyymm}`;
                const existing = existingMap.get(key);

                if (existing) {
                    // 기존 데이터 복원 및 업데이트
                    if (summary.employee_number === '20029') {
                        console.log('existing', summary.note, typeof summary.note);
                    }
                    existing.deleted_at = null; // 소프트 삭제 해제
                    existing.업데이트한다(
                        summary.employee_number,
                        summary.employee_name || undefined,
                        summary.work_days_count,
                        summary.total_workable_time || undefined,
                        summary.total_work_time,
                        summary.avg_work_times,
                        summary.attendance_type_count,
                        summary.weekly_work_time_summary || undefined,
                        summary.daily_event_summary || undefined,
                        summary.late_details || undefined,
                        summary.absence_details || undefined,
                        summary.early_leave_details || undefined,
                        summary.note,
                        summary.additional_note,
                    );
                    existing.수정자설정한다(performedBy);
                    existing.메타데이터업데이트한다(performedBy);
                    toSave.push(existing);
                } else {
                    // 새 데이터 생성
                    summary.수정자설정한다(performedBy);
                    summary.메타데이터업데이트한다(performedBy);
                    toSave.push(summary);
                }
            });

            // 배치 저장
            const SUMMARY_BATCH_SIZE = 1000;
            for (let i = 0; i < toSave.length; i += SUMMARY_BATCH_SIZE) {
                const batch = toSave.slice(i, i + SUMMARY_BATCH_SIZE);
                await manager.save(MonthlyEventSummary, batch);
            }

            this.logger.log(`월간요약 복원 완료: year=${year}, month=${month}, summaries=${toSave.length}`);

            return toSave;
        });
    }
}
