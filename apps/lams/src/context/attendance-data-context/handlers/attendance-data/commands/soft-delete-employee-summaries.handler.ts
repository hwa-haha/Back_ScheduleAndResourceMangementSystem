import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SoftDeleteEmployeeSummariesCommand } from './soft-delete-employee-summaries.command';
import { DailyEventSummary } from '../../../../../domain/daily-event-summary/daily-event-summary.entity';
import { MonthlyEventSummary } from '../../../../../domain/monthly-event-summary/monthly-event-summary.entity';
import { AttendanceIssue } from '../../../../../domain/attendance-issue/attendance-issue.entity';
import { DailySummaryChangeHistory } from '../../../../../domain/daily-summary-change-history/daily-summary-change-history.entity';
import { format, startOfMonth, endOfMonth } from 'date-fns';

/**
 * 특정 직원의 특정 연월 일간/월간 요약 소프트 삭제 핸들러
 *
 * 특정 직원의 특정 연월에 대한 일간 요약과 월간 요약을 소프트 삭제합니다.
 */
@CommandHandler(SoftDeleteEmployeeSummariesCommand)
export class SoftDeleteEmployeeSummariesHandler implements ICommandHandler<SoftDeleteEmployeeSummariesCommand, void> {
    private readonly logger = new Logger(SoftDeleteEmployeeSummariesHandler.name);

    constructor(private readonly dataSource: DataSource) {}

    async execute(command: SoftDeleteEmployeeSummariesCommand): Promise<void> {
        const { employeeId, year, month, performedBy } = command.data;

        return await this.dataSource.transaction(async (manager) => {
            // 날짜 범위 계산
            const yearNum = parseInt(year);
            const monthNum = parseInt(month);
            const startDate = startOfMonth(new Date(yearNum, monthNum - 1, 1));
            const endDate = endOfMonth(new Date(yearNum, monthNum - 1, 1));
            const startDateStr = format(startDate, 'yyyy-MM-dd');
            const endDateStr = format(endDate, 'yyyy-MM-dd');
            const yyyymm = `${year}-${month.padStart(2, '0')}`;

            await this.특정직원일간요약소프트삭제(employeeId, startDateStr, endDateStr, performedBy, manager);
            await this.특정직원월간요약소프트삭제(employeeId, yyyymm, performedBy, manager);
        });
    }

    /**
     * 특정 직원의 특정 연월 일간 요약을 소프트 삭제한다
     *
     * @param employeeId 직원 ID
     * @param startDate 시작 날짜 (yyyy-MM-dd)
     * @param endDate 종료 날짜 (yyyy-MM-dd)
     * @param performedBy 수행자 ID
     * @param manager EntityManager
     */
    private async 특정직원일간요약소프트삭제(
        employeeId: string,
        startDate: string,
        endDate: string,
        performedBy: string,
        manager: any,
    ): Promise<void> {
        const existingSummaries = await manager
            .createQueryBuilder(DailyEventSummary, 'des')
            .where('des.deleted_at IS NULL')
            .andWhere('des.employee_id = :employeeId', { employeeId })
            .andWhere('des.date >= :startDate', { startDate })
            .andWhere('des.date <= :endDate', { endDate })
            .getMany();

        if (existingSummaries.length === 0) {
            this.logger.log(`특정 직원 일간요약 소프트 삭제: 조회된 데이터 없음 (employeeId=${employeeId})`);
            return;
        }

        const summaryIds = existingSummaries.map((s) => s.id);
        const now = new Date();

        // 1. 일간 요약 소프트 삭제
        for (const summary of existingSummaries) {
            summary.deleted_at = now;
            summary.수정자설정한다(performedBy);
            summary.메타데이터업데이트한다(performedBy);
        }
        await manager.save(DailyEventSummary, existingSummaries);

        // 2. 해당 일간 요약과 연결된 근태 이슈 소프트 삭제
        const existingIssues = await manager
            .createQueryBuilder(AttendanceIssue, 'ai')
            .where('ai.deleted_at IS NULL')
            .andWhere('ai.daily_event_summary_id IN (:...summaryIds)', { summaryIds })
            .getMany();

        if (existingIssues.length > 0) {
            for (const issue of existingIssues) {
                issue.deleted_at = now;
                issue.수정자설정한다(performedBy);
                issue.메타데이터업데이트한다(performedBy);
            }
            await manager.save(AttendanceIssue, existingIssues);
        }

        // 3. 해당 일간 요약과 연결된 변경 이력 소프트 삭제
        const existingHistories = await manager
            .createQueryBuilder(DailySummaryChangeHistory, 'dsh')
            .where('dsh.deleted_at IS NULL')
            .andWhere('dsh.daily_event_summary_id IN (:...summaryIds)', { summaryIds })
            .getMany();

        if (existingHistories.length > 0) {
            for (const history of existingHistories) {
                history.deleted_at = now;
                history.수정자설정한다(performedBy);
                history.메타데이터업데이트한다(performedBy);
            }
            await manager.save(DailySummaryChangeHistory, existingHistories);
        }

        this.logger.log(
            `특정 직원 일간요약 소프트 삭제 완료: 일간요약=${existingSummaries.length}건, 이슈=${existingIssues.length}건, 변경이력=${existingHistories.length}건 (employeeId=${employeeId})`,
        );
    }

    /**
     * 특정 직원의 특정 연월 월간 요약을 소프트 삭제한다
     *
     * @param employeeId 직원 ID
     * @param yyyymm 연월 (YYYY-MM 형식)
     * @param performedBy 수행자 ID
     * @param manager EntityManager
     */
    private async 특정직원월간요약소프트삭제(
        employeeId: string,
        yyyymm: string,
        performedBy: string,
        manager: any,
    ): Promise<void> {
        const existingSummaries = await manager
            .createQueryBuilder(MonthlyEventSummary, 'mes')
            .where('mes.employee_id = :employeeId', { employeeId })
            .andWhere('mes.yyyymm = :yyyymm', { yyyymm })
            .andWhere('mes.deleted_at IS NULL')
            .getMany();

        if (existingSummaries.length === 0) {
            this.logger.log(
                `특정 직원 월간요약 소프트 삭제: 조회된 데이터 없음 (employeeId=${employeeId}, yyyymm=${yyyymm})`,
            );
            return;
        }

        const now = new Date();
        for (const summary of existingSummaries) {
            summary.deleted_at = now;
            summary.수정자설정한다(performedBy);
            summary.메타데이터업데이트한다(performedBy);
        }

        await manager.save(MonthlyEventSummary, existingSummaries);
        this.logger.log(
            `특정 직원 월간요약 소프트 삭제 완료: ${existingSummaries.length}건 (employeeId=${employeeId}, yyyymm=${yyyymm})`,
        );
    }
}
