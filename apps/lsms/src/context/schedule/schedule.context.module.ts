import { Module } from '@nestjs/common';
import { DomainScheduleModule } from '../../domain/schedule/schedule.module';
import { DomainScheduleParticipantModule } from '../../domain/schedule-participant/schedule-participant.module';
import { DomainScheduleRelationModule } from '../../domain/schedule-relation/schedule-relation.module';
import { ScheduleQueryContextService } from './services/schedule-query.context.service';
import { ScheduleMutationContextService } from './services/schedule-mutation.context.service';
import { ScheduleAuthorizationService } from './services/schedule-authorization.service';
import { SchedulePolicyService } from './services/schedule-policy.service';
import { ScheduleStateTransitionService } from './services/schedule-state-transition.service';
import { SchedulePostProcessingService } from './services/schedule-post-processing.service';

import { DomainEmployeeModule } from '@libs/modules/employee/employee.module';
import { DomainEmployeeDepartmentPositionModule } from '@libs/modules/employee-department-position/employee-department-position.module';
import { DomainReservationModule } from '../../domain/reservation/reservation.module';
import { DomainResourceModule } from '../../domain/resource/resource.module';
import { DomainResourceGroupModule } from '../../domain/resource-group/resource-group.module';
import { ReservationContextModule } from '../reservation/reservation.context.module';
import { DomainProjectModule } from '../../domain/project/project.module';
import { DomainDepartmentModule } from '@libs/modules/department/department.module';
import { DomainScheduleDepartmentModule } from '../../domain/schedule-department/schedule-department.module';
import { DomainScheduleMyReferenceModule } from '../../domain/schedule-my-reference/schedule-my-reference.module';

@Module({
    imports: [
        DomainScheduleModule,
        DomainScheduleParticipantModule,
        DomainScheduleRelationModule,
        DomainEmployeeModule,
        DomainEmployeeDepartmentPositionModule,
        DomainReservationModule,
        DomainResourceModule,
        DomainResourceGroupModule,
        DomainProjectModule,
        DomainDepartmentModule,
        DomainScheduleDepartmentModule,
        DomainScheduleMyReferenceModule,
        ReservationContextModule,
    ],
    providers: [
        ScheduleQueryContextService,
        ScheduleMutationContextService,
        ScheduleAuthorizationService,
        SchedulePolicyService,
        ScheduleStateTransitionService,
        SchedulePostProcessingService,
    ],
    exports: [
        ScheduleQueryContextService,
        ScheduleMutationContextService,
        ScheduleAuthorizationService,
        SchedulePolicyService,
        ScheduleStateTransitionService,
        SchedulePostProcessingService,
    ],
})
export class ScheduleContextModule {}
