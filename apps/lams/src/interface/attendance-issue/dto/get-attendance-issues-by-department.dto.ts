import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { AttendanceIssueResponseDto } from './attendance-issue.dto';
import { Transform } from 'class-transformer';

/**
 * 직원별 근태 이슈 그룹 DTO
 */
export class EmployeeIssueGroupDto {
    @ApiProperty({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    employeeId: string;

    @ApiProperty({ description: '직원명', example: '홍길동' })
    employeeName: string;

    @ApiProperty({ description: '직원번호', example: '12345' })
    employeeNumber: string;

    @ApiProperty({
        description: '해당 직원의 근태 이슈 목록',
        type: [AttendanceIssueResponseDto],
    })
    issues: AttendanceIssueResponseDto[];
}

/**
 * 연월/부서별 근태 이슈 조회 요청 DTO
 */
export class GetAttendanceIssuesByDepartmentRequestDto {
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

    @ApiProperty({
        description: '부서 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true,
    })
    @IsUUID()
    @IsNotEmpty()
    departmentId: string;
}

/**
 * 연월/부서별 근태 이슈 조회 응답 DTO
 */
export class GetAttendanceIssuesByDepartmentResponseDto {
    @ApiProperty({
        description: '직원별 근태 이슈 그룹 목록',
        type: [EmployeeIssueGroupDto],
    })
    employeeIssueGroups: EmployeeIssueGroupDto[];

    @ApiProperty({ description: '전체 이슈 수', example: 10 })
    totalIssues: number;

    @ApiProperty({ description: '직원 수', example: 5 })
    totalEmployees: number;
}
