import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 부서별 월별 일평균 근무시간 조회 요청 DTO
 */
export class GetDepartmentMonthlyAverageWorkHoursRequestDto {
    @ApiProperty({
        description: '부서 ID',
        example: 'd2860a56-99e0-4e79-b70e-0461eef212ac',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    departmentId: string;

    @ApiProperty({
        description: '연도',
        example: '2026',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    year: string;
}

/**
 * 월별 평균 근무시간 정보 (1~12월 연간 조회용)
 */
export class MonthlyAverageWorkHoursDto {
    @ApiProperty({ description: '월 (01-12)', example: '01' })
    month: string;

    @ApiProperty({ description: '일평균 근무시간 (시간)', example: 8.5 })
    averageWorkHours: number;
}

/**
 * 부서별 월별 일평균 근무시간 조회 응답 DTO
 */
export class GetDepartmentMonthlyAverageWorkHoursResponseDto {
    @ApiProperty({ description: '부서 ID' })
    departmentId: string;

    @ApiProperty({ description: '연도' })
    year: string;

    @ApiProperty({
        description: '월별 평균 근무시간 목록 (1월부터 12월까지)',
        type: [MonthlyAverageWorkHoursDto],
    })
    monthlyAverages: MonthlyAverageWorkHoursDto[];
}
