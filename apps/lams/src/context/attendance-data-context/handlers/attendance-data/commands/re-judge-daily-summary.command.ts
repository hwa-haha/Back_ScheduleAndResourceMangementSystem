import { ICommand } from '@nestjs/cqrs';

/**
 * 일간 요약 결근/지각/조퇴 재판정 Command
 * - 기존 출퇴근·근태유형은 그대로 두고, 판정만 다시 계산하여 일간 요약에 반영한다.
 * - 해당 날짜의 모든 직원 일간요약을 재판정한다.
 */
export interface IReJudgeDailySummaryCommand {
    /** 일간 요약 날짜 (YYYY-MM-DD) */
    date: string;
    performedBy?: string;
}

export class ReJudgeDailySummaryCommand implements ICommand {
    constructor(public readonly data: IReJudgeDailySummaryCommand) {}
}
