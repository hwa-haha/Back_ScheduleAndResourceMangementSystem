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
 * 주차별 근무시간 정보
 */
export class WeeklyWorkHoursDto {
    @ApiProperty({ description: '주차 번호', example: 45 })
    weekNumber: number;

    @ApiProperty({ description: '시작 날짜', example: '2025-11-03' })
    startDate: string;

    @ApiProperty({ description: '종료 날짜', example: '2025-11-09' })
    endDate: string;

    @ApiProperty({ description: '주간 근무시간 (시간)', example: 43.5 })
    weeklyWorkHours: number;
}

/**
 * 직원별 근무시간 정보
 */
export class EmployeeWorkHoursDto {
    @ApiProperty({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    employeeId: string;

    @ApiProperty({ description: '직원 이름', example: '홍길동' })
    employeeName: string;

    @ApiProperty({ description: '직원 번호', example: 'E001' })
    employeeNumber: string;

    @ApiProperty({ description: '총 근무시간 (시간)', example: 176.5 })
    totalWorkHours: number;

    @ApiProperty({ description: '지각 횟수', example: 2 })
    lateCount: number;

    @ApiProperty({ description: '조퇴 횟수', example: 1 })
    earlyLeaveCount: number;

    @ApiProperty({
        description: '주차별 근무시간 목록',
        type: [WeeklyWorkHoursDto],
    })
    weeklyWorkHours: WeeklyWorkHoursDto[];
}

/**
 * 월별 평균 근무시간 정보
 */
export class MonthlyAverageWorkHoursDto {
    @ApiProperty({ description: '월 (01-12)', example: '01' })
    month: string;

    @ApiProperty({ description: '일평균 근무시간 (시간)', example: 8.5 })
    averageWorkHours: number;

    @ApiProperty({
        description: '해당 월에 배치되어 있던 직원들의 근무시간 목록 (내림차순)',
        type: [EmployeeWorkHoursDto],
    })
    employeeWorkHours: EmployeeWorkHoursDto[];
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
