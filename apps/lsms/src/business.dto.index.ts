// 🎯 Business Layer DTOs - 비즈니스 레이어 모든 DTO Export

export * from './business/auth-management/dtos/login.dto';
export * from './business/auth-management/dtos/login-response.dto';

// ============================================================================
// 📋 SHARED/COMMON DTOs (from libs)
// ============================================================================
export { PaginationQueryDto } from '../libs/dtos/pagination-query.dto';
export { PaginationData, PaginationMetaDto } from '../libs/dtos/pagination-response.dto';

// ============================================================================
// 📋 RESERVATION MANAGEMENT DTOs
// ============================================================================
export * from './business/reservation-management/dtos/create-reservation.dto';
export * from './business/reservation-management/dtos/reservaion-query.dto';
export * from './business/reservation-management/dtos/reservation-list-query.dto';
export * from './business/reservation-management/dtos/reservation-list-response.dto';
export * from './business/reservation-management/dtos/reservation-response.dto';
export * from './business/reservation-management/dtos/return-vehicle-response.dto';
export * from './business/reservation-management/dtos/update-reservation.dto';

// ============================================================================
// 📋 SCHEDULE MANAGEMENT DTOs
// ============================================================================

// 📅 Schedule Request DTOs
export * from './business/schedule-management/dtos/schedule-create-request.dto';
export * from './business/schedule-management/dtos/schedule-update-request.dto';
export * from './business/schedule-management/dtos/schedule-cancel-request.dto';
export * from './business/schedule-management/dtos/schedule-complete-request.dto';
export * from './business/schedule-management/dtos/schedule-extend-request.dto';

// 📅 Schedule Response DTOs
export * from './business/schedule-management/dtos/schedule-create-response.dto';
export * from './business/schedule-management/dtos/schedule-update-response.dto';
export * from './business/schedule-management/dtos/schedule-detail-response.dto';
export * from './business/schedule-management/dtos/schedule-cancel-response.dto';
export * from './business/schedule-management/dtos/schedule-complete-response.dto';
export * from './business/schedule-management/dtos/schedule-extend-response.dto';
export * from './business/schedule-management/dtos/resource-schedule-response.dto';
export * from './business/schedule-management/dtos/schedule-calendar-response.dto';
export * from './business/schedule-management/dtos/my-schedule-response.dto';
export * from './business/schedule-management/dtos/my-schedule-statistics-response.dto';

// 📅 Schedule Query DTOs
export * from './business/schedule-management/dtos/schedule-detail-query.dto';
export * from './business/schedule-management/dtos/schedule-calendar-query.dto';
export * from './business/schedule-management/dtos/resource-schedule-query.dto';
export * from './business/schedule-management/dtos/my-schedule-query.dto';
export * from './business/schedule-management/dtos/my-schedule-statistics-query.dto';

// ============================================================================
// 📋 EMPLOYEE MANAGEMENT DTOs
// ============================================================================

// 📅 Department Query DTOs
export * from './business/employee-management/dtos/department-response.dto';

// 👤 Employee CRUD DTOs
export * from './business/employee-management/dtos/create-employee.dto';
export * from './business/employee-management/dtos/update-employee.dto';
export * from './business/employee-management/dtos/employee-response.dto';
export * from './business/employee-management/dtos/user-response.dto';
export * from './business/employee-management/dtos/employees-by-department-response.dto';
export * from './business/employee-management/dtos/mms-employee-response.dto';

// 👤 Employee Auth/Security DTOs
export * from './business/employee-management/dtos/change-password.dto';
export * from './business/employee-management/dtos/check-password.dto';
export * from './business/employee-management/dtos/change-role.dto';

// 👤 Employee Settings DTOs
export * from './business/employee-management/dtos/notification-settings.dto';

// ============================================================================
// 📋 TASK MANAGEMENT DTOs
// ============================================================================
export * from './business/task-management/dtos/task-response.dto';

// ============================================================================
// 📋 RESOURCE MANAGEMENT DTOs
// ============================================================================

// 🏨 Accommodation DTOs
export * from './business/resource-management/dtos/accommodation/accommodation-info-response.dto';
export * from './business/resource-management/dtos/accommodation/create-accommodation-info.dto';
export * from './business/resource-management/dtos/accommodation/update-accommodation-info.dto';

// 🔧 Equipment DTOs
export * from './business/resource-management/dtos/equipment/create-equipment-info.dto';
export * from './business/resource-management/dtos/equipment/equipment-info-response.dto';
export * from './business/resource-management/dtos/equipment/update-equipment-info.dto';

// 🏢 Meeting Room DTOs
export * from './business/resource-management/dtos/meeting-room/create-meeting-room-info.dto';
export * from './business/resource-management/dtos/meeting-room/meeting-room-info-response.dto';
export * from './business/resource-management/dtos/meeting-room/update-meeting-room-info.dto';

// 📦 Resource DTOs
export * from './business/resource-management/dtos/resource/check-availability.dto';
export * from './business/resource-management/dtos/resource/create-resource.dto';
export * from './business/resource-management/dtos/resource/resource-query.dto';
export * from './business/resource-management/dtos/resource/resource-response.dto';
export * from './business/resource-management/dtos/resource/time-slot.dto';
export * from './business/resource-management/dtos/resource/update-resource.dto';
export * from './business/resource-management/dtos/resource/resource-month-availability-query.dto';
export * from './business/resource-management/dtos/resource/resource-month-availability-response.dto';
// Note: available-time-response.dto exports ResourceAvailabilityDto (TimeSlotDto already exported above)
export { ResourceAvailabilityDto } from './business/resource-management/dtos/resource/available-time-response.dto';

// 🚗 Vehicle DTOs
export * from './business/resource-management/dtos/vehicle/create-vehicle-info.dto';
export * from './business/resource-management/dtos/vehicle/update-vehicle-info.dto';
export * from './business/resource-management/dtos/vehicle/vehicle-response.dto';
// Note: return-vehicle-response.dto already exported from reservation-management

// ============================================================================
// 📋 CONTEXT LAYER DTOs
// ============================================================================

// 📢 Context Notification DTOs
export {
    CreateNotificationDto,
    CreateNotificationDataDto,
    CreateEmployeeNotificationDto,
    SendNotificationDto,
} from './context/notification/dtos/create-notification.dto';

export {
    ResponseNotificationDto,
    NotificationDataDto,
    PushNotificationSendResult,
} from './context/notification/dtos/response-notification.dto';

export {
    NotificationTypeResponseDto,
    NotificationTypeRequirementsDto,
    NotificationTypeScheduleRequirementsDto,
    NotificationTypeReservationRequirementsDto,
    NotificationTypeResourceRequirementsDto,
    NotificationTypeProjectRequirementsDto,
    NotificationTypeVehicleInfoRequirementsDto,
    NotificationTypeConsumableRequirementsDto,
} from './context/notification/dtos/notification-type-response.dto';

export { PushSubscriptionDto } from './context/notification/dtos/push-subscription.dto';
export { PushNotificationDto, PushNotificationPayload } from './context/notification/dtos/send-notification.dto';

// 📁 Context File DTOs
export { CreateFileDataDto } from './context/file/dtos/create-filedata.dto';
export { FileResponseDto } from './context/file/dtos/file-response.dto';
export { ReservationVehicleFileResponseDto } from './context/file/dtos/reservation-vehicle-file-response.dto';
export * from './context/file/dtos/index';

// Dev · 조직 시드 (Swagger 스키마)
export * from './dev-org-seed/dtos/organization-seed-response.dto';

// ============================================================================
// 📋 BUSINESS LAYER SPECIFIC DTOs
// ============================================================================

// 📢 Notification Management DTOs
export { NotificationListResponseDto } from './business/notification-management/dtos/notification-list-response.dto';
