import { Module } from '@nestjs/common';
import { DomainAttendanceTypeModule } from './attendance-type/attendance-type.module';
import { DomainAttendanceIssueModule } from './attendance-issue/attendance-issue.module';
import { DomainDailyEventSummaryModule } from './daily-event-summary/daily-event-summary.module';
import { DomainDataSnapshotChildModule } from './data-snapshot-child/data-snapshot-child.module';
import { DomainDataSnapshotInfoModule } from './data-snapshot-info/data-snapshot-info.module';
import { DomainEventInfoModule } from './event-info/event-info.module';
import { DomainFileModule } from './file/file.module';
import { DomainFileContentReflectionHistoryModule } from './file-content-reflection-history/file-content-reflection-history.module';
import { DomainHolidayInfoModule } from './holiday-info/holiday-info.module';
import { DomainMonthlyEventSummaryModule } from './monthly-event-summary/monthly-event-summary.module';
import { DomainUsedAttendanceModule } from './used-attendance/used-attendance.module';
import { DomainDailySummaryChangeHistoryModule } from './daily-summary-change-history/daily-summary-change-history.module';
import { DomainWorkTimeOverrideModule } from './work-time-override/work-time-override.module';
import { DomainWageCalculationTypeModule } from './wage-calculation-type/wage-calculation-type.module';
import { DomainProjectModule } from './project/project.module';
import { DomainAssignedProjectModule } from './assigned-project/assigned-project.module';
import { DomainWorkHoursModule } from './work-hours/work-hours.module';
import { DomainEmployeeDepartmentPermissionModule } from './employee-department-permission/employee-department-permission.module';
import { DomainEmployeeExtraInfoModule } from './employee-extra-info/employee-extra-info.module';
// 메타데이터 모듈은 @libs/modules에서 import
import { DomainEmployeeModule } from '@libs/modules/employee/employee.module';
import { DomainDepartmentModule } from '@libs/modules/department/department.module';
import { DomainPositionModule } from '@libs/modules/position/position.module';
import { DomainRankModule } from '@libs/modules/rank/rank.module';
import { DomainEmployeeDepartmentPositionModule } from '@libs/modules/employee-department-position/employee-department-position.module';
import { DomainEmployeeDepartmentPositionHistoryModule } from '@libs/modules/employee-department-position-history/employee-department-position-history.module';
import { DomainDepartmentHistoryModule } from '@libs/modules/department-history/department-history.module';

/**
 * 도메인 모듈 통합 모듈
 *
 * refactoring/domain의 모든 도메인 모듈을 한 번에 import할 수 있도록 통합합니다.
 * 각 도메인 모듈은 TypeOrmModule.forFeature()를 통해 엔티티를 등록하므로
 * autoLoadEntities: true 설정에 의해 자동으로 엔티티가 로드됩니다.
 */
@Module({
    imports: [
        // 메타데이터 관련 (공유 가능) - @libs/modules에서 import
        DomainDepartmentModule,
        DomainDepartmentHistoryModule,
        DomainEmployeeModule,
        DomainEmployeeDepartmentPositionModule,
        DomainEmployeeDepartmentPositionHistoryModule,
        DomainPositionModule,
        DomainRankModule,

        // 출입/근태 관련 (LAMS 전용)
        DomainAttendanceTypeModule,
        DomainAttendanceIssueModule,
        DomainDailyEventSummaryModule,
        DomainEventInfoModule,
        DomainHolidayInfoModule,
        DomainUsedAttendanceModule,
        DomainMonthlyEventSummaryModule,
        DomainWorkTimeOverrideModule,
        DomainWageCalculationTypeModule,

        // 데이터 스냅샷 관련 (LAMS 전용)
        DomainDataSnapshotInfoModule,
        DomainDataSnapshotChildModule,

        // 파일 관리 (공유 가능)
        DomainFileModule,
        DomainFileContentReflectionHistoryModule,

        // 이력 관리 (LAMS 전용)
        DomainDailySummaryChangeHistoryModule,

        // 근무분야 관련 (LAMS 전용)
        DomainProjectModule,
        DomainAssignedProjectModule,
        DomainWorkHoursModule,

        // 권한 관리 (LAMS 전용)
        DomainEmployeeDepartmentPermissionModule,

        // 직원 추가 정보 (LAMS 전용)
        DomainEmployeeExtraInfoModule,
    ],
    exports: [
        // // 메타데이터 관련
        // DomainDepartmentModule,
        // DomainEmployeeModule,
        // DomainEmployeeDepartmentPositionModule,
        // DomainPositionModule,
        // DomainRankModule,
        // // 출입/근태 관련
        // DomainAttendanceTypeModule,
        // DomainAttendanceIssueModule,
        // DomainDailyEventSummaryModule,
        // DomainEventInfoModule,
        // DomainHolidayInfoModule,
        // DomainUsedAttendanceModule,
        // DomainMonthlyEventSummaryModule,
        // // 데이터 스냅샷 관련
        // DomainDataSnapshotInfoModule,
        // DomainDataSnapshotChildModule,
        // // 파일 관리
        // DomainFileModule,
        // DomainFileContentReflectionHistoryModule,
        // // 이력 관리
        // DomainDailySummaryChangeHistoryModule,
        // // 근무분야 관련
        // DomainProjectModule,
        // DomainAssignedProjectModule,
        // DomainWorkHoursModule,
    ],
})
export class DomainModule {}
