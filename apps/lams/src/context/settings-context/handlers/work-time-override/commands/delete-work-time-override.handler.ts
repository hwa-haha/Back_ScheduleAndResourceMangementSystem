import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DeleteWorkTimeOverrideCommand } from './delete-work-time-override.command';
import { IDeleteWorkTimeOverrideResponse } from '../../../interfaces/response/delete-work-time-override-response.interface';
import { DomainWorkTimeOverrideService } from '../../../../../domain/work-time-override/work-time-override.service';

/**
 * 특별근태시간 삭제 Handler
 */
@CommandHandler(DeleteWorkTimeOverrideCommand)
export class DeleteWorkTimeOverrideHandler
    implements ICommandHandler<DeleteWorkTimeOverrideCommand, IDeleteWorkTimeOverrideResponse>
{
    private readonly logger = new Logger(DeleteWorkTimeOverrideHandler.name);

    constructor(
        private readonly workTimeOverrideService: DomainWorkTimeOverrideService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(command: DeleteWorkTimeOverrideCommand): Promise<IDeleteWorkTimeOverrideResponse> {
        const { id, performedBy } = command.data;

        return await this.dataSource.transaction(async (manager) => {
            try {
                this.logger.log(`특별근태시간 삭제 시작: id=${id}`);

                await this.workTimeOverrideService.완전삭제한다(id, performedBy, manager);

                this.logger.log(`특별근태시간 삭제 완료: id=${id}`);

                return {
                    success: true,
                };
            } catch (error) {
                this.logger.error(`특별근태시간 삭제 실패: ${error.message}`, error.stack);
                throw error;
            }
        });
    }
}
