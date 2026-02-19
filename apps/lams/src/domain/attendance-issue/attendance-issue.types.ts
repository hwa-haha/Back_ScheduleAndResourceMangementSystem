/**
 * 근태 이슈 관련 타입 정의
 */

/**
 * 근태 이슈 상태
 */
export enum AttendanceIssueStatus {
    PENDING = 'pending', // 대기
    REQUEST = 'request', // 요청 (생성 시 기본 상태)
    APPLIED = 'applied', // 반영
    NOT_APPLIED = 'not_applied', // 미반영
}

/**
 * 근태 이슈 생성 데이터
 */
export interface CreateAttendanceIssueData {
    employeeId: string;
    dailyEventSummaryId?: string;
    date: string;
    problematicEnterTime?: string;
    problematicLeaveTime?: string;
    correctedEnterTime?: string;
    correctedLeaveTime?: string;
    problematicAttendanceTypeIds?: string[]; // 최대 2개
    correctedAttendanceTypeIds?: string[]; // 최대 2개
    description?: string;
}

/**
 * 근태 이슈 업데이트 데이터
 */
export interface UpdateAttendanceIssueData {
    problematicEnterTime?: string;
    problematicLeaveTime?: string;
    correctedEnterTime?: string;
    correctedLeaveTime?: string;
    problematicAttendanceTypeIds?: string[]; // 최대 2개
    correctedAttendanceTypeIds?: string[]; // 최대 2개
    description?: string;
    status?: AttendanceIssueStatus;
    rejectionReason?: string;
}

/**
 * 근태 이슈 DTO
 */
export interface AttendanceIssueDTO {
    id: string;
    employeeId: string;
    dailyEventSummaryId: string | null;
    date: string;
    problematicEnterTime: string | null;
    problematicLeaveTime: string | null;
    correctedEnterTime: string | null;
    correctedLeaveTime: string | null;
    problematicAttendanceTypeIds: string[] | null; // 최대 2개
    correctedAttendanceTypeIds: string[] | null; // 최대 2개
    status: AttendanceIssueStatus;
    description: string | null;
    confirmedBy: string | null;
    confirmedAt: Date | null;
    resolvedAt: Date | null;
    rejectionReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
