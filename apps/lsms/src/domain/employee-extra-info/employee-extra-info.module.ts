import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeExtraInfo } from './employee-extra-info.entity';
import { DomainEmployeeExtraInfoService } from './employee-extra-info.service';

/**
 * 직원 추가 정보 모듈
 */
@Module({
    imports: [TypeOrmModule.forFeature([EmployeeExtraInfo])],
    providers: [DomainEmployeeExtraInfoService],
    exports: [DomainEmployeeExtraInfoService, TypeOrmModule],
})
export class DomainEmployeeExtraInfoModule {}
