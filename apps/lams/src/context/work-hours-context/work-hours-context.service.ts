import { Injectable } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import {
    IGetMonthlyWorkHoursQuery,
    IGetDailyWorkHoursQuery,
    IGetProjectListQuery,
    IGetEmployeeWithAssignedProjectsQuery,
    IGetEmployeeAssignedProjectsQuery,
    IGetWorkHoursStatisticsQuery,
    IGetWorkHoursStatisticsByProjectQuery,
    IReplaceProjectAssignmentsCommand,
    ICreateWorkHoursCommand,
    IUpdateWorkHoursCommand,
    IDeleteWorkHoursByDateCommand,
    IDeleteWorkHoursByIdCommand,
    IReplaceProjectAssignmentsResponse,
    IGetEmployeeWithAssignedProjectsResponse,
    IGetEmployeeAssignedProjectsResponse,
    IGetWorkHoursStatisticsResponse,
    IGetWorkHoursStatisticsByProjectResponse,
    ICreateWorkHoursResponse,
    IUpdateWorkHoursResponse,
    IGetMonthlyWorkHoursResponse,
    IGetDailyWorkHoursResponse,
    IGetProjectListResponse,
} from './interfaces';
import { IGetEmployeesForWorkHoursStatisticsQuery } from './interfaces/query/get-employees-for-work-hours-statistics-query.interface';
import { GetMonthlyWorkHoursQuery } from './handlers/monthly-work-hours/queries/get-monthly-work-hours.query';
import { GetDailyWorkHoursQuery } from './handlers/daily-work-hours/queries/get-daily-work-hours.query';
import { GetProjectListQuery } from './handlers/project/queries/get-project-list.query';
import { GetEmployeeWithAssignedProjectsQuery } from './handlers/employee-assignments/queries/get-employee-with-assigned-projects.query';
import { GetEmployeeAssignedProjectsQuery } from './handlers/employee-assignments/queries/get-employee-assigned-projects.query';
import { GetEmployeesForWorkHoursStatisticsQuery } from './handlers/statistics/queries/get-employees-for-work-hours-statistics.query';
import { GetWorkHoursStatisticsQuery } from './handlers/statistics/queries/get-work-hours-statistics.query';
import { GetWorkHoursStatisticsByProjectQuery } from './handlers/statistics/queries/get-work-hours-statistics-by-project.query';
import { ReplaceProjectAssignmentsCommand } from './handlers/assigned-project/commands/replace-project-assignments.command';
import { CreateWorkHoursCommand } from './handlers/work-hours/commands/create-work-hours.command';
import { UpdateWorkHoursCommand } from './handlers/work-hours/commands/update-work-hours.command';
import { DeleteWorkHoursByDateCommand } from './handlers/work-hours/commands/delete-work-hours-by-date.command';
import { DeleteWorkHoursByIdCommand } from './handlers/work-hours/commands/delete-work-hours-by-id.command';

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
     * 시수를 수정한다 (ID 기준)
     */
    async 시수수정한다(command: IUpdateWorkHoursCommand): Promise<IUpdateWorkHoursResponse> {
        return await this.commandBus.execute(new UpdateWorkHoursCommand(command));
    }

    /**
     * 날짜별 시수를 삭제한다
     */
    async 날짜별시수삭제한다(command: IDeleteWorkHoursByDateCommand): Promise<void> {
        return await this.commandBus.execute(new DeleteWorkHoursByDateCommand(command));
    }

    /**
     * 시수를 ID로 삭제한다 (완전 삭제)
     */
    async 시수ID로삭제한다(command: IDeleteWorkHoursByIdCommand): Promise<void> {
        return await this.commandBus.execute(new DeleteWorkHoursByIdCommand(command));
    }

    /**
     * 월별 시수 현황을 조회한다
     */
    async 월별시수현황조회한다(query: IGetMonthlyWorkHoursQuery): Promise<IGetMonthlyWorkHoursResponse> {
        return await this.queryBus.execute(new GetMonthlyWorkHoursQuery(query));
    }

    /**
     * 일별 시수를 조회한다 (해당 날짜의 직원 시수 정보 전체)
     */
    async 일별시수조회한다(query: IGetDailyWorkHoursQuery): Promise<IGetDailyWorkHoursResponse> {
        return await this.queryBus.execute(new GetDailyWorkHoursQuery(query));
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

    /**
     * 직원별 할당 프로젝트 목록을 조회한다
     */
    async 직원별할당프로젝트목록을조회한다(
        query: IGetEmployeeAssignedProjectsQuery,
    ): Promise<IGetEmployeeAssignedProjectsResponse> {
        return await this.queryBus.execute(new GetEmployeeAssignedProjectsQuery(query));
    }

    /**
     * 시수 통계를 조회한다 (부서 ID·직원 ID 선택 시 해당 대상, 미지정 시 전체 직원 기준, 직원명·부서명 검색 적용)
     */
    async 시수통계를조회한다(query: IGetWorkHoursStatisticsQuery): Promise<IGetWorkHoursStatisticsResponse> {
        const employeeQuery: IGetEmployeesForWorkHoursStatisticsQuery = {
            year: query.year,
            month: query.month,
            departmentIds: query.departmentIds,
            employeeNameSearch: query.employeeNameSearch,
            departmentNameSearch: query.departmentNameSearch,
            employeeIds: query.employeeIds,
        };
        const resolved = await this.queryBus.execute(new GetEmployeesForWorkHoursStatisticsQuery(employeeQuery));
        return await this.queryBus.execute(
            new GetWorkHoursStatisticsQuery({
                year: query.year,
                month: query.month,
                employeeIds: resolved.employeeIds,
                employeeInfoItems: resolved.items,
            }),
        );
    }

    /**
     * 프로젝트 기준 시수 통계를 조회한다 (project_id 기준 일별·총합)
     */
    async 프로젝트기준시수통계를조회한다(
        query: IGetWorkHoursStatisticsByProjectQuery,
    ): Promise<IGetWorkHoursStatisticsByProjectResponse> {
        return await this.queryBus.execute(new GetWorkHoursStatisticsByProjectQuery(query));
    }
}
