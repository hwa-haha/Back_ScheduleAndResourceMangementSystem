import { Injectable, NotFoundException } from '@nestjs/common';
import { DomainScheduleParticipantRepository } from './schedule-participant.repository';
import { BaseService } from '../../../libs/services/base.service';
import { ScheduleParticipant } from './schedule-participant.entity';
import { ParticipantsType } from '../../../libs/enums/reservation-type.enum';
import { In } from 'typeorm';

@Injectable()
export class DomainScheduleParticipantService extends BaseService<ScheduleParticipant> {
    constructor(private readonly scheduleParticipantRepository: DomainScheduleParticipantRepository) {
        super(scheduleParticipantRepository);
    }

    async findByScheduleId(scheduleId: string): Promise<ScheduleParticipant[]> {
        return this.scheduleParticipantRepository.findAll({
            where: { scheduleId },
        });
    }

    async findReserversByScheduleIds(scheduleIds: string[]): Promise<ScheduleParticipant[]> {
        return this.scheduleParticipantRepository.findAll({
            where: { scheduleId: In(scheduleIds), type: ParticipantsType.RESERVER },
        });
    }

    async findByEmployeeIdAndScheduleIds(employeeId: string, scheduleIds: string[]): Promise<ScheduleParticipant[]> {
        return this.scheduleParticipantRepository.findAll({
            where: { employeeId, scheduleId: In(scheduleIds) },
        });
    }

    async findAllByScheduleIds(scheduleIds: string[]): Promise<ScheduleParticipant[]> {
        return this.scheduleParticipantRepository.findAll({
            where: { scheduleId: In(scheduleIds) },
        });
    }

    async findReserverByScheduleId(employeeId: string, scheduleId: string): Promise<ScheduleParticipant> {
        return this.scheduleParticipantRepository.findOne({
            where: { scheduleId, employeeId },
        });
    }

    async checkReserverByScheduleId(employeeId: string, scheduleId: string): Promise<boolean> {
        const reserver = await this.scheduleParticipantRepository.findOne({
            where: { scheduleId, employeeId, type: ParticipantsType.RESERVER },
        });
        return reserver !== null;
    }

    async checkParticipantByScheduleIdAndType(
        employeeId: string,
        scheduleId: string,
        type: ParticipantsType,
    ): Promise<boolean> {
        const participant = await this.scheduleParticipantRepository.findOne({
            where: { scheduleId, employeeId, type },
        });
        return participant !== null;
    }
}
