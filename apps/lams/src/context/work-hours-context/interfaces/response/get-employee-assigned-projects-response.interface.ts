import { IAssignedProjectSummary } from './get-employee-with-assigned-projects-response.interface';

/**
 * 직원별 할당 프로젝트 목록 조회 응답 인터페이스
 */
export interface IGetEmployeeAssignedProjectsResponse {
    assignedProjects: IAssignedProjectSummary[];
}
