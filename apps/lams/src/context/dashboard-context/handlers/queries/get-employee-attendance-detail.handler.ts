import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetEmployeeAttendanceDetailQuery } from './get-employee-attendance-detail.query';
import { IGetEmployeeAttendanceDetailResponse } from '../../interfaces';
import { DomainDataSnapshotInfoService } from '../../../../domain/data-snapshot-info/data-snapshot-info.service';
import { DomainMonthlyEventSummaryService } from '../../../../domain/monthly-event-summary/monthly-event-summary.service';
import { SnapshotType, ApprovalStatus } from '../../../../domain/data-snapshot-info/data-snapshot-info.types';

/**
 * 연도, 월별 직원 근태상세 조회 Query Handler
 *
 * 특정 직원의 연도, 월별 근태 상세 정보를 조회합니다.
 * 부서 월별 직원 근무시간 목록과 동일한 기준으로, 동일 연월에 여러 스냅샷이 있으면
 * 결재 상태 "제출됨"·제출 시간 최신 스냅샷을 사용하고, 없으면 생성 시간 최신 스냅샷을 사용합니다.
 */
@QueryHandler(GetEmployeeAttendanceDetailQuery)
export class GetEmployeeAttendanceDetailHandler implements IQueryHandler<
    GetEmployeeAttendanceDetailQuery,
    IGetEmployeeAttendanceDetailResponse
> {
    private readonly logger = new Logger(GetEmployeeAttendanceDetailHandler.name);

    constructor(
        private readonly dataSnapshotInfoService: DomainDataSnapshotInfoService,
        private readonly monthlyEventSummaryService: DomainMonthlyEventSummaryService,
    ) {}

    async execute(query: GetEmployeeAttendanceDetailQuery): Promise<IGetEmployeeAttendanceDetailResponse> {
        const { employeeId, year, month } = query.data;

        this.logger.log(`연도, 월별 직원 근태상세 조회: employeeId=${employeeId}, year=${year}, month=${month}`);

        // 1. 스냅샷에서 직원 데이터 조회
        const yyyy = year;
        const mm = month.padStart(2, '0');
        const snapshots = await this.dataSnapshotInfoService.연월과타입으로목록조회_자식직원필터한다(
            yyyy,
            mm,
            SnapshotType.MONTHLY,
            [employeeId],
        );

        // 2. 직원별 최적 child 선택 (제출됨·최신 우선) — 부서 월별 직원 근무시간 목록과 동일 기준
        const candidates: Array<{
            parent: (typeof snapshots)[0];
            child: NonNullable<(typeof snapshots)[0]['children']>[0];
        }> = [];
        for (const parent of snapshots) {
            if (parent.children && parent.children.length > 0) {
                for (const child of parent.children) {
                    candidates.push({ parent, child });
                }
            }
        }

        let snapshotData: any = null;
        if (candidates.length === 1) {
            const { child } = candidates[0];
            snapshotData = typeof child.snapshotData === 'string' ? JSON.parse(child.snapshotData) : child.snapshotData;
        } else if (candidates.length > 1) {
            const submitted = candidates.filter(
                (c) => c.parent.approvalStatus === ApprovalStatus.SUBMITTED && c.parent.submittedAt != null,
            );
            const toSort = submitted.length > 0 ? submitted : candidates;
            const bySubmitted = submitted.length > 0;
            toSort.sort((a, b) => {
                const dateA = bySubmitted
                    ? a.parent.submittedAt
                        ? new Date(a.parent.submittedAt).getTime()
                        : 0
                    : a.parent.createdAt
                      ? new Date(a.parent.createdAt).getTime()
                      : 0;
                const dateB = bySubmitted
                    ? b.parent.submittedAt
                        ? new Date(b.parent.submittedAt).getTime()
                        : 0
                    : b.parent.createdAt
                      ? new Date(b.parent.createdAt).getTime()
                      : 0;
                return dateB - dateA;
            });
            const selected = toSort[0].child;
            snapshotData =
                typeof selected.snapshotData === 'string' ? JSON.parse(selected.snapshotData) : selected.snapshotData;
        }

        // 스냅샷 데이터가 없으면 월간 요약에서 조회
        if (!snapshotData) {
            return null;
            // const yyyymm = `${year}-${month}`;
            // const monthlySummary = await this.monthlyEventSummaryService.일일요약포함조회한다(employeeId, yyyymm);

            // if (!monthlySummary) {
            //     throw new NotFoundException('해당 기간의 근태 데이터를 찾을 수 없습니다.');
            // }
            // // 월간 요약 데이터를 스냅샷 형식으로 변환
            // snapshotData = {
            //     monthlyEventSummaryId: monthlySummary.id,
            //     employeeNumber: monthlySummary.employeeNumber,
            //     employeeId: monthlySummary.employeeId,
            //     employeeName: monthlySummary.employeeName || '',
            //     yyyymm: monthlySummary.yyyymm,
            //     note: monthlySummary.note || '',
            //     additionalNote: monthlySummary.additionalNote || '',
            //     workDaysCount: monthlySummary.workDaysCount,
            //     totalWorkableTime: monthlySummary.totalWorkableTime,
            //     totalWorkTime: monthlySummary.totalWorkTime,
            //     avgWorkTimes: monthlySummary.avgWorkTimes,
            //     attendanceTypeCount: monthlySummary.attendanceTypeCount || {},
            //     dailySummaries: monthlySummary.dailyEventSummary || [],
            //     weeklyWorkTimeSummary: monthlySummary.weeklyWorkTimeSummary || [],
            //     lateDetails: monthlySummary.lateDetails || [],
            //     absenceDetails: monthlySummary.absenceDetails || [],
            //     earlyLeaveDetails: monthlySummary.earlyLeaveDetails || [],
            // };
        }

        // 2. DTO 변환
        const dailyEventSummary = snapshotData.dailySummaries || [];
        const dailyAttendanceDetails = dailyEventSummary.map((daily: any) => ({
            dailyEventSummaryId: daily.dailyEventSummaryId || '',
            date: daily.date,
            isHoliday: daily.isHoliday || false,
            enter: daily.enter || null,
            leave: daily.leave || null,
            realEnter: daily.realEnter || null,
            realLeave: daily.realLeave || null,
            isChecked: daily.isChecked !== undefined ? daily.isChecked : true,
            isLate: daily.isLate || false,
            isEarlyLeave: daily.isEarlyLeave || false,
            isAbsent: daily.isAbsent || false,
            workTime: daily.workTime || null,
            note: daily.note || null,
            usedAttendances: (daily.usedAttendances || []).map((ua: any) => ({
                usedAttendanceId: ua.usedAttendanceId || '',
                attendanceTypeId: ua.attendanceTypeId || '',
                title: ua.title || '',
            })),
        }));

        const weeklyWorkTimeSummary = (snapshotData.weeklyWorkTimeSummary || []).map((week: any) => ({
            weekNumber: week.weekNumber,
            startDate: week.startDate,
            endDate: week.endDate,
            weeklyWorkTime: Math.round((week.weeklyWorkTime / 60) * 100) / 100, // 분을 시간으로 변환
        }));

        const attendanceTypeCount = Object.entries(snapshotData.attendanceTypeCount || {}).map(([title, count]) => ({
            title,
            count: count as number,
        }));

        const annualLeaveData = snapshotData.annualLeaveData
            ? {
                  totalAnnualLeave:
                      snapshotData.annualLeaveData.fiscalYearTotalLeave ||
                      snapshotData.annualLeaveData.totalAnnualLeave ||
                      0,
                  usedAnnualLeave: snapshotData.annualLeaveData.usedAnnualLeave || 0,
                  remainingAnnualLeave:
                      snapshotData.annualLeaveData.remainedAnnualLeave ||
                      snapshotData.annualLeaveData.remainingAnnualLeave ||
                      0,
                  birthDayLeaveDetails: (snapshotData.annualLeaveData.birthDayLeaveDetails || []).map(
                      (detail: any) => ({
                          usedAt: detail.usedAt,
                          leaveType: detail.attendanceType?.title || detail.leaveType || '',
                      }),
                  ),
                  createdAt: snapshotData.annualLeaveData.createdAt
                      ? new Date(snapshotData.annualLeaveData.createdAt).toISOString()
                      : new Date().toISOString(),
                  updatedAt: snapshotData.annualLeaveData.updatedAt
                      ? new Date(snapshotData.annualLeaveData.updatedAt).toISOString()
                      : new Date().toISOString(),
                  isAdjusted: snapshotData.annualLeaveData.isAdjusted || false,
              }
            : null;

        const monthlyStatistics = {
            monthlyEventSummaryId: snapshotData.monthlyEventSummaryId || '',
            workDaysCount: snapshotData.workDaysCount || 0,
            totalWorkableTime: snapshotData.totalWorkableTime || 0,
            totalWorkTime: snapshotData.totalWorkTime || 0,
            avgWorkTimes: snapshotData.avgWorkTimes || 0,
            attendanceTypeCount,
            weeklyWorkTimeSummary,
            annualLeaveData,
        };

        const lateDetails = (snapshotData.lateDetails || []).map((detail: any) => ({
            dailyEventSummaryId: detail.dailyEventSummaryId || '',
            date: detail.date,
            isHoliday: detail.isHoliday || false,
            enter: detail.enter || null,
            leave: detail.leave || null,
            realEnter: detail.realEnter || null,
            realLeave: detail.realLeave || null,
            isChecked: detail.isChecked !== undefined ? detail.isChecked : true,
            isLate: detail.isLate || false,
            isEarlyLeave: detail.isEarlyLeave || false,
            isAbsent: detail.isAbsent || false,
            workTime: detail.workTime || null,
            note: detail.note || null,
            usedAttendances: (detail.usedAttendances || []).map((ua: any) => ({
                usedAttendanceId: ua.usedAttendanceId || '',
                attendanceTypeId: ua.attendanceTypeId || '',
                title: ua.title || '',
            })),
        }));

        const absenceDetails = (snapshotData.absenceDetails || []).map((detail: any) => ({
            dailyEventSummaryId: detail.dailyEventSummaryId || '',
            date: detail.date,
            isHoliday: detail.isHoliday || false,
            enter: detail.enter || null,
            leave: detail.leave || null,
            realEnter: detail.realEnter || null,
            realLeave: detail.realLeave || null,
            isChecked: detail.isChecked !== undefined ? detail.isChecked : true,
            isLate: detail.isLate || false,
            isEarlyLeave: detail.isEarlyLeave || false,
            isAbsent: detail.isAbsent || false,
            workTime: detail.workTime || null,
            note: detail.note || null,
            usedAttendances: (detail.usedAttendances || []).map((ua: any) => ({
                usedAttendanceId: ua.usedAttendanceId || '',
                attendanceTypeId: ua.attendanceTypeId || '',
                title: ua.title || '',
            })),
        }));

        const earlyLeaveDetails = (snapshotData.earlyLeaveDetails || []).map((detail: any) => ({
            dailyEventSummaryId: detail.dailyEventSummaryId || '',
            date: detail.date,
            isHoliday: detail.isHoliday || false,
            enter: detail.enter || null,
            leave: detail.leave || null,
            realEnter: detail.realEnter || null,
            realLeave: detail.realLeave || null,
            isChecked: detail.isChecked !== undefined ? detail.isChecked : true,
            isLate: detail.isLate || false,
            isEarlyLeave: detail.isEarlyLeave || false,
            isAbsent: detail.isAbsent || false,
            workTime: detail.workTime || null,
            note: detail.note || null,
            usedAttendances: (detail.usedAttendances || []).map((ua: any) => ({
                usedAttendanceId: ua.usedAttendanceId || '',
                attendanceTypeId: ua.attendanceTypeId || '',
                title: ua.title || '',
            })),
        }));

        return {
            employeeId: snapshotData.employeeId || employeeId,
            employeeName: snapshotData.employeeName || '',
            employeeNumber: snapshotData.employeeNumber || '',
            yyyymm: snapshotData.yyyymm || `${year}-${month}`,
            monthlyStatistics,
            dailyAttendanceDetails,
            lateDetails,
            absenceDetails,
            earlyLeaveDetails,
        };
    }
}
