import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationMigrationService } from './migration.service';
import { SSOModule } from '@libs/integrations/sso/sso.module';
import { DomainDepartmentModule } from '@libs/modules/department/department.module';
import { DomainEmployeeModule } from '@libs/modules/employee/employee.module';
import { DomainPositionModule } from '@libs/modules/position/position.module';
import { DomainRankModule } from '@libs/modules/rank/rank.module';
import { DomainEmployeeDepartmentPositionModule } from '@libs/modules/employee-department-position/employee-department-position.module';
import { DomainEmployeeDepartmentPositionHistoryModule } from '@libs/modules/employee-department-position-history/employee-department-position-history.module';
import { DomainDepartmentHistoryModule } from '@libs/modules/department-history/department-history.module';

/**
 * 조직 데이터 마이그레이션 모듈
 *
 * SSO에서 조직 데이터를 가져와서 로컬 데이터베이스에 동기화하는 기능을 제공합니다.
 */
@Module({
    imports: [
        SSOModule,
        DomainDepartmentModule,
        DomainEmployeeModule,
        DomainPositionModule,
        DomainRankModule,
        DomainEmployeeDepartmentPositionModule,
        DomainEmployeeDepartmentPositionHistoryModule,
        DomainDepartmentHistoryModule,
    ],
    providers: [OrganizationMigrationService],
    exports: [OrganizationMigrationService],
})
export class OrganizationMigrationModule {}
