import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { ApprovalStatus } from '../../../domain/data-snapshot-info/data-snapshot-info.types';

/**
 * 결재 관련 스냅샷 업데이트 요청 DTO
 *
 * approval_document_id, submitted_at, approver_name. 결재 상태(approval_status)는 API 호출 시 항상 "제출됨"으로 저장됩니다.
 */
export class UpdateSnapshotApprovalRequestDto {
    @ApiPropertyOptional({ description: '결재 문서 ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsOptional()
    @IsString()
    approvalDocumentId?: string | null;

    @ApiPropertyOptional({ description: '제출 시간 (ISO 8601)', example: '2026-02-02T09:00:00.000Z' })
    @IsOptional()
    submittedAt?: Date | null;

    @ApiPropertyOptional({ description: '결재자 이름', example: '홍길동' })
    @IsOptional()
    @IsString()
    approverName?: string | null;
}

/**
 * 결재 관련 스냅샷 업데이트 응답 DTO (스냅샷 메타만 노출)
 */
export class UpdateSnapshotApprovalResponseDto {
    @ApiProperty({ description: '스냅샷 ID' })
    id: string;

    @ApiProperty({ description: '스냅샷명' })
    snapshotName: string;

    @ApiProperty({ description: '연도' })
    yyyy: string;

    @ApiProperty({ description: '월' })
    mm: string;

    @ApiPropertyOptional({ description: '결재 문서 ID' })
    approvalDocumentId?: string;

    @ApiPropertyOptional({ description: '제출 시간' })
    submittedAt?: Date;

    @ApiPropertyOptional({ description: '결재자 이름' })
    approverName?: string;

    @ApiPropertyOptional({ description: '결재 상태', enum: ApprovalStatus })
    approvalStatus?: ApprovalStatus;
}
