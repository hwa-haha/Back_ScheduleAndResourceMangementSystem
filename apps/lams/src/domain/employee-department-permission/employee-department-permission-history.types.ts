/**
 * 직원-부서 권한 변경 이력 관련 타입 정의
 */

/**
 * 권한 변경 액션
 */
export type EmployeeDepartmentPermissionHistoryAction = 'CREATE' | 'UPDATE' | 'DELETE';

/**
 * 직원-부서 권한 변경 이력 DTO
 */
export interface EmployeeDepartmentPermissionHistoryDTO {
    id: string;
    employeeId: string;
    departmentId: string;
    action: EmployeeDepartmentPermissionHistoryAction;
    hasAccessPermission: boolean;
    hasReviewPermission: boolean;
    previousHasAccessPermission: boolean | null;
    previousHasReviewPermission: boolean | null;
    changedAt: Date;
    changedBy: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
