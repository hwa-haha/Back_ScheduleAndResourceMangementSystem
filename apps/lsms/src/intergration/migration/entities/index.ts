import { Employee } from './employee.entity';
import { Resource } from './resource.entity';
import { ResourceGroup } from './resource-group.entity';
import { VehicleInfo } from './vehicle-info.entity';
import { MeetingRoomInfo } from './meeting-room-info.entity';
import { AccommodationInfo } from './accommodation-info.entity';
import { EquipmentInfo } from './equipment-info.entity';
import { Reservation } from './reservation.entity';
import { ReservationParticipant } from './reservation-participant.entity';
import { ResourceManager } from './resource-manager.entity';
import { Consumable } from './consumable.entity';
import { Maintenance } from './maintenance.entity';
import { Notification } from './notification.entity';
import { NotificationTypeEntity } from './notification-type.entity';
import { EmployeeNotification } from './employee-notification.entity';
import { File } from './file.entity';
import {
    EmployeeReservationStats,
    ResourceUsageStats,
    VehicleMaintenanceHistory,
    ConsumableMaintenanceStats,
} from './view';
import { ReservationSnapshot } from './reservation-snapshot.entity';
import { ReservationVehicle } from './reservation-vehicle.entity';
import { FileMaintenance } from './file-maintenance.entity';
import { FileReservationVehicle } from './file-reservation-vehicle.entity';
import { FileResource } from './file-resource.entity';
import { FileVehicleInfo } from './file-vehicle-info.entity';
import { ScheduleParticipant } from './schedule-participant.entity';
import { Schedule } from './schedule.entity';
import { ScheduleRelation } from './schedule-relations.entity';
import { RequestLog } from './request-log.entity';
import { Department } from './department.entity';
import { DepartmentEmployee } from './department-employee.entity';
import { ScheduleDepartment } from './schedule-department.entity';

export const Entities = [
    Employee,
    Resource,
    ResourceGroup,
    VehicleInfo,
    MeetingRoomInfo,
    AccommodationInfo,
    EquipmentInfo,
    Reservation,
    ReservationVehicle,
    ReservationSnapshot,
    ReservationParticipant,
    ResourceManager,
    Consumable,
    Maintenance,
    Notification,
    NotificationTypeEntity,
    EmployeeNotification,
    File,
    EmployeeReservationStats,
    ResourceUsageStats,
    VehicleMaintenanceHistory,
    ConsumableMaintenanceStats,
    FileMaintenance,
    FileReservationVehicle,
    FileResource,
    FileVehicleInfo,
    Schedule,
    ScheduleRelation,
    ScheduleParticipant,
    RequestLog,
    Department,
    DepartmentEmployee,
    ScheduleDepartment,
];

export const EntitiesMap = {
    Employee,
    Resource,
    ResourceGroup,
    VehicleInfo,
    MeetingRoomInfo,
    AccommodationInfo,
    EquipmentInfo,
    Reservation,
    ReservationVehicle,
    ReservationSnapshot,
    ReservationParticipant,
    ResourceManager,
    Consumable,
    Maintenance,
    Notification,
    NotificationTypeEntity,
    EmployeeNotification,
    File,
    EmployeeReservationStats,
    ResourceUsageStats,
    VehicleMaintenanceHistory,
    ConsumableMaintenanceStats,
    FileMaintenance,
    FileReservationVehicle,
    FileResource,
    FileVehicleInfo,
    Schedule,
    ScheduleParticipant,
    ScheduleRelation,
    RequestLog,
    Department,
    DepartmentEmployee,
    ScheduleDepartment,
};

export {
    Employee,
    Resource,
    ResourceGroup,
    VehicleInfo,
    MeetingRoomInfo,
    AccommodationInfo,
    EquipmentInfo,
    Reservation,
    ReservationVehicle,
    ReservationSnapshot,
    ReservationParticipant,
    ResourceManager,
    Consumable,
    Maintenance,
    Notification,
    NotificationTypeEntity,
    EmployeeNotification,
    File,
    EmployeeReservationStats,
    ResourceUsageStats,
    VehicleMaintenanceHistory,
    ConsumableMaintenanceStats,
    FileMaintenance,
    FileReservationVehicle,
    FileResource,
    FileVehicleInfo,
    Schedule,
    ScheduleParticipant,
    ScheduleRelation,
    RequestLog,
    Department,
    DepartmentEmployee,
    ScheduleDepartment,
};
