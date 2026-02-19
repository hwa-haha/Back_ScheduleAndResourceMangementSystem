export * from './department/queries/get-department-list-for-permission.handler';
export * from './permission/queries/get-permission-related-department-list.handler';
export * from './permission/queries/get-permission-related-employee-list.handler';
export * from './permission/queries/get-employee-permission-list.handler';
export * from './permission/queries/get-department-permission-list.handler';
export * from './holiday-info/queries/get-holiday-list.handler';
export * from './holiday-info/queries/get-holiday.handler';
export * from './work-time-override/queries/get-work-time-override-list.handler';
export * from './work-time-override/queries/get-work-time-override.handler';
export * from './attendance-type/queries/get-attendance-type-list.handler';
export * from './wage-calculation-type/queries/get-wage-calculation-type-list.handler';
export * from './wage-calculation-type/commands/create-wage-calculation-type.handler';
export * from './permission/commands/update-employee-department-permission.handler';
export * from './employee-extra-info/commands/update-employee-extra-info.handler';
export * from './employee-extra-info/queries/get-employee-extra-info-list.handler';
export * from './holiday-info/commands/create-holiday-info.handler';
export * from './holiday-info/commands/update-holiday-info.handler';
export * from './holiday-info/commands/delete-holiday-info.handler';
export * from './work-time-override/commands/create-work-time-override.handler';
export * from './work-time-override/commands/update-work-time-override.handler';
export * from './work-time-override/commands/delete-work-time-override.handler';
export * from './attendance-type/commands/create-attendance-type.handler';
export * from './attendance-type/commands/update-attendance-type.handler';
export * from './attendance-type/commands/delete-attendance-type.handler';

import { GetDepartmentListForPermissionHandler } from './department/queries/get-department-list-for-permission.handler';
import { GetPermissionRelatedDepartmentListHandler } from './permission/queries/get-permission-related-department-list.handler';
import { GetPermissionRelatedEmployeeListHandler } from './permission/queries/get-permission-related-employee-list.handler';
import { GetEmployeePermissionListHandler } from './permission/queries/get-employee-permission-list.handler';
import { GetDepartmentPermissionListHandler } from './permission/queries/get-department-permission-list.handler';
import { GetHolidayListHandler } from './holiday-info/queries/get-holiday-list.handler';
import { GetHolidayHandler } from './holiday-info/queries/get-holiday.handler';
import { GetWorkTimeOverrideListHandler } from './work-time-override/queries/get-work-time-override-list.handler';
import { GetWorkTimeOverrideHandler } from './work-time-override/queries/get-work-time-override.handler';
import { GetAttendanceTypeListHandler } from './attendance-type/queries/get-attendance-type-list.handler';
import { GetWageCalculationTypeListHandler } from './wage-calculation-type/queries/get-wage-calculation-type-list.handler';
import { UpdateEmployeeDepartmentPermissionHandler } from './permission/commands/update-employee-department-permission.handler';
import { UpdateEmployeeExtraInfoHandler } from './employee-extra-info/commands/update-employee-extra-info.handler';
import { GetEmployeeExtraInfoListHandler } from './employee-extra-info/queries/get-employee-extra-info-list.handler';
import { CreateHolidayInfoHandler } from './holiday-info/commands/create-holiday-info.handler';
import { UpdateHolidayInfoHandler } from './holiday-info/commands/update-holiday-info.handler';
import { DeleteHolidayInfoHandler } from './holiday-info/commands/delete-holiday-info.handler';
import { CreateWorkTimeOverrideHandler } from './work-time-override/commands/create-work-time-override.handler';
import { UpdateWorkTimeOverrideHandler } from './work-time-override/commands/update-work-time-override.handler';
import { DeleteWorkTimeOverrideHandler } from './work-time-override/commands/delete-work-time-override.handler';
import { CreateAttendanceTypeHandler } from './attendance-type/commands/create-attendance-type.handler';
import { CreateWageCalculationTypeHandler } from './wage-calculation-type/commands/create-wage-calculation-type.handler';
import { UpdateAttendanceTypeHandler } from './attendance-type/commands/update-attendance-type.handler';
import { DeleteAttendanceTypeHandler } from './attendance-type/commands/delete-attendance-type.handler';

export const QUERY_HANDLERS = [
    GetDepartmentListForPermissionHandler,
    GetPermissionRelatedDepartmentListHandler,
    GetPermissionRelatedEmployeeListHandler,
    GetEmployeePermissionListHandler,
    GetDepartmentPermissionListHandler,
    GetEmployeeExtraInfoListHandler,
    GetHolidayListHandler,
    GetHolidayHandler,
    GetWorkTimeOverrideListHandler,
    GetWorkTimeOverrideHandler,
    GetAttendanceTypeListHandler,
    GetWageCalculationTypeListHandler,
];

export const COMMAND_HANDLERS = [
    UpdateEmployeeDepartmentPermissionHandler,
    UpdateEmployeeExtraInfoHandler,
    CreateHolidayInfoHandler,
    UpdateHolidayInfoHandler,
    DeleteHolidayInfoHandler,
    CreateWorkTimeOverrideHandler,
    UpdateWorkTimeOverrideHandler,
    DeleteWorkTimeOverrideHandler,
    CreateAttendanceTypeHandler,
    CreateWageCalculationTypeHandler,
    UpdateAttendanceTypeHandler,
    DeleteAttendanceTypeHandler,
];
