import { Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DomainScheduleMyReferenceRepository } from './schedule-my-reference.repository';
import { BaseService } from '../../../libs/services/base.service';
import { ScheduleMyReference } from './schedule-my-reference.entity';

@Injectable()
export class DomainScheduleMyReferenceService extends BaseService<ScheduleMyReference> {
    constructor(private readonly scheduleMyReferenceRepository: DomainScheduleMyReferenceRepository) {
        super(scheduleMyReferenceRepository);
    }

    async 참조가_존재하는지_확인한다(employeeId: string, scheduleId: string): Promise<boolean> {
        const row = await this.scheduleMyReferenceRepository.findOne({
            where: { employeeId, scheduleId },
        });
        return row !== null;
    }

    async 직원의_참조_일정_ID_목록을_조회한다(employeeId: string): Promise<string[]> {
        const rows = await this.scheduleMyReferenceRepository.findAll({
            where: { employeeId },
            select: { scheduleId: true },
            order: { createdAt: 'DESC' },
        });
        return rows.map((r) => r.scheduleId);
    }

    async 일정_ID_목록에_대한_참조_존재_맵을_만든다(
        employeeId: string,
        scheduleIds: string[],
    ): Promise<Map<string, boolean>> {
        const map = new Map<string, boolean>();
        for (const id of scheduleIds) {
            map.set(id, false);
        }
        if (scheduleIds.length === 0) {
            return map;
        }
        const rows = await this.scheduleMyReferenceRepository.findAll({
            where: { employeeId, scheduleId: In(scheduleIds) },
            select: { scheduleId: true },
        });
        for (const r of rows) {
            map.set(r.scheduleId, true);
        }
        return map;
    }

    async 참조를_추가한다(employeeId: string, scheduleId: string): Promise<ScheduleMyReference> {
        const existing = await this.scheduleMyReferenceRepository.findOne({
            where: { employeeId, scheduleId },
        });
        if (existing) {
            return existing;
        }
        return this.save({ employeeId, scheduleId });
    }

    async 참조를_해제한다(employeeId: string, scheduleId: string): Promise<boolean> {
        const existing = await this.scheduleMyReferenceRepository.findOne({
            where: { employeeId, scheduleId },
        });
        if (!existing) {
            return false;
        }
        await this.delete(existing.scheduleMyReferenceId);
        return true;
    }

    /** 내 일정 목록에 쓰는 기준(시작일·미삭제)으로 참조 일정 ID를 조회한다 */
    async 직원의_시작일_기준_참조_일정_ID_목록을_조회한다(employeeId: string, fromDate: Date): Promise<string[]> {
        return this.scheduleMyReferenceRepository.findScheduleIdsByEmployeeIdFromScheduleStart(employeeId, fromDate);
    }

    /** 캘린더처럼 기간과 겹치는 참조 일정 ID (내 일정 API와 동일한 참조 테이블, 복수 직원) */
    async 복수_직원의_기간과_겹치는_참조_일정_ID_목록을_조회한다(
        employeeIds: string[],
        rangeStart: Date,
        rangeEnd: Date,
    ): Promise<string[]> {
        return this.scheduleMyReferenceRepository.findScheduleIdsByEmployeeIdsOverlappingRange(
            employeeIds,
            rangeStart,
            rangeEnd,
        );
    }
}
