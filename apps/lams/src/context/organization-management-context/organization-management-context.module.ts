import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationManagementContextService } from './organization-management-context.service';
import { QUERY_HANDLERS } from './handlers';
import { DomainDepartmentModule } from '@libs/modules/department/department.module';
import { DomainEmployeeDepartmentPositionHistoryModule } from '@libs/modules/employee-department-position-history/employee-department-position-history.module';
import { DomainEmployeeModule } from '@libs/modules/employee/employee.module';
import { EmployeeDepartmentPositionHistory } from '@libs/modules/employee-department-position-history/employee-department-position-history.entity';
import { DomainEmployeeDepartmentPermissionModule } from '../../domain/employee-department-permission/employee-department-permission.module';
import { DepartmentHistory } from '@libs/modules/department-history/department-history.entity';
import { Department } from '@libs/modules/department/department.entity';

/**
 * 조직 관리 Context Module
 *
 * CQRS 패턴을 사용하여 Query Handler를 등록합니다.
 */
@Module({
    imports: [
        CqrsModule, // QueryBus 제공
        TypeOrmModule.forFeature([EmployeeDepartmentPositionHistory, DepartmentHistory, Department]),
        DomainDepartmentModule,
        DomainEmployeeDepartmentPositionHistoryModule,
        DomainEmployeeModule,
        DomainEmployeeDepartmentPermissionModule,
    ],
    providers: [
        OrganizationManagementContextService,
        ...QUERY_HANDLERS, // Query Handler 등록
    ],
    exports: [OrganizationManagementContextService],
})
export class OrganizationManagementContextModule {}
