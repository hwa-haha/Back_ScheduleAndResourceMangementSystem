import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AttendanceIssueContextService } from './attendance-issue-context.service';
import { COMMAND_HANDLERS, QUERY_HANDLERS } from './handlers';
import { DomainAttendanceIssueModule } from '../../domain/attendance-issue/attendance-issue.module';
import { OrganizationManagementContextModule } from '../organization-management-context/organization-management-context.module';

/**
 * 근태 이슈 Context Module
 *
 * CQRS 패턴을 사용하여 Command/Query Handler를 등록합니다.
 */
@Module({
    imports: [
        CqrsModule, // CommandBus/QueryBus 제공
        DomainAttendanceIssueModule,
        OrganizationManagementContextModule,
    ],
    providers: [
        AttendanceIssueContextService,
        ...COMMAND_HANDLERS, // Command Handler 등록
        ...QUERY_HANDLERS, // Query Handler 등록
    ],
    exports: [AttendanceIssueContextService],
})
export class AttendanceIssueContextModule {}
