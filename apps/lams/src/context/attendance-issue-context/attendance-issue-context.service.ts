import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
    GetAttendanceIssuesQuery,
    GetAttendanceIssueQuery,
    GetAttendanceIssuesByDepartmentQuery,
    UpdateAttendanceIssueDescriptionCommand,
    UpdateAttendanceIssueCorrectionCommand,
    ApplyAttendanceIssueCommand,
    RejectAttendanceIssueCommand,
    ReRequestAttendanceIssueCommand,
    ReRequestAttendanceIssuesCommand,
    RequestAttendanceIssueCommand,
} from './handlers/attendance-issue';
import {
    IGetAttendanceIssuesQuery,
    IGetAttendanceIssuesResponse,
    IGetAttendanceIssueQuery,
    IGetAttendanceIssueResponse,
    IGetAttendanceIssuesByDepartmentQuery,
    IGetAttendanceIssuesByDepartmentResponse,
    IUpdateAttendanceIssueDescriptionCommand,
    IUpdateAttendanceIssueDescriptionResponse,
    IUpdateAttendanceIssueCorrectionCommand,
    IUpdateAttendanceIssueCorrectionResponse,
    IApplyAttendanceIssueCommand,
    IApplyAttendanceIssueResponse,
    IRejectAttendanceIssueCommand,
    IRejectAttendanceIssueResponse,
    IReRequestAttendanceIssueCommand,
    IReRequestAttendanceIssueResponse,
    IReRequestAttendanceIssuesCommand,
    IReRequestAttendanceIssuesResponse,
    IRequestAttendanceIssueCommand,
    IRequestAttendanceIssueResponse,
} from './interfaces';

/**
 * 근태 이슈 Context Service
 *
 * CommandBus/QueryBus를 통해 Handler를 호출하는 서비스 레이어입니다.
 */
@Injectable()
export class AttendanceIssueContextService {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * 근태 이슈 목록을 조회한다
     */
    async 근태이슈목록을조회한다(query: IGetAttendanceIssuesQuery): Promise<IGetAttendanceIssuesResponse> {
        const queryInstance = new GetAttendanceIssuesQuery(query);
        return await this.queryBus.execute(queryInstance);
    }

    /**
     * 연월/부서별 근태 이슈를 조회한다
     *
     * 해당 연월과 부서에 소속되었던 직원들의 근태 이슈를 조회하고 직원별로 그룹핑합니다.
     */
    async 연월부서별근태이슈를조회한다(
        query: IGetAttendanceIssuesByDepartmentQuery,
    ): Promise<IGetAttendanceIssuesByDepartmentResponse> {
        return await this.queryBus.execute(new GetAttendanceIssuesByDepartmentQuery(query));
    }

    /**
     * 근태 이슈를 조회한다
     */
    async 근태이슈를조회한다(query: IGetAttendanceIssueQuery): Promise<IGetAttendanceIssueResponse> {
        const queryInstance = new GetAttendanceIssueQuery(query);
        return await this.queryBus.execute(queryInstance);
    }

    /**
     * 근태 이슈 사유를 수정한다 (직원용)
     */
    async 근태이슈사유를수정한다(
        command: IUpdateAttendanceIssueDescriptionCommand,
    ): Promise<IUpdateAttendanceIssueDescriptionResponse> {
        const commandInstance = new UpdateAttendanceIssueDescriptionCommand(command);
        return await this.commandBus.execute(commandInstance);
    }

    /**
     * 근태 이슈 수정 정보를 설정한다 (관리자용)
     */
    async 근태이슈수정정보를설정한다(
        command: IUpdateAttendanceIssueCorrectionCommand,
    ): Promise<IUpdateAttendanceIssueCorrectionResponse> {
        const commandInstance = new UpdateAttendanceIssueCorrectionCommand(command);
        return await this.commandBus.execute(commandInstance);
    }

    /**
     * 근태 이슈를 반영한다 (관리자용)
     */
    async 근태이슈를반영한다(command: IApplyAttendanceIssueCommand): Promise<IApplyAttendanceIssueResponse> {
        const commandInstance = new ApplyAttendanceIssueCommand(command);
        return await this.commandBus.execute(commandInstance);
    }

    /**
     * 근태 이슈를 미반영 처리한다 (관리자용)
     */
    async 근태이슈를미반영처리한다(command: IRejectAttendanceIssueCommand): Promise<IRejectAttendanceIssueResponse> {
        const commandInstance = new RejectAttendanceIssueCommand(command);
        return await this.commandBus.execute(commandInstance);
    }

    /**
     * 근태 이슈를 재요청한다 (직원용)
     */
    async 근태이슈를재요청한다(
        command: IReRequestAttendanceIssueCommand,
    ): Promise<IReRequestAttendanceIssueResponse> {
        const commandInstance = new ReRequestAttendanceIssueCommand(command);
        return await this.commandBus.execute(commandInstance);
    }

    /**
     * 근태 이슈를 요청한다 (직원용) - PENDING → REQUEST, 복수 ID
     */
    async 근태이슈를요청한다(
        command: IRequestAttendanceIssueCommand,
    ): Promise<IRequestAttendanceIssueResponse> {
        const commandInstance = new RequestAttendanceIssueCommand(command);
        return await this.commandBus.execute(commandInstance);
    }

    /**
     * 근태 이슈들을 재요청한다 (직원용) - 복수 ID
     */
    async 근태이슈들을재요청한다(
        command: IReRequestAttendanceIssuesCommand,
    ): Promise<IReRequestAttendanceIssuesResponse> {
        const commandInstance = new ReRequestAttendanceIssuesCommand(command);
        return await this.commandBus.execute(commandInstance);
    }
}
