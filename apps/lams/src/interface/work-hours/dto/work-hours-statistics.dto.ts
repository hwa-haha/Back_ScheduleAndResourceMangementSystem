import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 시수 통계 조회 요청 DTO (Query)
 */
export class GetWorkHoursStatisticsRequestDto {
    @ApiProperty({ description: '연도', example: '2026' })
    @IsString()
    @IsNotEmpty()
    year: string;

    @ApiProperty({ description: '월 (01-12)', example: '02' })
    @IsString()
    @IsNotEmpty()
    month: string;

    @ApiPropertyOptional({
        description:
            '선택된 부서 ID 목록 (쉼표 구분). 미입력 시 전체 부서(전체 직원) 기준. 해당 부서 + 하위 부서 부서원 포함',
        example: 'd2860a56-99e0-4e79-b70e-0461eef212ac,e8a1b2c3-...',
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value == null || value === '') return undefined;
        if (Array.isArray(value)) {
            const arr = value.flatMap((v) =>
                typeof v === 'string'
                    ? v
                          .split(',')
                          .map((s: string) => s.trim())
                          .filter(Boolean)
                    : [],
            );
            return arr.length ? arr : undefined;
        }
        if (typeof value === 'string') {
            const arr = value
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean);
            return arr.length ? arr : undefined;
        }
        return undefined;
    })
    @IsArray()
    @IsUUID('4', { each: true })
    departmentIds?: string[];

    @ApiPropertyOptional({
        description: '직원 ID 필터 (쉼표 구분). 이 목록에 있는 직원만 조회',
    })
    @IsOptional()
    @Transform(({ value }) =>
        value == null || value === ''
            ? undefined
            : typeof value === 'string'
              ? value
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter(Boolean)
              : value,
    )
    @IsArray()
    @IsUUID('4', { each: true })
    employeeIds?: string[];
    @ApiPropertyOptional({ description: '직원명 검색 (부분 일치)' })
    @IsOptional()
    @IsString()
    employeeNameSearch?: string;

    @ApiPropertyOptional({ description: '부서명 검색 (부분 일치)' })
    @IsOptional()
    @IsString()
    departmentNameSearch?: string;
}

/**
 * 일자별 시수 DTO (날짜 + 시수)
 */
export class DailyWorkHoursItemDto {
    @ApiProperty({ description: '날짜 (YYYY-MM-DD)', example: '2026-02-01' })
    date: string;

    @ApiProperty({ description: '해당 일 시수 (시간)', example: 8 })
    workHours: number;
}

/**
 * 시수 통계 항목 DTO
 * dailyWorkHours: 일자별 { date, workHours } 배열 (표 형태: 일자별 컬럼 + 마지막 합계)
 */
export class WorkHoursStatisticsItemDto {
    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '직원명' })
    employeeName: string;

    @ApiProperty({ description: '사번' })
    employeeNumber: string;

    @ApiProperty({ description: '부서명' })
    departmentName: string;

    @ApiProperty({
        description: '해당 월 일자별 시수 (날짜·시수 객체 배열)',
        type: [DailyWorkHoursItemDto],
        example: [
            { date: '2026-02-01', workHours: 8 },
            { date: '2026-02-02', workHours: 8 },
            { date: '2026-02-03', workHours: 0 },
        ],
    })
    dailyWorkHours: DailyWorkHoursItemDto[];

    @ApiProperty({ description: '해당 월 총 시수 (시간)', example: 176.5 })
    totalWorkHours: number;
}

/**
 * 시수 통계 조회 응답 DTO (직원 기준)
 */
export class GetWorkHoursStatisticsResponseDto {
    @ApiProperty({ description: '연도' })
    year: string;

    @ApiProperty({ description: '월 (01-12)' })
    month: string;

    @ApiProperty({ description: '직원별 시수 통계 목록', type: [WorkHoursStatisticsItemDto] })
    items: WorkHoursStatisticsItemDto[];
}

/**
 * 프로젝트 기준 시수 통계 조회 요청 DTO (Query)
 */
export class GetWorkHoursStatisticsByProjectRequestDto {
    @ApiProperty({ description: '연도', example: '2026' })
    @IsString()
    @IsNotEmpty()
    year: string;

    @ApiProperty({ description: '월 (01-12)', example: '02' })
    @IsString()
    @IsNotEmpty()
    month: string;

    @ApiPropertyOptional({
        description: '프로젝트 ID 필터 (쉼표 구분). 이 목록에 있는 프로젝트만 조회',
    })
    @IsOptional()
    @Transform(({ value }) =>
        value == null || value === ''
            ? undefined
            : typeof value === 'string'
              ? value
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter(Boolean)
              : value,
    )
    @IsArray()
    @IsUUID('4', { each: true })
    projectIds?: string[];
}

/**
 * 프로젝트별 시수 통계 항목 DTO
 */
export class WorkHoursStatisticsByProjectItemDto {
    @ApiProperty({ description: '프로젝트 ID' })
    projectId: string;

    @ApiProperty({ description: '프로젝트명' })
    projectName: string;

    @ApiProperty({ description: '프로젝트 코드' })
    projectCode: string;

    @ApiProperty({
        description: '해당 월 일자별 시수 (날짜·시수 객체 배열)',
        type: [DailyWorkHoursItemDto],
    })
    dailyWorkHours: DailyWorkHoursItemDto[];

    @ApiProperty({ description: '해당 월 총 시수 (시간)', example: 320.5 })
    totalWorkHours: number;
}

/**
 * 프로젝트 기준 시수 통계 조회 응답 DTO
 */
export class GetWorkHoursStatisticsByProjectResponseDto {
    @ApiProperty({ description: '연도' })
    year: string;

    @ApiProperty({ description: '월 (01-12)' })
    month: string;

    @ApiProperty({ description: '프로젝트별 시수 통계 목록', type: [WorkHoursStatisticsByProjectItemDto] })
    items: WorkHoursStatisticsByProjectItemDto[];
}
