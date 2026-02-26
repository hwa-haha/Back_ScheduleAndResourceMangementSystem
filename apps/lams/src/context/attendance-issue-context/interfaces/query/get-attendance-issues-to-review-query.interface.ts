/**
 * 확인할 근태 이슈 목록 조회 Query 인터페이스
 * (로그인 유저 본인, status=request 고정, 선택적으로 날짜 범위)
 */
export interface IGetAttendanceIssuesToReviewQuery {
    /** 직원(유저) ID */
    employeeId: string;
    /** 날짜 범위 시작 (YYYY-MM-DD) */
    startDate?: string;
    /** 날짜 범위 종료 (YYYY-MM-DD) */
    endDate?: string;
}
