import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { EmployeeContextService } from './employee.context.service';
import { DomainEmployeeModule } from '@libs/modules/employee/employee.module';
import { DomainEmployeeExtraInfoModule } from '../../domain/employee-extra-info/employee-extra-info.module';
// import { DepartmentMicroserviceAdapter } from '../../domain/department/adapters/department-microservice.adapter';
// import { EmployeeMicroserviceAdapter } from '../../../../../libs/temp/employee/adapters/employee-microservice.adapter';
import { DomainEmployeeDepartmentPositionModule } from '@libs/modules/employee-department-position/employee-department-position.module';
import { DomainPositionModule } from '@libs/modules/position/position.module';

@Module({
    imports: [
        DomainEmployeeModule,
        DomainEmployeeExtraInfoModule,
        DomainEmployeeDepartmentPositionModule,
        DomainPositionModule,
        HttpModule.register({ timeout: 10000, maxRedirects: 5 }),
        ConfigModule,
    ],
    providers: [EmployeeContextService],
    exports: [EmployeeContextService],
})
export class EmployeeContextModule {}
