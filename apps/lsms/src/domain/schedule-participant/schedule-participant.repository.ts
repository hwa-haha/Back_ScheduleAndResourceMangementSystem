import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ScheduleParticipant } from './schedule-participant.entity';
import { BaseRepository } from '../../../libs/repositories/base.repository';
import { IRepositoryOptions } from '../../../libs/interfaces/repository.interface';

@Injectable()
export class DomainScheduleParticipantRepository extends BaseRepository<ScheduleParticipant> {
    constructor(
        @InjectRepository(ScheduleParticipant)
        repository: Repository<ScheduleParticipant>,
    ) {
        super(repository);
    }

    async 조건에_맞는_참가자를_삭제한다(
        where: FindOptionsWhere<ScheduleParticipant>,
        options?: IRepositoryOptions<ScheduleParticipant>,
    ): Promise<void> {
        const repository = options?.queryRunner
            ? options.queryRunner.manager.getRepository(ScheduleParticipant)
            : this.repository;
        await repository.delete(where);
    }
}
