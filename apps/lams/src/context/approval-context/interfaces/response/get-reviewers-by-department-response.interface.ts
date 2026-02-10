/**
 * 부서별 검토 권한자 정보
 */
export interface IReviewerInfo {
    employeeId: string;
    employeeName: string;
    employeeNumber: string;
    departmentId?: string;
    departmentName?: string;
    positionId?: string;
    positionTitle?: string;
}

/**
 * 부서별 권한자 항목
 */
export interface IDepartmentReviewers {
    departmentId: string;
    departmentName: string;
    reviewers: IReviewerInfo[];
}

/**
 * 결재 관련 부서별 권한자 조회 응답 인터페이스
 */
export interface IGetReviewersByDepartmentResponse {
    departments: IDepartmentReviewers[];
}
