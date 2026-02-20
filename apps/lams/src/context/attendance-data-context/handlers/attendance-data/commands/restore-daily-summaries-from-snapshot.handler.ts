import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RestoreDailySummariesFromSnapshotCommand } from './restore-daily-summaries-from-snapshot.command';
import { DailyEventSummary } from '../../../../../domain/daily-event-summary/daily-event-summary.entity';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { DomainAttendanceIssueService } from '../../../../../domain/attendance-issue/attendance-issue.service';
import { DomainDailySummaryChangeHistoryService } from '../../../../../domain/daily-summary-change-history/daily-summary-change-history.service';
import { AttendanceIssue } from '../../../../../domain/attendance-issue/attendance-issue.entity';
import { DailySummaryChangeHistory } from '../../../../../domain/daily-summary-change-history/daily-summary-change-history.entity';
import { AttendanceIssueDTO } from '../../../../../domain/attendance-issue/attendance-issue.types';
import { DailySummaryChangeHistoryDTO } from '../../../../../domain/daily-summary-change-history/daily-summary-change-history.types';

/**
 * 스냅샷 기반 일일요약 복원 핸들러
 *
 * flow.md의 "스냅샷 적용 흐름"에 해당
 * - 스냅샷에 저장된 모든 데이터를 기반으로 일일 요약 복원
 * - 기존 일일요약 데이터를 복원
 */
@CommandHandler(RestoreDailySummariesFromSnapshotCommand)
export class RestoreDailySummariesFromSnapshotHandler implements ICommandHandler<
    RestoreDailySummariesFromSnapshotCommand,
    DailyEventSummary[]
> {
    private readonly logger = new Logger(RestoreDailySummariesFromSnapshotHandler.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly attendanceIssueService: DomainAttendanceIssueService,
        private readonly dailySummaryChangeHistoryService: DomainDailySummaryChangeHistoryService,
    ) {}

    async execute(command: RestoreDailySummariesFromSnapshotCommand): Promise<DailyEventSummary[]> {
        const { snapshotData, year, month, performedBy } = command.data;

        return await this.dataSource.transaction(async (manager) => {
            // 1. 스냅샷 데이터에서 일일요약 데이터 추출
            const dailyEventSummaries: Array<{
                date: string;
                employee_id: string;
                is_holiday: boolean;
                enter: string | null;
                leave: string | null;
                real_enter: string | null;
                real_leave: string | null;
                is_checked: boolean;
                is_late: boolean;
                is_early_leave: boolean;
                is_absent: boolean;
                has_attendance_conflict?: boolean;
                has_attendance_overlap?: boolean;
                work_time: number | null;
                note: string | null;
                used_attendances?: Array<{
                    attendanceTypeId: string;
                    title: string;
                    workTime?: number;
                    isRecognizedWorkTime?: boolean;
                    startWorkTime?: string | null;
                    endWorkTime?: string | null;
                    deductedAnnualLeave?: number;
                }> | null;
                issues?: AttendanceIssueDTO[];
                history?: DailySummaryChangeHistoryDTO[];
            }> = [];

            snapshotData.children?.forEach((child) => {
                try {
                    // TypeORM의 JSON 컬럼은 자동으로 파싱되므로 JSON.parse() 불필요
                    const childSnapshotData = child.snapshotData as any;
                    if (childSnapshotData?.dailySummaries && Array.isArray(childSnapshotData.dailySummaries)) {
                        childSnapshotData.dailySummaries.forEach((daily: any) => {
                            dailyEventSummaries.push({
                                date: daily.date,
                                employee_id: daily.employeeId,
                                is_holiday: daily.isHoliday,
                                enter: daily.enter,
                                leave: daily.leave,
                                real_enter: daily.realEnter,
                                real_leave: daily.realLeave,
                                is_checked: daily.isChecked,
                                is_late: daily.isLate,
                                is_early_leave: daily.isEarlyLeave,
                                is_absent: daily.isAbsent,
                                has_attendance_conflict: daily.hasAttendanceConflict,
                                has_attendance_overlap: daily.hasAttendanceOverlap,
                                work_time: daily.workTime,
                                note: daily.note,
                                used_attendances: daily.usedAttendances,
                                issues: daily.issues,
                                history: daily.history,
                            });
                        });
                    }
                } catch (error) {
                    this.logger.error(`스냅샷 데이터 처리 실패 (childId=${child.id}): ${error.message}`, error.stack);
                }
            });

            // 2. 일일 요약 복원
            const restoredSummaries = await this.스냅샷기반일일요약복원({ dailyEventSummaries }, year, month, manager);

            // 2. 복원된 일일 요약 조회 (날짜와 직원 ID 기준으로 매핑)
            const startDateStr = `${year}-${month.padStart(2, '0')}-01`;
            const endDateStr = format(endOfMonth(new Date(Number(year), Number(month) - 1, 1)), 'yyyy-MM-dd');

            const dailySummaries = await manager
                .createQueryBuilder(DailyEventSummary, 'des')
                .where('des.deleted_at IS NULL')
                .andWhere('des.date >= :startDate', {
                    startDate: startDateStr,
                })
                .andWhere('des.date <= :endDate', {
                    endDate: endDateStr,
                })
                .getMany();

            // 날짜와 직원 ID를 키로 하는 매핑 생성
            const dailySummaryMap = new Map<string, DailyEventSummary>();
            dailySummaries.forEach((summary) => {
                const key = `${summary.date}_${summary.employee_id}`;
                dailySummaryMap.set(key, summary);
            });

            // 3. 스냅샷 데이터에서 이슈와 변경이력 정보 추출
            const snapshotIssues: Array<{
                date: string;
                employee_id: string;
                issue: AttendanceIssueDTO;
            }> = [];
            const snapshotHistories: Array<{
                date: string;
                employee_id: string;
                history: DailySummaryChangeHistoryDTO;
            }> = [];

            dailyEventSummaries.forEach((daily) => {
                // 이슈 정보 추출
                if (daily.issues && Array.isArray(daily.issues) && daily.issues.length > 0) {
                    daily.issues.forEach((issue: AttendanceIssueDTO) => {
                        snapshotIssues.push({
                            date: daily.date,
                            employee_id: daily.employee_id,
                            issue,
                        });
                    });
                }

                // 변경이력 정보 추출
                if (daily.history && Array.isArray(daily.history) && daily.history.length > 0) {
                    daily.history.forEach((history: DailySummaryChangeHistoryDTO) => {
                        snapshotHistories.push({
                            date: daily.date,
                            employee_id: daily.employee_id,
                            history,
                        });
                    });
                }
            });

            // 4. 해당 연월의 기존 이슈 소프트 삭제 (복원 후 스냅샷과 동일한 상태 유지를 위해)
            await manager
                .createQueryBuilder()
                .softDelete()
                .from(AttendanceIssue)
                .where('date >= :startDate', { startDate: startDateStr })
                .andWhere('date <= :endDate', { endDate: endDateStr })
                .andWhere('deleted_at IS NULL')
                .execute();

            // 5. 이슈 복원
            let restoredIssueCount = 0;
            for (const snapshotIssue of snapshotIssues) {
                const key = `${snapshotIssue.date}_${snapshotIssue.employee_id}`;
                const dailySummary = dailySummaryMap.get(key);
                if (!dailySummary) {
                    continue;
                }

                try {
                    // 스냅샷 데이터에 원본 ID가 있는 경우, 기존 데이터 조회 (소프트 삭제된 것 포함)
                    let existingIssue: AttendanceIssue | null = null;
                    if (snapshotIssue.issue.id) {
                        existingIssue = await manager.findOne(AttendanceIssue, {
                            where: { id: snapshotIssue.issue.id },
                            withDeleted: true,
                        });
                    }

                    if (existingIssue) {
                        // 기존 데이터 복원 및 업데이트
                        existingIssue.deleted_at = null; // 복원
                        existingIssue.employee_id = snapshotIssue.employee_id;
                        existingIssue.date = snapshotIssue.date;
                        existingIssue.daily_event_summary_id = dailySummary.id;
                        existingIssue.problematic_enter_time = snapshotIssue.issue.problematicEnterTime;
                        existingIssue.problematic_leave_time = snapshotIssue.issue.problematicLeaveTime;
                        existingIssue.corrected_enter_time = snapshotIssue.issue.correctedEnterTime;
                        existingIssue.corrected_leave_time = snapshotIssue.issue.correctedLeaveTime;
                        existingIssue.problematic_attendance_type_ids =
                            snapshotIssue.issue.problematicAttendanceTypeIds;
                        existingIssue.corrected_attendance_type_ids = snapshotIssue.issue.correctedAttendanceTypeIds;
                        existingIssue.description = snapshotIssue.issue.description;
                        existingIssue.status = snapshotIssue.issue.status;
                        existingIssue.confirmed_by = snapshotIssue.issue.confirmedBy;
                        existingIssue.confirmed_at = snapshotIssue.issue.confirmedAt;
                        existingIssue.resolved_at = snapshotIssue.issue.resolvedAt;
                        existingIssue.rejection_reason = snapshotIssue.issue.rejectionReason;
                        existingIssue.수정자설정한다(performedBy);
                        existingIssue.메타데이터업데이트한다(performedBy);

                        await manager.save(AttendanceIssue, existingIssue);
                        restoredIssueCount++;
                    } else {
                        // 기존 데이터가 없으면 새로 생성
                        await this.attendanceIssueService.생성한다(
                            {
                                employeeId: snapshotIssue.employee_id,
                                date: snapshotIssue.date,
                                dailyEventSummaryId: dailySummary.id,
                                problematicEnterTime: snapshotIssue.issue.problematicEnterTime || undefined,
                                problematicLeaveTime: snapshotIssue.issue.problematicLeaveTime || undefined,
                                correctedEnterTime: snapshotIssue.issue.correctedEnterTime || undefined,
                                correctedLeaveTime: snapshotIssue.issue.correctedLeaveTime || undefined,
                                problematicAttendanceTypeIds:
                                    snapshotIssue.issue.problematicAttendanceTypeIds || undefined,
                                correctedAttendanceTypeIds: snapshotIssue.issue.correctedAttendanceTypeIds || undefined,
                                description: snapshotIssue.issue.description || undefined,
                            },
                            manager,
                        );
                        restoredIssueCount++;
                    }
                } catch (error) {
                    this.logger.error(
                        `이슈 복원 실패 (date=${snapshotIssue.date}, employeeId=${snapshotIssue.employee_id}): ${error.message}`,
                        error.stack,
                    );
                }
            }

            // 3. 해당 일간 요약과 연결된 변경 이력 소프트 삭제
            await manager
                .createQueryBuilder()
                .softDelete()
                .from(DailySummaryChangeHistory)
                .where('date >= :startDate', { startDate: startDateStr })
                .andWhere('date <= :endDate', { endDate: endDateStr })
                .andWhere('deleted_at IS NULL')
                .execute();

            // 6. 변경이력 복원
            let restoredHistoryCount = 0;
            for (const snapshotHistory of snapshotHistories) {
                const key = `${snapshotHistory.date}_${snapshotHistory.employee_id}`;
                const dailySummary = dailySummaryMap.get(key);
                if (!dailySummary) {
                    continue;
                }

                try {
                    // 스냅샷 데이터에 원본 ID가 있는 경우, 기존 데이터 조회 (소프트 삭제된 것 포함)
                    let existingHistory: DailySummaryChangeHistory | null = null;
                    if (snapshotHistory.history.id) {
                        existingHistory = await manager.findOne(DailySummaryChangeHistory, {
                            where: { id: snapshotHistory.history.id },
                            withDeleted: true,
                        });
                    }

                    if (existingHistory) {
                        // 기존 데이터 복원 및 업데이트
                        existingHistory.deleted_at = null; // 복원
                        existingHistory.daily_event_summary_id = dailySummary.id;
                        existingHistory.date = snapshotHistory.date;
                        existingHistory.content = snapshotHistory.history.content;
                        existingHistory.changed_by = snapshotHistory.history.changedBy;
                        existingHistory.changed_at = snapshotHistory.history.changedAt;
                        existingHistory.reason = snapshotHistory.history.reason;
                        existingHistory.snapshot_id = snapshotData.id;
                        existingHistory.수정자설정한다(performedBy);
                        existingHistory.메타데이터업데이트한다(performedBy);

                        await manager.save(DailySummaryChangeHistory, existingHistory);
                        restoredHistoryCount++;
                    } else {
                        // 기존 데이터가 없으면 새로 생성
                        await this.dailySummaryChangeHistoryService.생성한다(
                            {
                                dailyEventSummaryId: dailySummary.id,
                                date: snapshotHistory.date,
                                content: snapshotHistory.history.content,
                                changedBy: snapshotHistory.history.changedBy,
                                reason: snapshotHistory.history.reason || undefined,
                                snapshotId: snapshotData.id,
                            },
                            manager,
                        );
                        restoredHistoryCount++;
                    }
                } catch (error) {
                    this.logger.error(
                        `변경이력 복원 실패 (date=${snapshotHistory.date}, employeeId=${snapshotHistory.employee_id}): ${error.message}`,
                        error.stack,
                    );
                }
            }

            this.logger.log(
                `일일요약 복원 완료: year=${year}, month=${month}, summaries=${restoredSummaries.length}, issues=${restoredIssueCount}, histories=${restoredHistoryCount}`,
            );

            return restoredSummaries;
        });
    }

    /**
     * 스냅샷 데이터를 기반으로 일일 요약을 복원한다
     *
     * flow.md의 "스냅샷 적용 흐름"에 해당
     * - 스냅샷에 저장된 모든 데이터를 기반으로 일일 요약 복원
     * - 기존 일일요약 데이터를 복원
     */
    private async 스냅샷기반일일요약복원(
        snapshotData: {
            dailyEventSummaries: Array<{
                date: string;
                employee_id: string;
                is_holiday: boolean;
                enter: string | null;
                leave: string | null;
                real_enter: string | null;
                real_leave: string | null;
                is_checked: boolean;
                is_late: boolean;
                is_early_leave: boolean;
                is_absent: boolean;
                has_attendance_conflict?: boolean;
                has_attendance_overlap?: boolean;
                work_time: number | null;
                note: string | null;
                used_attendances?: Array<{
                    attendanceTypeId: string;
                    title: string;
                    workTime?: number;
                    isRecognizedWorkTime?: boolean;
                    startWorkTime?: string | null;
                    endWorkTime?: string | null;
                    deductedAnnualLeave?: number;
                }> | null;
            }>;
        },
        year: string,
        month: string,
        manager: any,
    ): Promise<DailyEventSummary[]> {
        const summaries: DailyEventSummary[] = [];

        // 스냅샷 데이터를 기반으로 DailyEventSummary 생성 (모든 데이터 사용)
        for (const snapshot of snapshotData.dailyEventSummaries) {
            // 날짜 필터링 (해당 연월만)
            const dateYear = snapshot.date.substring(0, 4);
            const dateMonth = snapshot.date.substring(5, 7);
            if (dateYear !== year || dateMonth !== month) {
                continue;
            }

            const summary = new DailyEventSummary(
                snapshot.date,
                snapshot.employee_id,
                undefined, // monthly_event_summary_id는 나중에 설정
                snapshot.is_holiday,
                snapshot.enter,
                snapshot.leave,
                snapshot.real_enter,
                snapshot.real_leave,
                snapshot.is_checked,
                snapshot.is_late,
                snapshot.is_early_leave,
                snapshot.is_absent,
                snapshot.has_attendance_conflict ?? false,
                snapshot.has_attendance_overlap ?? false,
                snapshot.work_time,
                snapshot.note,
                snapshot.used_attendances,
            );

            summaries.push(summary);
        }

        // 기존 데이터 조회 (소프트 삭제된 데이터 포함)
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const startDate = startOfMonth(new Date(yearNum, monthNum - 1, 1));
        const endDate = endOfMonth(new Date(yearNum, monthNum - 1, 1));
        const startDateStr = format(startDate, 'yyyy-MM-dd');
        const endDateStr = format(endDate, 'yyyy-MM-dd');

        const existingSummaries = await manager
            .createQueryBuilder(DailyEventSummary, 'des')
            .where('des.date >= :startDate', { startDate: startDateStr })
            .andWhere('des.date <= :endDate', { endDate: endDateStr })
            .withDeleted() // 소프트 삭제된 데이터도 조회
            .getMany();

        const existingMap = new Map<string, DailyEventSummary>();
        existingSummaries.forEach((existing) => {
            const key = `${existing.date}_${existing.employee_id}`;
            existingMap.set(key, existing);
        });

        // 복원 및 생성 데이터 분리
        const toSave: DailyEventSummary[] = [];
        summaries.forEach((summary) => {
            const key = `${summary.date}_${summary.employee_id}`;
            const existing = existingMap.get(key);

            if (existing) {
                // 기존 데이터 복원 및 업데이트
                existing.deleted_at = null; // 소프트 삭제 해제
                existing.enter = summary.enter;
                existing.leave = summary.leave;
                existing.real_enter = summary.real_enter;
                existing.real_leave = summary.real_leave;
                existing.is_holiday = summary.is_holiday;
                existing.is_absent = summary.is_absent;
                existing.is_late = summary.is_late;
                existing.is_early_leave = summary.is_early_leave;
                existing.is_checked = summary.is_checked;
                existing.note = summary.note;
                existing.work_time = summary.work_time;
                existing.used_attendances = summary.used_attendances;
                toSave.push(existing);
            } else {
                // 새 데이터 생성
                toSave.push(summary);
            }
        });

        // 배치 저장
        const SUMMARY_BATCH_SIZE = 1000;
        for (let i = 0; i < toSave.length; i += SUMMARY_BATCH_SIZE) {
            const batch = toSave.slice(i, i + SUMMARY_BATCH_SIZE);
            await manager.save(DailyEventSummary, batch);
        }

        return toSave;
    }
}
