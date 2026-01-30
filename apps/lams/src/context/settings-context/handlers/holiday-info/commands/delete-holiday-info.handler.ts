import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DeleteHolidayInfoCommand } from './delete-holiday-info.command';
import { IDeleteHolidayInfoResponse } from '../../../interfaces/response/delete-holiday-info-response.interface';
import { DomainHolidayInfoService } from '../../../../../domain/holiday-info/holiday-info.service';

/**
 * 휴일 정보 삭제 Handler
 */
@CommandHandler(DeleteHolidayInfoCommand)
export class DeleteHolidayInfoHandler
    implements ICommandHandler<DeleteHolidayInfoCommand, IDeleteHolidayInfoResponse>
{
    private readonly logger = new Logger(DeleteHolidayInfoHandler.name);

    constructor(
        private readonly holidayInfoService: DomainHolidayInfoService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(command: DeleteHolidayInfoCommand): Promise<IDeleteHolidayInfoResponse> {
        const { id, performedBy } = command.data;

        return await this.dataSource.transaction(async (manager) => {
            try {
                this.logger.log(`휴일 정보 삭제 시작: id=${id}`);

                await this.holidayInfoService.완전삭제한다(id, performedBy, manager);

                this.logger.log(`휴일 정보 삭제 완료: id=${id}`);

                return {
                    success: true,
                };
            } catch (error) {
                this.logger.error(`휴일 정보 삭제 실패: ${error.message}`, error.stack);
                throw error;
            }
        });
    }
}
