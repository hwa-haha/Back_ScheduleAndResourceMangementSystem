import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource, In, IsNull } from 'typeorm';
import { GetMonthlySummariesQuery } from './get-monthly-summaries.query';
import { IGetMonthlySummariesResponse } from '../../../interfaces/response/get-monthly-summaries-response.interface';
import { DomainMonthlyEventSummaryService } from '../../../../../domain/monthly-event-summary/monthly-event-summary.service';
import { DomainDailyEventSummaryService } from '../../../../../domain/daily-event-summary/daily-event-summary.service';
import { DomainDailySummaryChangeHistoryService } from '../../../../../domain/daily-summary-change-history/daily-summary-change-history.service';
import { DomainAttendanceIssueService } from '../../../../../domain/attendance-issue/attendance-issue.service';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';
import { MonthlyEventSummary } from '../../../../../domain/monthly-event-summary/monthly-event-summary.entity';
import { DailyEventSummary } from '../../../../../domain/daily-event-summary/daily-event-summary.entity';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { AttendanceIssueStatus } from '../../../../../domain/attendance-issue/attendance-issue.types';

/**
 * 월간 요약 조회 Query Handler
 *
 * 연도, 월, 부서ID를 기준으로 월간 요약, 일간 요약, 일간 요약의 수정이력을 조회합니다.
 */
@QueryHandler(GetMonthlySummariesQuery)
export class GetMonthlySummariesHandler implements IQueryHandler<
    GetMonthlySummariesQuery,
    IGetMonthlySummariesResponse
> {
    private readonly logger = new Logger(GetMonthlySummariesHandler.name);

    constructor(
        private readonly monthlyEventSummaryService: DomainMonthlyEventSummaryService,
        private readonly dailyEventSummaryService: DomainDailyEventSummaryService,
        private readonly dailySummaryChangeHistoryService: DomainDailySummaryChangeHistoryService,
        private readonly attendanceIssueService: DomainAttendanceIssueService,
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(query: GetMonthlySummariesQuery): Promise<IGetMonthlySummariesResponse> {
        const { year, month, departmentId } = query.data;

        this.logger.log(`월간 요약 조회 시작: year=${year}, month=${month}, departmentId=${departmentId}`);

        // 날짜 범위 계산
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const startDate = startOfMonth(new Date(yearNum, monthNum - 1, 1));
        const endDate = endOfMonth(new Date(yearNum, monthNum - 1, 1));
        const yyyymm = `${year}-${month.padStart(2, '0')}`;

        // 1. 부서 및 모든 하위 부서에 속한 직원 ID 목록 조회 (해당 연월 기준, 재귀적)
        const monthEndDate = format(endDate, 'yyyy-MM-dd');
        const employeeHistories =
            await this.employeeDepartmentPositionHistoryService.findByDepartmentWithChildrenAtDate(
                departmentId,
                monthEndDate,
            );
        const employeeIds = employeeHistories.map((eh) => eh.employeeId).filter((id) => id);

        if (employeeIds.length === 0) {
            this.logger.warn(`부서에 속한 직원이 없습니다. departmentId=${departmentId}`);
            return {
                monthlySummaries: [],
            };
        }

        // 2. 월간 요약 조회 (일간 요약 포함)
        const monthlySummaries = await this.dataSource.manager
            .createQueryBuilder(MonthlyEventSummary, 'monthly')
            .leftJoinAndSelect('monthly.employee', 'employee')
            .leftJoinAndSelect('monthly.dailyEventSummaries', 'daily')
            .leftJoinAndSelect('daily.employee', 'dailyEmployee')
            .where('monthly.deleted_at IS NULL')
            .andWhere('monthly.yyyymm = :yyyymm', { yyyymm })
            .andWhere('monthly.employee_id IN (:...employeeIds)', { employeeIds })
            .orderBy('monthly.employee_number', 'ASC')
            .addOrderBy('daily.date', 'ASC')
            .getMany();

        // 3. 모든 일간 요약 ID 수집 및 수정이력 조회
        const allDailySummaries: DailyEventSummary[] = [];
        monthlySummaries.forEach((monthly) => {
            if (monthly.dailyEventSummaries && monthly.dailyEventSummaries.length > 0) {
                allDailySummaries.push(...monthly.dailyEventSummaries);
            }
        });

        const dailySummaryIds = allDailySummaries.map((daily) => daily.id);
        const historyMap = await this.dailySummaryChangeHistoryService.일간요약ID목록으로목록조회한다(dailySummaryIds);
        const issueMap = await this.attendanceIssueService.일간요약ID목록으로목록조회한다(dailySummaryIds);

        // 4. 월간 요약별로 일간 요약 데이터 구성 (히스토리 및 근태 이슈 포함)
        const monthlySummaryDTOs = monthlySummaries.map((monthly) => {
            const monthlyDTO = monthly.DTO변환한다();
            const dailySummaries = monthly.dailyEventSummaries || [];

            const dailySummariesWithHistory = dailySummaries.map((daily) => {
                const dailyDTO = daily.DTO변환한다();
                const history = historyMap.get(daily.id) || [];
                const issues = issueMap.get(daily.id) || [];
                const issuesWithoutApplied =
                    issues.filter((issue) => issue.status !== AttendanceIssueStatus.APPLIED) || [];

                return {
                    ...dailyDTO,
                    history: history.length > 0 ? history : undefined,
                    issues: issuesWithoutApplied.length > 0 ? issuesWithoutApplied : undefined,
                };
            });

            return {
                ...monthlyDTO,
                dailySummaries: dailySummariesWithHistory,
            };
        });

        this.logger.log(`월간 요약 조회 완료: monthly=${monthlySummaryDTOs.length}건`);

        return {
            monthlySummaries: monthlySummaryDTOs,
        };
    }
}
