import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 월별 시수 현황 조회 요청 DTO (토큰 사용 시 로그인 사용자 본인 시수 조회)
 */
export class GetMonthlyWorkHoursRequestDto {
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
    @ApiPropertyOptional({ description: '시수 ID (일별 조회 시 포함)' })
    id?: string;

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

/**
 * 일별 시수 상세 조회 요청 DTO
 */
export class GetDailyWorkHoursRequestDto {
    @ApiProperty({ description: '조회할 날짜 (yyyy-MM-dd)', example: '2026-01-15' })
    @IsString()
    date: string;
}

/**
 * 일별 시수 상세 조회 응답 DTO
 */
export class GetDailyWorkHoursResponseDto {
    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '조회 날짜 (yyyy-MM-dd)' })
    date: string;

    @ApiProperty({ description: '해당 날짜 시수 상세 목록', type: [MonthlyWorkHoursItemDto] })
    workHours: MonthlyWorkHoursItemDto[];

    @ApiProperty({ description: '해당 날짜 총 근무 시간 (분 단위)' })
    totalWorkMinutes: number;
}
