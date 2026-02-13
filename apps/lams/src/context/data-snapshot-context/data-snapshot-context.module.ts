import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DataSnapshotContextService } from './data-snapshot-context.service';
import { COMMAND_HANDLERS, QUERY_HANDLERS } from './handlers';
import { DomainDataSnapshotInfoModule } from '../../domain/data-snapshot-info/data-snapshot-info.module';
import { DomainAttendanceIssueModule } from '../../domain/attendance-issue/attendance-issue.module';
import { DomainDailySummaryChangeHistoryModule } from '../../domain/daily-summary-change-history/daily-summary-change-history.module';
import { DomainEmployeeDepartmentPositionHistoryModule } from '@libs/modules/employee-department-position-history/employee-department-position-history.module';
import { OrganizationManagementContextModule } from '../organization-management-context/organization-management-context.module';

/**
 * 데이터 스냅샷 Context Module
 *
 * CQRS 패턴을 사용하여 Command/Query Handler를 등록합니다.
 */
@Module({
    imports: [
        CqrsModule, // CommandBus/QueryBus 제공
        DomainDataSnapshotInfoModule,
        DomainAttendanceIssueModule, // 이슈 복원을 위해 필요
        DomainDailySummaryChangeHistoryModule, // 변경이력 복원을 위해 필요
        DomainEmployeeDepartmentPositionHistoryModule, // 직원 부서 정보 조회를 위해 필요
        OrganizationManagementContextModule,
    ],
    providers: [
        DataSnapshotContextService,
        ...COMMAND_HANDLERS, // Command Handler 등록
        ...QUERY_HANDLERS, // Query Handler 등록
    ],
    exports: [DataSnapshotContextService],
})
export class DataSnapshotContextModule {}
