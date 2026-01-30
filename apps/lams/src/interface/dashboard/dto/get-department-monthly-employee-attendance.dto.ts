import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 부서별 월별 직원별 근무내역 조회 요청 DTO
 */
export class GetDepartmentMonthlyEmployeeAttendanceRequestDto {
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
 * 근태 사용 내역 정보
 */
export class AttendanceUsageDto {
    @ApiProperty({ description: '출장 일수', example: 2 })
    businessTrip: number;

    @ApiProperty({ description: '연차 일수', example: 5 })
    annualLeave: number;

    @ApiProperty({ description: '결근 일수', example: 0 })
    absence: number;

    @ApiProperty({ description: '지각 횟수', example: 3 })
    late: number;
}

/**
 * 직원별 근무내역 정보
 */
export class EmployeeAttendanceDto {
    @ApiProperty({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    employeeId: string;

    @ApiProperty({ description: '직원 이름', example: '홍길동' })
    employeeName: string;

    @ApiProperty({ description: '직원 번호', example: 'E001' })
    employeeNumber: string;

    @ApiProperty({ description: '근태 사용 내역', type: AttendanceUsageDto })
    attendanceUsage: AttendanceUsageDto;
}

/**
 * 부서별 월별 직원별 근무내역 조회 응답 DTO
 */
export class GetDepartmentMonthlyEmployeeAttendanceResponseDto {
    @ApiProperty({ description: '부서 ID' })
    departmentId: string;

    @ApiProperty({ description: '연도' })
    year: string;

    @ApiProperty({ description: '월' })
    month: string;

    @ApiProperty({
        description: '직원별 근무내역 목록',
        type: [EmployeeAttendanceDto],
    })
    employeeAttendances: EmployeeAttendanceDto[];
}
