import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AttendanceUsageDto } from './get-department-monthly-employee-attendance.dto';

/**
 * 부서별 월별 직원별 근무시간 조회 요청 DTO
 */
export class GetDepartmentMonthlyEmployeeWorkHoursRequestDto {
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

    @ApiProperty({
        description: '월 (01-12)',
        example: '01',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    month: string;
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

    @ApiProperty({ description: '주별 지각 횟수', example: 0 })
    lateCount: number;

    @ApiProperty({ description: '주별 조퇴 횟수', example: 0 })
    earlyLeaveCount: number;

    @ApiProperty({ description: '주별 결근 횟수', example: 0 })
    absentCount: number;

    @ApiProperty({
        description: '주차별 근태 사용 내역 (출장·연차·결근·지각·조퇴)',
        type: AttendanceUsageDto,
    })
    attendanceUsage: AttendanceUsageDto;
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
 * 부서별 월별 직원별 근무시간 조회 응답 DTO
 */
export class GetDepartmentMonthlyEmployeeWorkHoursResponseDto {
    @ApiProperty({ description: '부서 ID' })
    departmentId: string;

    @ApiProperty({ description: '연도' })
    year: string;

    @ApiProperty({ description: '월 (01-12)' })
    month: string;

    @ApiProperty({
        description: '해당 월 직원별 근무시간 목록 (총 근무시간 내림차순). 지각·조퇴·주차별 근무시간 포함',
        type: [EmployeeWorkHoursDto],
    })
    employeeWorkHours: EmployeeWorkHoursDto[];
}
