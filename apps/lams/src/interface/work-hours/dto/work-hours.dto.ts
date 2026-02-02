import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsDateString } from 'class-validator';

/**
 * 시수 입력 요청 DTO
 */
export class CreateWorkHoursRequestDto {
    @ApiProperty({ description: '할당된 프로젝트 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    assignedProjectId: string;

    @ApiProperty({ description: '날짜', example: '2024-01-15' })
    @IsDateString()
    date: string;

    @ApiPropertyOptional({ description: '근무 시작 시간', example: '09:00' })
    @IsString()
    @IsOptional()
    startTime?: string;

    @ApiPropertyOptional({ description: '근무 종료 시간', example: '18:00' })
    @IsString()
    @IsOptional()
    endTime?: string;
}

/**
 * 시수 수정 요청 DTO
 */
export class UpdateWorkHoursRequestDto {
    @ApiPropertyOptional({ description: '근무 시작 시간', example: '09:00' })
    @IsString()
    @IsOptional()
    startTime?: string;

    @ApiPropertyOptional({ description: '근무 종료 시간', example: '18:00' })
    @IsString()
    @IsOptional()
    endTime?: string;
}

/**
 * 시수 입력 응답 DTO
 */
export class CreateWorkHoursResponseDto {
    @ApiProperty({ description: '시수 ID' })
    id: string;

    @ApiProperty({ description: '할당된 프로젝트 ID' })
    assignedProjectId: string;

    @ApiProperty({ description: '날짜' })
    date: string;

    @ApiPropertyOptional({ description: '근무 시작 시간' })
    startTime?: string | null;

    @ApiPropertyOptional({ description: '근무 종료 시간' })
    endTime?: string | null;

    @ApiProperty({ description: '근무 시간 (분 단위)' })
    workMinutes: number;

    @ApiPropertyOptional({ description: '비고' })
    note?: string | null;
}
