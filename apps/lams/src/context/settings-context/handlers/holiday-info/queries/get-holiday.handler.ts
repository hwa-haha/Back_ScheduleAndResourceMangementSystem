import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger, BadRequestException } from '@nestjs/common';
import { GetHolidayQuery } from './get-holiday.query';
import { IGetHolidayResponse } from '../../../interfaces/response/get-holiday-response.interface';
import { DomainHolidayInfoService } from '../../../../../domain/holiday-info/holiday-info.service';

/**
 * 휴일 단건 조회 Query Handler
 * id 또는 date로 휴일 정보 1건을 조회한다. id가 있으면 id 우선, 없으면 date로 조회한다.
 */
@QueryHandler(GetHolidayQuery)
export class GetHolidayHandler implements IQueryHandler<GetHolidayQuery, IGetHolidayResponse> {
    private readonly logger = new Logger(GetHolidayHandler.name);

    constructor(private readonly holidayInfoService: DomainHolidayInfoService) {}

    async execute(query: GetHolidayQuery): Promise<IGetHolidayResponse> {
        const { id, date } = query.data;

        if (!id && !date) {
            throw new BadRequestException('id 또는 date 중 하나는 필수입니다.');
        }

        if (id) {
            this.logger.log(`휴일 단건 조회: id=${id}`);
            const holiday = await this.holidayInfoService.ID로조회한다(id);
            return { holiday };
        }

        this.logger.log(`휴일 단건 조회: date=${date}`);
        const holiday = await this.holidayInfoService.날짜로조회한다(date!);
        return { holiday };
    }
}
