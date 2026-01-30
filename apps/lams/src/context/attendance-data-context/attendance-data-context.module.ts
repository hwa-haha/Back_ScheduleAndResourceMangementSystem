import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AttendanceDataContextService } from './attendance-data-context.service';
import { COMMAND_HANDLERS, QUERY_HANDLERS } from './handlers';
import { AttendanceIssueContextModule } from '../attendance-issue-context/attendance-issue-context.module';
import { DomainHolidayInfoModule } from '../../domain/holiday-info/holiday-info.module';
import { DomainUsedAttendanceModule } from '../../domain/used-attendance/used-attendance.module';
import { DomainEventInfoModule } from '../../domain/event-info/event-info.module';
import { DomainDailyEventSummaryModule } from '../../domain/daily-event-summary/daily-event-summary.module';
import { DomainMonthlyEventSummaryModule } from '../../domain/monthly-event-summary/monthly-event-summary.module';
import { DomainAttendanceIssueModule } from '../../domain/attendance-issue/attendance-issue.module';
import { DomainEmployeeModule } from '@libs/modules/employee/employee.module';
import { DomainEmployeeDepartmentPositionHistoryModule } from '@libs/modules/employee-department-position-history/employee-department-position-history.module';
import { DomainDailySummaryChangeHistoryModule } from '../../domain/daily-summary-change-history/daily-summary-change-history.module';
import { DomainWorkTimeOverrideModule } from '../../domain/work-time-override/work-time-override.module';
import { WorkTimePolicyService } from './services/work-time-policy.service';
import { DailySummaryJudgmentService } from './services/daily-summary-judgment.service';
import { DomainAttendanceTypeModule } from '../../domain/attendance-type/attendance-type.module';

/**
 * 출입/근태 데이터 가공 Context Module
 *
 * CQRS 패턴을 사용하여 Command/Query Handler를 등록합니다.
 */
@Module({
    imports: [
        CqrsModule, // CommandBus/QueryBus 제공
        AttendanceIssueContextModule, // 일일요약 생성 시 CreateAttendanceIssuesCommand 핸들러 등록
        DomainHolidayInfoModule,
        DomainUsedAttendanceModule,
        DomainEventInfoModule,
        DomainDailyEventSummaryModule,
        DomainMonthlyEventSummaryModule,
        DomainAttendanceIssueModule,
        DomainEmployeeModule,
        DomainEmployeeDepartmentPositionHistoryModule, // 부서별 직원 조회
        DomainDailySummaryChangeHistoryModule, // 일간 요약 수정이력 조회
        DomainAttendanceTypeModule, // 근태 유형 목록 조회
        DomainWorkTimeOverrideModule, // 근무시간 커스터마이징
    ],
    providers: [
        AttendanceDataContextService,
        WorkTimePolicyService,
        DailySummaryJudgmentService,
        ...COMMAND_HANDLERS, // Command Handler 등록
        ...QUERY_HANDLERS, // Query Handler 등록
    ],
    exports: [AttendanceDataContextService],
})
export class AttendanceDataContextModule {}
