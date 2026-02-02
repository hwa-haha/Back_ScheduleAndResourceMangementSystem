/**
 * 직원별 할당 프로젝트 요약
 */
export interface IAssignedProjectSummary {
    id: string;
    projectId: string;
    projectName: string;
    projectCode: string;
}

/**
 * 부서 요약
 */
export interface IDepartmentSummary {
    id: string;
    departmentName: string;
    departmentCode: string;
}

/**
 * 직원 + 할당 프로젝트 목록 항목
 */
export interface IEmployeeWithAssignedProjects {
    id: string;
    employeeNumber: string;
    employeeName: string;
    /** 이메일 */
    email?: string | null;
    /** 소속 부서 목록 */
    departments: IDepartmentSummary[];
    assignedProjects: IAssignedProjectSummary[];
}

/**
 * 직원 목록 및 할당 프로젝트 조회 응답 인터페이스
 */
export interface IGetEmployeeWithAssignedProjectsResponse {
    employees: IEmployeeWithAssignedProjects[];
    totalCount: number;
}
