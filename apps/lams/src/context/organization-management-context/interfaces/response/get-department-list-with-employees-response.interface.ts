/**
 * 부서 소속 직원 정보 (시점 기준)
 */
export interface IEmployeeInDepartment {
    employeeId: string;
    name: string;
    employeeNumber: string;
}

/**
 * 부서 정보 + 소속 직원 목록 (1차원 배열용)
 */
export interface IDepartmentInfoWithEmployees {
    id: string;
    departmentCode: string;
    departmentName: string;
    parentDepartmentId: string | null;
    type: string;
    order: number;
    employeeCount: number;
    employees: IEmployeeInDepartment[];
}

/**
 * 부서 노드 + 소속 직원 목록 (계층구조용)
 */
export interface IDepartmentNodeWithEmployees {
    id: string;
    departmentCode: string;
    departmentName: string;
    parentDepartmentId: string | null;
    type: string;
    order: number;
    employeeCount: number;
    employees: IEmployeeInDepartment[];
    children: IDepartmentNodeWithEmployees[];
}

/**
 * 부서 목록 + 부서별 직원 조회 응답 인터페이스
 */
export interface IGetDepartmentListWithEmployeesResponse {
    hierarchy: IDepartmentNodeWithEmployees[];
    flatList: IDepartmentInfoWithEmployees[];
    totalDepartments: number;
    totalEmployees: number;
}
