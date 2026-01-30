import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

/**
 * 특별근태시간 생성 요청 DTO
 */
export class CreateWorkTimeOverrideRequestDto {
    @ApiProperty({ description: '적용 날짜', example: '2024-01-01' })
    @IsString()
    @IsNotEmpty()
    date: string;

    @ApiPropertyOptional({ description: '시작 시간', example: '09:00:00' })
    @IsString()
    @IsOptional()
    startWorkTime?: string;

    @ApiPropertyOptional({ description: '종료 시간', example: '18:00:00' })
    @IsString()
    @IsOptional()
    endWorkTime?: string;

    @ApiPropertyOptional({ description: '변경 사유', example: '눈으로 인한 출근시간 조정' })
    @IsString()
    @IsOptional()
    reason?: string;
}

/**
 * 특별근태시간 응답 DTO
 */
export class WorkTimeOverrideResponseDto {
    @ApiProperty({ description: '특별근태시간 ID' })
    id: string;

    @ApiProperty({ description: '적용 날짜' })
    date: string;

    @ApiPropertyOptional({ description: '시작 시간' })
    startWorkTime?: string | null;

    @ApiPropertyOptional({ description: '종료 시간' })
    endWorkTime?: string | null;

    @ApiPropertyOptional({ description: '변경 사유' })
    reason?: string | null;

    @ApiProperty({ description: '생성 일시' })
    createdAt: Date;

    @ApiProperty({ description: '수정 일시' })
    updatedAt: Date;

    @ApiPropertyOptional({ description: '삭제 일시' })
    deletedAt?: Date;

    @ApiPropertyOptional({ description: '생성자 ID' })
    createdBy?: string;

    @ApiPropertyOptional({ description: '수정자 ID' })
    updatedBy?: string;

    @ApiProperty({ description: '버전' })
    version: number;
}

/**
 * 특별근태시간 생성 응답 DTO
 */
export class CreateWorkTimeOverrideResponseDto {
    @ApiProperty({ description: '특별근태시간 정보', type: WorkTimeOverrideResponseDto })
    workTimeOverride: WorkTimeOverrideResponseDto;
}

/**
 * 특별근태시간 수정 요청 DTO
 */
export class UpdateWorkTimeOverrideRequestDto {
    @ApiProperty({ description: '특별근태시간 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    @IsNotEmpty()
    id: string;

    @ApiPropertyOptional({ description: '적용 날짜', example: '2024-01-01' })
    @IsString()
    @IsOptional()
    date?: string;

    @ApiPropertyOptional({ description: '시작 시간', example: '09:00:00' })
    @IsString()
    @IsOptional()
    startWorkTime?: string;

    @ApiPropertyOptional({ description: '종료 시간', example: '18:00:00' })
    @IsString()
    @IsOptional()
    endWorkTime?: string;

    @ApiPropertyOptional({ description: '변경 사유', example: '눈으로 인한 출근시간 조정' })
    @IsString()
    @IsOptional()
    reason?: string;
}

/**
 * 특별근태시간 수정 응답 DTO
 */
export class UpdateWorkTimeOverrideResponseDto {
    @ApiProperty({ description: '특별근태시간 정보', type: WorkTimeOverrideResponseDto })
    workTimeOverride: WorkTimeOverrideResponseDto;
}

/**
 * 특별근태시간 삭제 요청 DTO
 */
export class DeleteWorkTimeOverrideRequestDto {
    @ApiProperty({ description: '특별근태시간 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    @IsNotEmpty()
    id: string;
}

/**
 * 특별근태시간 삭제 응답 DTO
 */
export class DeleteWorkTimeOverrideResponseDto {
    @ApiProperty({ description: '삭제 성공 여부' })
    success: boolean;
}

/**
 * 특별근태시간 목록 조회 요청 DTO
 */
export class GetWorkTimeOverrideListRequestDto {
    @ApiPropertyOptional({ description: '연도 필터', example: '2026' })
    @IsString()
    @IsOptional()
    year?: string;
}

/**
 * 특별근태시간 목록 조회 응답 DTO
 */
export class GetWorkTimeOverrideListResponseDto {
    @ApiProperty({ description: '특별근태시간 목록', type: [WorkTimeOverrideResponseDto] })
    workTimeOverrides: WorkTimeOverrideResponseDto[];

    @ApiProperty({ description: '전체 특별근태시간 수' })
    totalCount: number;
}
