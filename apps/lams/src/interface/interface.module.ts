import { Module } from '@nestjs/common';
import { FileManagementInterfaceModule } from './file-management/file-management-interface.module';
import { AttendanceDataInterfaceModule } from './attendance-data/attendance-data-interface.module';
import { AttendanceIssueInterfaceModule } from './attendance-issue/attendance-issue-interface.module';
import { OrganizationManagementInterfaceModule } from './organization-management/organization-management-interface.module';
import { SettingsInterfaceModule } from './settings/settings-interface.module';
import { WorkHoursInterfaceModule } from './work-hours/work-hours-interface.module';
import { DashboardInterfaceModule } from './dashboard/dashboard-interface.module';

/**
 * 인터페이스 모듈
 *
 * 모든 API 인터페이스 모듈들을 통합 관리합니다.
 */
@Module({
    imports: [
        FileManagementInterfaceModule,
        AttendanceDataInterfaceModule,
        AttendanceIssueInterfaceModule,
        OrganizationManagementInterfaceModule,
        SettingsInterfaceModule,
        WorkHoursInterfaceModule,
        DashboardInterfaceModule,
    ],
    controllers: [],
    providers: [],
    exports: [],
})
export class InterfaceModule {}
