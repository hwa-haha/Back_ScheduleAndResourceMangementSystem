import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetEmployeeAssignedProjectsQuery } from './get-employee-assigned-projects.query';
import { IGetEmployeeAssignedProjectsResponse } from '../../../interfaces/response/get-employee-assigned-projects-response.interface';
import { IAssignedProjectSummary } from '../../../interfaces/response/get-employee-with-assigned-projects-response.interface';
import { DomainAssignedProjectService } from '../../../../../domain/assigned-project/assigned-project.service';

/**
 * 직원별 할당 프로젝트 목록 조회 Query Handler
 *
 * 직원 ID를 받아 해당 직원의 활성 할당 프로젝트 목록을 반환한다.
 */
@QueryHandler(GetEmployeeAssignedProjectsQuery)
export class GetEmployeeAssignedProjectsHandler implements IQueryHandler<
    GetEmployeeAssignedProjectsQuery,
    IGetEmployeeAssignedProjectsResponse
> {
    private readonly logger = new Logger(GetEmployeeAssignedProjectsHandler.name);

    constructor(private readonly assignedProjectService: DomainAssignedProjectService) {}

    async execute(query: GetEmployeeAssignedProjectsQuery): Promise<IGetEmployeeAssignedProjectsResponse> {
        const { employeeId } = query.data;
        this.logger.log(`직원별 할당 프로젝트 목록 조회: employeeId=${employeeId}`);

        const allAssignments = await this.assignedProjectService.활성할당전체조회한다();
        const forEmployee = allAssignments.filter((a) => a.employeeId === employeeId);
        const assignedProjects: IAssignedProjectSummary[] = forEmployee.map((a) => ({
            id: a.id,
            projectId: a.projectId,
            projectName: a.projectName,
            projectCode: a.projectCode,
        }));

        return { assignedProjects };
    }
}
