import { Module } from '@nestjs/common';
import { SettingsBusinessService } from './settings-business.service';
import { SettingsContextModule } from '../../context/settings-context/settings-context.module';
import { AttendanceDataContextModule } from '../../context/attendance-data-context/attendance-data-context.module';

/**
 * 설정 관리 Business 모듈
 */
@Module({
    imports: [SettingsContextModule, AttendanceDataContextModule],
    providers: [SettingsBusinessService],
    exports: [SettingsBusinessService],
})
export class SettingsBusinessModule {}
