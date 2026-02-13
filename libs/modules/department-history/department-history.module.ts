import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentHistory } from './department-history.entity';
import { DomainDepartmentHistoryService } from './department-history.service';

@Module({
    imports: [TypeOrmModule.forFeature([DepartmentHistory])],
    providers: [DomainDepartmentHistoryService],
    exports: [DomainDepartmentHistoryService],
})
export class DomainDepartmentHistoryModule {}
