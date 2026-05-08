import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DomainScheduleMyReferenceService } from './schedule-my-reference.service';
import { DomainScheduleMyReferenceRepository } from './schedule-my-reference.repository';
import { ScheduleMyReference } from './schedule-my-reference.entity';

@Module({
    imports: [TypeOrmModule.forFeature([ScheduleMyReference])],
    providers: [DomainScheduleMyReferenceService, DomainScheduleMyReferenceRepository],
    exports: [DomainScheduleMyReferenceService],
})
export class DomainScheduleMyReferenceModule {}
