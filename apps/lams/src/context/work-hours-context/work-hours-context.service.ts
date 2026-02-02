import { Injectable } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import {
    IGetMonthlyWorkHoursQuery,
    IGetProjectListQuery,
    IGetEmployeeWithAssignedProjectsQuery,
    IReplaceProjectAssignmentsCommand,
    ICreateWorkHoursCommand,
    IDeleteWorkHoursByDateCommand,
    IReplaceProjectAssignmentsResponse,
    IGetEmployeeWithAssignedProjectsResponse,
    ICreateWorkHoursResponse,
    IGetMonthlyWorkHoursResponse,
    IGetProjectListResponse,
} from './interfaces';
import { GetMonthlyWorkHoursQuery } from './handlers/monthly-work-hours/queries/get-monthly-work-hours.query';
import { GetProjectListQuery } from './handlers/project/queries/get-project-list.query';
import { GetEmployeeWithAssignedProjectsQuery } from './handlers/employee-assignments/queries/get-employee-with-assigned-projects.query';
import { ReplaceProjectAssignmentsCommand } from './handlers/assigned-project/commands/replace-project-assignments.command';
import { CreateWorkHoursCommand } from './handlers/work-hours/commands/create-work-hours.command';
import { DeleteWorkHoursByDateCommand } from './handlers/work-hours/commands/delete-work-hours-by-date.command';

/**
 * 시수 관리 Context 서비스
 *
 * 시수 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class WorkHoursContextService {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * 직원의 프로젝트 할당을 일괄 갱신한다
     * 기존 할당은 소프트 삭제하고, 요청한 프로젝트 목록으로 새로 생성한다 (시수 이력 보존)
     */
    async 직원프로젝트할당일괄갱신한다(
        command: IReplaceProjectAssignmentsCommand,
    ): Promise<IReplaceProjectAssignmentsResponse> {
        return await this.commandBus.execute(new ReplaceProjectAssignmentsCommand(command));
    }

    /**
     * 시수를 입력한다
     */
    async 시수입력한다(command: ICreateWorkHoursCommand): Promise<ICreateWorkHoursResponse> {
        return await this.commandBus.execute(new CreateWorkHoursCommand(command));
    }

    /**
     * 날짜별 시수를 삭제한다
     */
    async 날짜별시수삭제한다(command: IDeleteWorkHoursByDateCommand): Promise<void> {
        return await this.commandBus.execute(new DeleteWorkHoursByDateCommand(command));
    }

    /**
     * 월별 시수 현황을 조회한다
     */
    async 월별시수현황조회한다(query: IGetMonthlyWorkHoursQuery): Promise<IGetMonthlyWorkHoursResponse> {
        return await this.queryBus.execute(new GetMonthlyWorkHoursQuery(query));
    }

    /**
     * 프로젝트 목록을 조회한다
     */
    async 프로젝트목록조회한다(query: IGetProjectListQuery): Promise<IGetProjectListResponse> {
        return await this.queryBus.execute(new GetProjectListQuery(query));
    }

    /**
     * 직원 목록과 각 직원에게 할당된 프로젝트를 조회한다
     */
    async 직원목록및할당프로젝트조회한다(
        query: IGetEmployeeWithAssignedProjectsQuery,
    ): Promise<IGetEmployeeWithAssignedProjectsResponse> {
        return await this.queryBus.execute(new GetEmployeeWithAssignedProjectsQuery(query));
    }
}
