import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
    GenerateDailySummariesCommand,
    GenerateMonthlySummariesCommand,
    ReJudgeDailySummaryCommand,
    UpdateDailySummaryCommand,
    UpdateMonthlySummaryNoteCommand,
    UpdateMonthlySummaryForEmployeeCommand,
    GetMonthlySummariesQuery,
    GetMonthlySummaryNoteQuery,
    GetDailySummaryHistoryQuery,
    GetDailySummaryDetailQuery,
    SoftDeleteDailySummariesCommand,
    SoftDeleteMonthlySummariesCommand,
    SoftDeleteEmployeeSummariesCommand,
    RestoreDailySummariesFromSnapshotCommand,
    RestoreMonthlySummariesFromSnapshotCommand,
} from './handlers';
import { CreateAttendanceIssuesCommand } from '../attendance-issue-context/handlers/attendance-issue/commands';
import {
    IGenerateDailySummariesResponse,
    IGenerateMonthlySummariesResponse,
    IGetMonthlySummariesResponse,
    IGetMonthlySummariesQuery,
    IGetMonthlySummaryNoteQuery,
    IGetMonthlySummaryNoteResponse,
    IGetDailySummaryHistoryQuery,
    IGetDailySummaryHistoryResponse,
    IGetDailySummaryDetailQuery,
    IGetDailySummaryDetailResponse,
    IUpdateDailySummaryCommand,
    IUpdateDailySummaryResponse,
    IUpdateMonthlySummaryNoteCommand,
    IUpdateMonthlySummaryNoteResponse,
    IGenerateDailySummariesCommand,
    IReJudgeAndGenerateMonthlyResponse,
    IRestoreDailySummariesFromSnapshotCommand,
    IRestoreMonthlySummariesFromSnapshotCommand,
    ISoftDeleteEmployeeSummariesCommand,
} from './interfaces';
import { DailyEventSummary } from '../../domain/daily-event-summary/daily-event-summary.entity';
import { MonthlyEventSummary } from '../../domain/monthly-event-summary/monthly-event-summary.entity';
import { GetEmployeeDepartmentPositionHistoryListQuery } from '../organization-management-context/handlers/department/queries';

/**
 * 출입/근태 데이터 가공 Context Service
 *
 * CommandBus/QueryBus를 통해 Handler를 호출하는 서비스 레이어입니다.
 */
@Injectable()
export class AttendanceDataContextService {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * 일일 요약을 생성한다
     *
     * flow.md의 "파일내용 반영 후 처리" 흐름 중 일일 요약 생성 부분을 구현합니다.
     *
     * 오케스트레이션 로직:
     * 1. 일일요약 소프트 삭제 핸들러 호출
     * 2. GenerateDailySummariesCommand 실행
     * 3. 근태 이슈 생성 핸들러 호출
     * 4. 결과 반환
     *
     * @param command 일일 요약 생성 명령
     * @returns 일일 요약 생성 결과
     */
    async 일일요약을생성한다(command: IGenerateDailySummariesCommand): Promise<IGenerateDailySummariesResponse> {
        const { year, month, performedBy } = command;

        // 1. 일일요약 소프트 삭제 핸들러 호출
        await this.commandBus.execute(
            new SoftDeleteDailySummariesCommand({
                year,
                month,
                performedBy,
            }),
        );

        // 2. GenerateDailySummariesCommand 실행
        const result = await this.commandBus.execute(
            new GenerateDailySummariesCommand({
                year,
                month,
                performedBy,
            }),
        );
        const summaries = result.summaries || [];

        // 3. 근태 이슈 생성 핸들러 호출
        const issues = await this.commandBus.execute(
            new CreateAttendanceIssuesCommand({
                summaries,
                performedBy,
            }),
        );

        // 4. 결과 반환
        return {
            success: true,
            statistics: {
                dailyEventSummaryCount: summaries.length,
                attendanceIssueCount: issues.length,
            },
        };
    }

    /**
     * 일간 요약 재판정 후 월간 요약을 생성한다
     *
     * 해당 날짜의 모든 직원 일간요약에 대해 결근/지각/조퇴 재판정을 수행한 뒤,
     * 해당 연월의 월간 요약을 다시 생성합니다.
     *
     * 오케스트레이션 로직:
     * 1. ReJudgeDailySummaryCommand 실행 (해당 날짜 전체 일간요약 재판정)
     * 2. GenerateMonthlySummariesCommand 실행 (해당 연월 월간 요약 생성)
     * 3. 결과 반환
     *
     * @param date 일간 요약 날짜 (YYYY-MM-DD)
     * @param performedBy 수행자 ID (선택)
     * @returns 재판정된 일간 요약 목록 및 월간 요약 생성 결과
     */
    async 일간요약재판정후월간요약을생성한다(
        date: string,
        performedBy?: string,
    ): Promise<IReJudgeAndGenerateMonthlyResponse> {
        const [year, month] = date.split('-');
        if (!year || !month) {
            throw new Error(`날짜 형식이 올바르지 않습니다. (YYYY-MM-DD): ${date}`);
        }

        // 1. 해당 날짜의 모든 일간 요약 재판정
        const reJudgeSummaries = await this.commandBus.execute(new ReJudgeDailySummaryCommand({ date, performedBy }));

        // 2. 해당 연월 월간 요약 생성
        const monthlyResult = await this.commandBus.execute(
            new GenerateMonthlySummariesCommand({
                year,
                month: month.padStart(2, '0'),
                performedBy: performedBy ?? '',
            }),
        );

        return {
            reJudgeSummaries,
            monthlyResult,
        };
    }

    /**
     * 월간 요약을 생성한다
     *
     * flow.md의 "파일내용 반영 후 처리" 흐름 중 월간 요약 생성 부분을 구현합니다.
     * 해당 연월에 일간 요약이 있는 모든 직원의 월간 요약을 생성합니다.
     *
     * 오케스트레이션 로직:
     * 1. 월간요약 소프트 삭제 핸들러 호출
     * 2. GenerateMonthlySummariesCommand 실행
     * 3. 결과 반환
     *
     * @param year 연도
     * @param month 월
     * @param performedBy 수행자 ID
     * @returns 월간 요약 생성 결과
     */
    async 월간요약을생성한다(
        year: string,
        month: string,
        performedBy: string,
    ): Promise<IGenerateMonthlySummariesResponse> {
        // 1. 월간요약 소프트 삭제 핸들러 호출
        await this.commandBus.execute(
            new SoftDeleteMonthlySummariesCommand({
                year,
                month,
                performedBy,
            }),
        );

        // 2. GenerateMonthlySummariesCommand 실행
        const command = new GenerateMonthlySummariesCommand({
            year,
            month,
            performedBy,
        });
        return await this.commandBus.execute(command);
    }

    /**
     * 일일 요약을 복원한다
     *
     * 스냅샷 데이터를 기반으로 일일 요약을 복원합니다.
     *
     * @param command 일일 요약 복원 명령
     * @returns 복원된 일일 요약 목록
     */
    async 일일요약을복원한다(command: IRestoreDailySummariesFromSnapshotCommand): Promise<DailyEventSummary[]> {
        return await this.commandBus.execute(new RestoreDailySummariesFromSnapshotCommand(command));
    }

    /**
     * 월간 요약을 복원한다
     *
     * 스냅샷 데이터를 기반으로 월간 요약을 복원합니다.
     *
     * @param command 월간 요약 복원 명령
     * @returns 복원된 월간 요약 목록
     */
    async 월간요약을복원한다(command: IRestoreMonthlySummariesFromSnapshotCommand): Promise<MonthlyEventSummary[]> {
        // 1. 월간요약 소프트 삭제 핸들러 호출
        await this.commandBus.execute(
            new SoftDeleteMonthlySummariesCommand({
                year: command.year,
                month: command.month,
                performedBy: command.performedBy,
            }),
        );
        return await this.commandBus.execute(new RestoreMonthlySummariesFromSnapshotCommand(command));
    }

    /**
     * 월간 요약을 조회한다
     *
     * 연도, 월, 부서ID를 기준으로 월간 요약, 일간 요약, 일간 요약의 수정이력을 조회합니다.
     *
     * @param query 조회 조건
     * @returns 월간 요약 조회 결과
     */
    async 월간요약을조회한다(query: IGetMonthlySummariesQuery): Promise<IGetMonthlySummariesResponse> {
        const employeeHistories = await this.queryBus.execute(
            new GetEmployeeDepartmentPositionHistoryListQuery({
                year: query.year,
                month: query.month,
                departmentId: query.departmentId,
            }),
        );
        const queryCommand = new GetMonthlySummariesQuery({
            ...query,
            employeeHistories,
        });
        return await this.queryBus.execute(queryCommand);
    }

    /**
     * 일간 요약을 수정한다
     *
     * 일간 요약의 출근시간, 퇴근시간, 근태유형을 수정하고 수정이력을 생성합니다.
     * 수정 후 해당 직원의 해당 연월 월간 요약도 업데이트합니다.
     *
     * 오케스트레이션 로직:
     * 1. UpdateDailySummaryCommand 실행 (일간 요약 수정)
     * 2. 수정된 일간 요약의 직원 ID와 연월 정보 추출
     * 3. UpdateMonthlySummaryForEmployeeCommand 실행 (해당 직원의 해당 연월 월간 요약만 업데이트)
     * 4. 결과 반환
     *
     * @param command 수정 명령
     * @returns 일간 요약 수정 결과
     */
    async 일간요약을수정한다(command: IUpdateDailySummaryCommand): Promise<IUpdateDailySummaryResponse> {
        // 1. 일간 요약 수정
        const commandInstance = new UpdateDailySummaryCommand(command);
        const result = await this.commandBus.execute(commandInstance);

        // 2. 수정된 일간 요약의 직원 ID와 연월 정보 추출
        const dateStr = result.dailySummary.date; // YYYY-MM-DD 형식
        const employeeId = result.dailySummary.employeeId;
        const [year, month] = dateStr.split('-');

        if (!year || !month) {
            throw new Error(`날짜 형식이 올바르지 않습니다. (YYYY-MM-DD): ${dateStr}`);
        }

        if (!employeeId) {
            throw new Error(`일간 요약에 직원 ID가 없습니다. dailySummaryId=${command.dailySummaryId}`);
        }

        // 3. 해당 직원의 해당 연월 월간 요약만 업데이트
        await this.commandBus.execute(
            new UpdateMonthlySummaryForEmployeeCommand({
                employeeId,
                year,
                month: month.padStart(2, '0'),
                performedBy: command.performedBy,
            }),
        );

        // 4. 결과 반환
        return result;
    }

    /**
     * 일간 요약 수정이력을 조회한다
     *
     * 일간 요약 ID를 기준으로 해당 일간 요약의 수정이력을 조회합니다.
     *
     * @param query 조회 조건
     * @returns 일간 요약 수정이력 조회 결과
     */
    async 일간요약수정이력을조회한다(query: IGetDailySummaryHistoryQuery): Promise<IGetDailySummaryHistoryResponse> {
        const queryInstance = new GetDailySummaryHistoryQuery(query);
        return await this.queryBus.execute(queryInstance);
    }

    /**
     * 일간 요약 상세를 조회한다
     *
     * 일간 요약 ID를 기준으로 해당 일간 요약의 상세 정보, 수정이력, 근태 이슈를 조회합니다.
     *
     * @param query 조회 조건
     * @returns 일간 요약 상세 조회 결과
     */
    async 일간요약상세를조회한다(query: IGetDailySummaryDetailQuery): Promise<IGetDailySummaryDetailResponse> {
        const queryInstance = new GetDailySummaryDetailQuery(query);
        return await this.queryBus.execute(queryInstance);
    }

    /**
     * 월간 요약 노트를 조회한다
     *
     * 월간 요약 ID를 기준으로 해당 월간 요약의 노트를 조회합니다.
     *
     * @param query 조회 조건
     * @returns 월간 요약 노트 조회 결과
     */
    async 월간요약노트를조회한다(query: IGetMonthlySummaryNoteQuery): Promise<IGetMonthlySummaryNoteResponse> {
        const queryInstance = new GetMonthlySummaryNoteQuery(query);
        return await this.queryBus.execute(queryInstance);
    }

    /**
     * 월간 요약 노트를 수정한다
     *
     * 월간 요약의 노트를 수정합니다.
     *
     * @param command 수정 명령
     * @returns 월간 요약 노트 수정 결과
     */
    async 월간요약노트를수정한다(
        command: IUpdateMonthlySummaryNoteCommand,
    ): Promise<IUpdateMonthlySummaryNoteResponse> {
        const commandInstance = new UpdateMonthlySummaryNoteCommand(command);
        return await this.commandBus.execute(commandInstance);
    }

    /**
     * 특정 직원의 특정 연월 일간/월간 요약을 소프트 삭제한다
     *
     * 특정 직원의 특정 연월에 대한 일간 요약과 월간 요약을 소프트 삭제합니다.
     *
     * @param command 소프트 삭제 명령
     */
    async 특정직원요약을소프트삭제한다(command: ISoftDeleteEmployeeSummariesCommand): Promise<void> {
        const commandInstance = new SoftDeleteEmployeeSummariesCommand(command);
        return await this.commandBus.execute(commandInstance);
    }

    /**
     * 특정 직원의 특정 연월 일간/월간 요약을 생성한다
     *
     * 특정 직원의 특정 연월에 대한 일간 요약과 월간 요약을 생성합니다.
     *
     * @param employeeId 직원 ID
     * @param year 연도
     * @param month 월
     * @param performedBy 수행자 ID
     */
    async 특정직원요약을생성한다(employeeId: string, year: string, month: string, performedBy: string): Promise<void> {
        // 일간 요약 생성 (특정 직원만)
        const dailySummaries: IGenerateDailySummariesResponse = await this.commandBus.execute(
            new GenerateDailySummariesCommand({
                year,
                month,
                performedBy,
                employeeIds: [employeeId],
            }),
        );

        if (dailySummaries.statistics.dailyEventSummaryCount > 0) {
            // 3. 근태 이슈 생성 핸들러 호출
            await this.commandBus.execute(
                new CreateAttendanceIssuesCommand({
                    summaries: dailySummaries.summaries,
                    performedBy,
                }),
            );

            // 월간 요약 생성 (특정 직원만)
            await this.commandBus.execute(
                new GenerateMonthlySummariesCommand({
                    year,
                    month,
                    performedBy,
                    employeeIds: [employeeId],
                }),
            );
        }
    }
}
