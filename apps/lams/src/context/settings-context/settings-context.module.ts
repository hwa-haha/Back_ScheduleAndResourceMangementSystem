import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SettingsContextService } from './settings-context.service';
import { QUERY_HANDLERS, COMMAND_HANDLERS } from './handlers';
import { DomainEmployeeDepartmentPermissionModule } from '../../domain/employee-department-permission/employee-department-permission.module';
import { DomainEmployeeExtraInfoModule } from '../../domain/employee-extra-info/employee-extra-info.module';
import { DomainHolidayInfoModule } from '../../domain/holiday-info/holiday-info.module';
import { DomainWorkTimeOverrideModule } from '../../domain/work-time-override/work-time-override.module';
import { DomainAttendanceTypeModule } from '../../domain/attendance-type/attendance-type.module';
import { DomainEmployeeModule } from '@libs/modules/employee/employee.module';
import { DomainDepartmentModule } from '@libs/modules/department/department.module';
import { DomainEmployeeDepartmentPositionHistoryModule } from '@libs/modules/employee-department-position-history/employee-department-position-history.module';
import { DomainWageCalculationTypeModule } from '../../domain/wage-calculation-type/wage-calculation-type.module';

/**
 * 설정 관리 Context 모듈
 */
@Module({
    imports: [
        CqrsModule,
        DomainEmployeeDepartmentPermissionModule,
        DomainEmployeeExtraInfoModule,
        DomainHolidayInfoModule,
        DomainWorkTimeOverrideModule,
        DomainAttendanceTypeModule,
        DomainEmployeeModule,
        DomainDepartmentModule,
        DomainEmployeeDepartmentPositionHistoryModule,
        DomainWageCalculationTypeModule,
    ],
    providers: [SettingsContextService, ...QUERY_HANDLERS, ...COMMAND_HANDLERS],
    exports: [SettingsContextService],
})
export class SettingsContextModule {}
