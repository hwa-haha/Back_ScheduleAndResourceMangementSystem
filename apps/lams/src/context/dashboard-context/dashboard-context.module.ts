import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DashboardContextService } from './dashboard-context.service';
import { QUERY_HANDLERS } from './handlers';
import { DomainMonthlyEventSummaryModule } from '../../domain/monthly-event-summary/monthly-event-summary.module';
import { DomainUsedAttendanceModule } from '../../domain/used-attendance/used-attendance.module';
import { DomainDataSnapshotInfoModule } from '../../domain/data-snapshot-info/data-snapshot-info.module';
import { DomainDataSnapshotChildModule } from '../../domain/data-snapshot-child/data-snapshot-child.module';
import { DomainEmployeeModule } from '@libs/modules/employee/employee.module';
import { OrganizationManagementContextModule } from '../organization-management-context/organization-management-context.module';

/**
 * 대시보드 Context Module
 *
 * CQRS 패턴을 사용하여 Query Handler를 등록합니다.
 */
@Module({
    imports: [
        CqrsModule,
        DomainMonthlyEventSummaryModule,
        DomainUsedAttendanceModule,
        DomainDataSnapshotInfoModule,
        DomainDataSnapshotChildModule,
        DomainEmployeeModule,
        OrganizationManagementContextModule,
    ],
    providers: [DashboardContextService, ...QUERY_HANDLERS],
    exports: [DashboardContextService],
})
export class DashboardContextModule {}
