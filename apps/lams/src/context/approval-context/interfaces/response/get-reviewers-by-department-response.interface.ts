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
    /** 부서별 검토 권한자 목록 (퇴사자 포함 전체) */
    departments: IDepartmentReviewers[];
    /** 퇴사 상태·퇴사자 부서 소속 권한자 목록 (퇴사 여부 정보 전달용, departments와 중복 가능) */
    excludedReviewers: IReviewerInfo[];
}
