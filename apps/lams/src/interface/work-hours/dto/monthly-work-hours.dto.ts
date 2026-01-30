import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 월별 시수 현황 조회 요청 DTO
 */
export class GetMonthlyWorkHoursRequestDto {
    @ApiProperty({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    employeeId: string;

    @ApiProperty({ description: '연도', example: '2026' })
    @IsString()
    year: string;

    @ApiProperty({ description: '월', example: '01' })
    @Transform(({ value }) => (typeof value === 'string' && value.length === 1 ? value.padStart(2, '0') : value))
    @IsString()
    month: string;
}

/**
 * 월별 시수 현황 항목 DTO
 */
export class MonthlyWorkHoursItemDto {
    @ApiProperty({ description: '프로젝트 ID' })
    projectId: string;

    @ApiProperty({ description: '프로젝트명' })
    projectName: string;

    @ApiProperty({ description: '프로젝트 코드' })
    projectCode: string;

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

/**
 * 월별 시수 현황 조회 응답 DTO
 */
export class GetMonthlyWorkHoursResponseDto {
    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '연도' })
    year: string;

    @ApiProperty({ description: '월' })
    month: string;

    @ApiProperty({ description: '월별 시수 현황 목록', type: [MonthlyWorkHoursItemDto] })
    workHours: MonthlyWorkHoursItemDto[];

    @ApiProperty({ description: '총 근무 시간 (분 단위)' })
    totalWorkMinutes: number;
}
