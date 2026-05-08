import { Module } from '@nestjs/common';

// 도메인 모듈들
import { DomainAccommodationInfoModule } from './accommodation-info/accommodation-info.module';
import { DomainConsumableModule } from './consumable/consumable.module';
import { DomainEquipmentInfoModule } from './equipment-info/equipment-info.module';
import { DomainFileModule } from './file/file.module';
import { DomainFileMaintenanceModule } from './file-maintenance/file-maintenance.module';
import { DomainFileReservationVehicleModule } from './file-reservation-vehicle/file-reservation-vehicle.module';
import { DomainFileResourceModule } from './file-resource/file-resource.module';
import { DomainFileVehicleInfoModule } from './file-vehicle-info/file-vehicle-info.module';
import { DomainMaintenanceModule } from './maintenance/maintenance.module';
import { DomainMeetingRoomInfoModule } from './meeting-room-info/meeting-room-info.module';
import { DomainNotificationModule } from './notification/notification.module';
import { DomainEmployeeNotificationModule } from './employee-notification/employee-notification.module';
import { DomainNotificationTypeModule } from './notification-type/notification-type.module';
import { DomainProjectModule } from './project/project.module';
import { DomainRequestLogModule } from './request-log/request-log.module';
import { DomainReservationModule } from './reservation/reservation.module';
import { DomainReservationParticipantModule } from './reservation-participant/reservation-participant.module';
import { DomainReservationSnapshotModule } from './reservation-snapshot/reservation-snapshot.module';
import { DomainReservationVehicleModule } from './reservation-vehicle/reservation-vehicle.module';
import { DomainResourceModule } from './resource/resource.module';
import { DomainResourceGroupModule } from './resource-group/resource-group.module';
import { DomainResourceManagerModule } from './resource-manager/resource-manager.module';
import { DomainScheduleModule } from './schedule/schedule.module';
import { DomainScheduleDepartmentModule } from './schedule-department/schedule-department.module';
import { DomainScheduleMyReferenceModule } from './schedule-my-reference/schedule-my-reference.module';
import { DomainScheduleParticipantModule } from './schedule-participant/schedule-participant.module';
import { DomainScheduleRelationModule } from './schedule-relation/schedule-relation.module';
import { DomainVehicleInfoModule } from './vehicle-info/vehicle-info.module';

// import { DomainDepartmentEmployeeModule } from '../../../../libs/temp/department-employee/department-employee.module';
import { DomainEmployeeExtraInfoModule } from './employee-extra-info/employee-extra-info.module';

import { DomainDepartmentModule } from '@libs/modules/department/department.module';
import { DomainEmployeeModule } from '@libs/modules/employee/employee.module';
import { DomainEmployeeDepartmentPositionModule } from '@libs/modules/employee-department-position/employee-department-position.module';
import { DomainPositionModule } from '@libs/modules/position/position.module';
import { DomainEmployeeDepartmentPositionHistoryModule } from '@libs/modules/employee-department-position-history/employee-department-position-history.module';
import { DomainRankModule } from '@libs/modules/rank/rank.module';
import { DomainDepartmentHistoryModule } from '@libs/modules/department-history/department-history.module';

/**
 * 도메인 통합 모듈
 *
 * 모든 도메인 모듈을 하나로 통합하여 관리합니다.
 * app.module.ts에서 이 모듈 하나만 import하면 모든 도메인 모듈이 로드됩니다.
 */
@Module({
    imports: [
        // ResourceGroup은 Resource보다 먼저 로드되어야 함 (Resource가 ResourceGroup을 참조)
        DomainResourceGroupModule,
        DomainResourceModule,
        DomainResourceManagerModule,

        DomainAccommodationInfoModule,
        DomainConsumableModule,
        DomainEquipmentInfoModule,
        DomainFileModule,
        DomainFileMaintenanceModule,
        DomainFileReservationVehicleModule,
        DomainFileResourceModule,
        DomainFileVehicleInfoModule,
        DomainMaintenanceModule,
        DomainMeetingRoomInfoModule,
        DomainNotificationModule,
        DomainEmployeeNotificationModule,
        DomainNotificationTypeModule,
        DomainProjectModule,
        DomainRequestLogModule,
        DomainReservationModule,
        DomainReservationParticipantModule,
        DomainReservationSnapshotModule,
        DomainReservationVehicleModule,
        DomainScheduleModule,
        DomainScheduleDepartmentModule,
        DomainScheduleMyReferenceModule,
        DomainScheduleParticipantModule,
        DomainScheduleRelationModule,
        DomainVehicleInfoModule,

        DomainEmployeeExtraInfoModule,
        // DomainDepartmentEmployeeModule,

        DomainDepartmentModule,
        DomainEmployeeModule,
        DomainEmployeeDepartmentPositionModule,
        DomainEmployeeDepartmentPositionHistoryModule,
        DomainPositionModule,
        DomainRankModule,
        DomainDepartmentHistoryModule,
    ],
    exports: [
        DomainAccommodationInfoModule,
        DomainConsumableModule,
        DomainEquipmentInfoModule,
        DomainFileModule,
        DomainFileMaintenanceModule,
        DomainFileReservationVehicleModule,
        DomainFileResourceModule,
        DomainFileVehicleInfoModule,
        DomainMaintenanceModule,
        DomainMeetingRoomInfoModule,
        DomainNotificationModule,
        DomainEmployeeNotificationModule,
        DomainNotificationTypeModule,
        DomainProjectModule,
        DomainRequestLogModule,
        DomainReservationModule,
        DomainReservationParticipantModule,
        DomainReservationSnapshotModule,
        DomainReservationVehicleModule,
        DomainResourceModule,
        DomainResourceGroupModule,
        DomainResourceManagerModule,
        DomainScheduleModule,
        DomainScheduleDepartmentModule,
        DomainScheduleMyReferenceModule,
        DomainScheduleParticipantModule,
        DomainScheduleRelationModule,
        DomainVehicleInfoModule,

        DomainEmployeeExtraInfoModule,
        // DomainDepartmentEmployeeModule,

        DomainDepartmentModule,
        DomainEmployeeModule,
        DomainEmployeeDepartmentPositionModule,
        DomainEmployeeDepartmentPositionHistoryModule,
        DomainPositionModule,
        DomainRankModule,
        DomainDepartmentHistoryModule,
    ],
})
export class DomainModule {}
