/**
 * 직원 프로젝트 할당 일괄 갱신 Command 인터페이스
 *
 * 해당 직원의 기존 할당을 전부 비활성화(is_active=false)한 뒤,
 * 요청한 프로젝트만 활성화(기존 행 있으면 갱신, 없으면 생성)한다.
 */
export interface IReplaceProjectAssignmentsCommand {
    employeeId: string;
    /** 프로젝트 목록 (projectId, startDate?, endDate?) */
    projects: Array<{
        projectId: string;
        startDate?: string;
        endDate?: string;
    }>;
    performedBy: string;
}
