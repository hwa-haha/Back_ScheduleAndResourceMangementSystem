import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitService } from './init.service';
import { DomainAttendanceTypeModule } from '../../domain/attendance-type/attendance-type.module';
import { DomainHolidayInfoModule } from '../../domain/holiday-info/holiday-info.module';
import { DomainProjectModule } from '../../domain/project/project.module';
import { DomainEmployeeExtraInfoModule } from '../../domain/employee-extra-info/employee-extra-info.module';
import { DomainFileModule } from '../../domain/file/file.module';
import { OrganizationMigrationModule } from '../migration/migration.module';
import { PrvDbMgrModule } from '../prv-db-mgr/prv-db-mgr.module';
import { FileManagementContextModule } from '../../context/file-management-context/file-management-context.module';

/**
 * 기본 데이터 초기화 모듈
 *
 * 애플리케이션 시작 시 필수 기본 데이터를 자동으로 생성합니다.
 */
@Module({
    imports: [
        DomainAttendanceTypeModule,
        DomainHolidayInfoModule,
        DomainProjectModule,
        DomainEmployeeExtraInfoModule,
        DomainFileModule,
        OrganizationMigrationModule,
        PrvDbMgrModule,
        FileManagementContextModule.forRoot(),
    ],
    providers: [InitService],
})
export class InitModule {}
