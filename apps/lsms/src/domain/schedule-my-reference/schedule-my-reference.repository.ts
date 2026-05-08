import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleMyReference } from './schedule-my-reference.entity';
import { BaseRepository } from '../../../libs/repositories/base.repository';

@Injectable()
export class DomainScheduleMyReferenceRepository extends BaseRepository<ScheduleMyReference> {
    constructor(
        @InjectRepository(ScheduleMyReference)
        repository: Repository<ScheduleMyReference>,
    ) {
        super(repository);
    }

    /** 내 일정 조회와 동일하게, 삭제되지 않은 일정 중 시작일이 기준 이후인 참조만 반환 */
    async findScheduleIdsByEmployeeIdFromScheduleStart(employeeId: string, fromDate: Date): Promise<string[]> {
        const rows = await this.repository
            .createQueryBuilder('ref')
            .innerJoin('ref.schedule', 'sch')
            .where('ref.employeeId = :employeeId', { employeeId })
            .andWhere('sch.deletedAt IS NULL')
            .andWhere('sch.startDate >= :fromDate', { fromDate })
            .orderBy('ref.createdAt', 'DESC')
            .select(['ref.scheduleId'])
            .getMany();
        return rows.map((r) => r.scheduleId);
    }

    /** 캘린더 월 등 조회 구간과 일정 기간이 겹치는 내 일정(참조) scheduleId (복수 직원, 미삭제 일정만) */
    async findScheduleIdsByEmployeeIdsOverlappingRange(
        employeeIds: string[],
        rangeStart: Date,
        rangeEnd: Date,
    ): Promise<string[]> {
        if (employeeIds.length === 0) {
            return [];
        }
        const rows = await this.repository
            .createQueryBuilder('ref')
            .innerJoin('ref.schedule', 'sch')
            .where('ref.employeeId IN (:...employeeIds)', { employeeIds })
            .andWhere('sch.deletedAt IS NULL')
            .andWhere('sch.startDate <= :rangeEnd', { rangeEnd })
            .andWhere('sch.endDate >= :rangeStart', { rangeStart })
            .orderBy('ref.createdAt', 'DESC')
            .select(['ref.scheduleId'])
            .getMany();
        return [...new Set(rows.map((r) => r.scheduleId))];
    }
}
