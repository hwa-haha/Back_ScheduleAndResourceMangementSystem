import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 부서별 월별 주차별 주간근무시간 상위 5명 조회 요청 DTO
 */
export class GetDepartmentWeeklyTopEmployeesRequestDto {
    @ApiProperty({
        description: '부서 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
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

    @ApiProperty({
        description: '월',
        example: '01',
        required: true,
    })
    @Transform(({ value }) => (typeof value === 'string' && value.length === 1 ? value.padStart(2, '0') : value))
    @IsString()
    @IsNotEmpty()
    month: string;
}

/**
 * 주차별 상위 직원 정보
 */
export class WeeklyTopEmployeeDto {
    @ApiProperty({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    employeeId: string;

    @ApiProperty({ description: '직원 이름', example: '홍길동' })
    employeeName: string;

    @ApiProperty({ description: '직원 번호', example: 'E001' })
    employeeNumber: string;

    @ApiProperty({ description: '주간 근무시간 (시간)', example: 45.5 })
    weeklyWorkHours: number;
}

/**
 * 주차별 상위 5명 정보
 */
export class WeeklyTopEmployeesDto {
    @ApiProperty({ description: '주차 (1-5)', example: 1 })
    week: number;

    @ApiProperty({
        description: '상위 5명 직원 목록',
        type: [WeeklyTopEmployeeDto],
    })
    topEmployees: WeeklyTopEmployeeDto[];
}

/**
 * 부서별 월별 주차별 주간근무시간 상위 5명 조회 응답 DTO
 */
export class GetDepartmentWeeklyTopEmployeesResponseDto {
    @ApiProperty({ description: '부서 ID' })
    departmentId: string;

    @ApiProperty({ description: '연도' })
    year: string;

    @ApiProperty({ description: '월' })
    month: string;

    @ApiProperty({
        description: '주차별 상위 5명 목록',
        type: [WeeklyTopEmployeesDto],
    })
    weeklyTopEmployees: WeeklyTopEmployeesDto[];
}
