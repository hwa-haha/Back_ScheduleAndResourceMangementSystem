/**
 * 데이터 스냅샷 정보 관련 타입 정의
 */

/**
 * 스냅샷 타입
 */
export enum SnapshotType {
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
    ANNUAL = 'ANNUAL_LEAVE',
}

/**
 * 결재 상태
 */
export enum ApprovalStatus {
    NOT_SUBMITTED = '미제출',
    SUBMITTED = '제출됨',
}

/**
 * 데이터 스냅샷 정보 생성 데이터
 */
export interface CreateDataSnapshotInfoData {
    snapshotName: string;
    description?: string;
    snapshotType: SnapshotType;
    yyyy: string;
    mm: string;
    departmentId: string;
    snapshotVersion?: string; // A-Z
    approvalDocumentId?: string; // UUID
    submittedAt?: Date;
    approverName?: string;
    approvalStatus?: ApprovalStatus;
    isCurrent?: boolean;
}

/**
 * 데이터 스냅샷 정보 업데이트 데이터
 */
export interface UpdateDataSnapshotInfoData {
    snapshotName?: string;
    description?: string;
    snapshotVersion?: string; // A-Z
    approvalDocumentId?: string; // UUID
    submittedAt?: Date;
    approverName?: string;
    approvalStatus?: ApprovalStatus;
    isCurrent?: boolean;
}

import { DataSnapshotChildDTO } from '../data-snapshot-child/data-snapshot-child.types';

/**
 * 데이터 스냅샷 정보 DTO
 */
export interface DataSnapshotInfoDTO {
    id: string;
    snapshotName: string;
    description: string;
    snapshotType: SnapshotType;
    yyyy: string;
    mm: string;
    departmentId: string;
    snapshotVersion?: string; // A-Z
    approvalDocumentId?: string; // UUID
    submittedAt?: Date;
    approverName?: string;
    approvalStatus?: ApprovalStatus;
    isCurrent: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
    children?: DataSnapshotChildDTO[];
}
