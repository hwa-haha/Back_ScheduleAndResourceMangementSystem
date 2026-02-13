import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeDepartmentPositionHistory } from './employee-department-position-history.entity';
import { DomainEmployeeDepartmentPositionHistoryService } from './employee-department-position-history.service';
import { Department } from '../department/department.entity';
import { DepartmentHistory } from '../department-history/department-history.entity';

@Module({
    imports: [TypeOrmModule.forFeature([EmployeeDepartmentPositionHistory, Department, DepartmentHistory])],
    providers: [DomainEmployeeDepartmentPositionHistoryService],
    exports: [DomainEmployeeDepartmentPositionHistoryService],
})
export class DomainEmployeeDepartmentPositionHistoryModule {}
