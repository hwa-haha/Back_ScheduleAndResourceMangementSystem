import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WorkHoursContextService } from './work-hours-context.service';
import { QUERY_HANDLERS, COMMAND_HANDLERS } from './handlers';
import { DomainAssignedProjectModule } from '../../domain/assigned-project/assigned-project.module';
import { DomainWorkHoursModule } from '../../domain/work-hours/work-hours.module';
import { DomainProjectModule } from '../../domain/project/project.module';
import { DomainEmployeeDepartmentPositionHistoryModule } from '@libs/modules/employee-department-position-history/employee-department-position-history.module';

/**
 * 시수 관리 Context 모듈
 */
@Module({
    imports: [
        CqrsModule,
        DomainAssignedProjectModule,
        DomainWorkHoursModule,
        DomainProjectModule,
        DomainEmployeeDepartmentPositionHistoryModule,
    ],
    providers: [WorkHoursContextService, ...QUERY_HANDLERS, ...COMMAND_HANDLERS],
    exports: [WorkHoursContextService],
})
export class WorkHoursContextModule {}
