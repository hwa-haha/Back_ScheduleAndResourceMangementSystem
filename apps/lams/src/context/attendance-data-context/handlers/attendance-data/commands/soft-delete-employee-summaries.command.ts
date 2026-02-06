import { ICommand } from '@nestjs/cqrs';
import { ISoftDeleteEmployeeSummariesCommand } from '../../../interfaces/command/soft-delete-employee-summaries-command.interface';

/**
 * 특정 직원의 특정 연월 일간/월간 요약 소프트 삭제 커맨드
 */
export class SoftDeleteEmployeeSummariesCommand implements ICommand {
    constructor(public readonly data: ISoftDeleteEmployeeSummariesCommand) {}
}
