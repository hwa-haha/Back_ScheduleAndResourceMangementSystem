import { ICommand } from '@nestjs/cqrs';
import { IUpdateMonthlySummaryForEmployeeCommand } from '../../../interfaces';

/**
 * 특정 직원의 월간 요약 업데이트 커맨드
 */
export class UpdateMonthlySummaryForEmployeeCommand implements ICommand {
    constructor(public readonly data: IUpdateMonthlySummaryForEmployeeCommand) {}
}
