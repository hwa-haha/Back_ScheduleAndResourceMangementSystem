import { AssignedProjectDTO } from '../../../../domain/assigned-project/assigned-project.types';

/**
 * 직원 프로젝트 할당 일괄 갱신 응답 인터페이스
 */
export interface IReplaceProjectAssignmentsResponse {
    assignedProjects: AssignedProjectDTO[];
}
