import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 일간 요약/변경 이력에 노출하는 간단한 직원 정보 DTO
 */
export class EmployeeSummaryForHistoryDto {
    @ApiProperty({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    employeeId: string;

    @ApiProperty({ description: '직원 이름', example: '홍길동' })
    name: string;
}

/**
 * 일간 요약 수정이력 항목 DTO
 */
export class DailySummaryHistoryItemDto {
    @ApiProperty({ description: '수정이력 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ description: '일간 요약 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    dailyEventSummaryId: string;

    @ApiProperty({ description: '날짜', example: '2024-01-15' })
    date: string;

    @ApiProperty({ description: '변경 내용', example: '{"enter": "09:00:00", "leave": "18:00:00"}' })
    content: string;

    @ApiProperty({ description: '변경자 ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
    changedBy: string;

    @ApiProperty({ description: '변경 시간' })
    changedAt: Date;

    @ApiPropertyOptional({ description: '변경 사유', example: '출장으로 인한 시간 조정' })
    reason: string | null;

    @ApiPropertyOptional({ description: '스냅샷 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    snapshotId: string | null;

    @ApiProperty({ description: '생성 시간' })
    createdAt: Date;

    @ApiProperty({ description: '수정 시간' })
    updatedAt: Date;

    @ApiPropertyOptional({
        description: '일간 요약 대상 직원 (employeeId, name)',
        type: EmployeeSummaryForHistoryDto,
        nullable: true,
    })
    employeeInfo: EmployeeSummaryForHistoryDto | null;

    @ApiPropertyOptional({
        description: '변경한 사람 (employeeId, name)',
        type: EmployeeSummaryForHistoryDto,
        nullable: true,
    })
    changerInfo: EmployeeSummaryForHistoryDto | null;
}

/**
 * 일간 요약 수정이력 조회 응답 DTO
 */
export class GetDailySummaryHistoryResponseDto {
    @ApiProperty({ description: '일간 요약 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    dailyEventSummaryId: string;

    @ApiProperty({ description: '수정이력 목록', type: [DailySummaryHistoryItemDto] })
    histories: DailySummaryHistoryItemDto[];

    @ApiProperty({ description: '총 개수', example: 5 })
    total: number;
}
