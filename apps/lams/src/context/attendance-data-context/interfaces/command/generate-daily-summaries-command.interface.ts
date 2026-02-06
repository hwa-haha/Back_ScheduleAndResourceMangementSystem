/**
 * 일일 요약 생성 커맨드 인터페이스
 *
 * flow.md의 두 가지 흐름을 지원:
 * 1. 파일내용반영 흐름: event-info와 used-attendance를 기반으로 생성 (snapshotData 없음)
 * 2. 스냅샷 적용 흐름: 스냅샷 데이터를 기반으로 생성 (snapshotData 제공)
 */
export interface IGenerateDailySummariesCommand {
    year: string;
    month: string;
    performedBy: string;
    /**
     * 특정 직원 ID 목록 (선택적)
     * 제공되면 해당 직원들만 생성, 없으면 전체 직원 생성
     */
    employeeIds?: string[];
    /**
     * 스냅샷 데이터 (선택적)
     * 제공되면 스냅샷 기반으로 생성, 없으면 event-info와 used-attendance 기반으로 생성
     */
    snapshotData?: {
        dailyEventSummaries: Array<{
            date: string;
            employee_id: string;
            is_holiday: boolean;
            enter: string | null;
            leave: string | null;
            real_enter: string | null;
            real_leave: string | null;
            is_checked: boolean;
            is_late: boolean;
            is_early_leave: boolean;
            is_absent: boolean;
            work_time: number | null;
            note: string | null;
        }>;
    };
}
