/**
 * 직원 추가 정보 관련 타입 정의
 */

/**
 * 직원 추가 정보 생성 데이터
 */
export interface CreateEmployeeExtraInfoData {
    employeeId: string;
    isExcludedFromSummary: boolean;
    subscriptions?: any[] | null;
    isPushNotificationEnabled?: boolean | null;
    roles?: string[] | null;
    accessToken?: string | null;
    expiredAt?: string | null;
    isHiddenInFilter?: boolean | null;
}

/**
 * 직원 추가 정보 업데이트 데이터
 */
export interface UpdateEmployeeExtraInfoData {
    isExcludedFromSummary?: boolean;
    subscriptions?: any[] | null;
    isPushNotificationEnabled?: boolean | null;
    roles?: string[] | null;
    accessToken?: string | null;
    expiredAt?: string | null;
    isHiddenInFilter?: boolean | null;
}

/**
 * 직원 추가 정보 DTO
 */
export interface EmployeeExtraInfoDTO {
    id: string;
    employeeId: string;
    isExcludedFromSummary: boolean;
    subscriptions?: any[] | null;
    isPushNotificationEnabled?: boolean | null;
    roles?: string[] | null;
    accessToken?: string | null;
    expiredAt?: string | null;
    isHiddenInFilter?: boolean | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
}
