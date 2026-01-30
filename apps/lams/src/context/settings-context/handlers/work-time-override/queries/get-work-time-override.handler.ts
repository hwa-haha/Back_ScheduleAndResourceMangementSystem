import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { GetWorkTimeOverrideQuery } from './get-work-time-override.query';
import { IGetWorkTimeOverrideResponse } from '../../../interfaces/response/get-work-time-override-response.interface';
import { DomainWorkTimeOverrideService } from '../../../../../domain/work-time-override/work-time-override.service';

/**
 * 특별근태시간 단건 조회 Query Handler
 * id 또는 date로 특별근태시간 1건을 조회한다. id가 있으면 id 우선, 없으면 date로 조회한다.
 */
@QueryHandler(GetWorkTimeOverrideQuery)
export class GetWorkTimeOverrideHandler
    implements IQueryHandler<GetWorkTimeOverrideQuery, IGetWorkTimeOverrideResponse>
{
    private readonly logger = new Logger(GetWorkTimeOverrideHandler.name);

    constructor(private readonly workTimeOverrideService: DomainWorkTimeOverrideService) {}

    async execute(query: GetWorkTimeOverrideQuery): Promise<IGetWorkTimeOverrideResponse> {
        const { id, date } = query.data;

        if (!id && !date) {
            throw new BadRequestException('id 또는 date 중 하나는 필수입니다.');
        }

        if (id) {
            this.logger.log(`특별근태시간 단건 조회: id=${id}`);
            const workTimeOverride = await this.workTimeOverrideService.ID로조회한다(id);
            return { workTimeOverride };
        }

        this.logger.log(`특별근태시간 단건 조회: date=${date}`);
        const workTimeOverride = await this.workTimeOverrideService.날짜로조회한다(date!);
        if (!workTimeOverride) {
            throw new NotFoundException(`특별근태시간을 찾을 수 없습니다. (date: ${date})`);
        }
        return { workTimeOverride };
    }
}
