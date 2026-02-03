import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 부서 목록 조회 요청 DTO
 */
export class GetDepartmentListRequestDto {
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
 * 부서 노드 응답 DTO (계층구조용)
 */
export class DepartmentNodeResponseDto {
    @ApiProperty({ description: '부서 ID' })
    id: string;

    @ApiProperty({ description: '부서 코드' })
    departmentCode: string;

    @ApiProperty({ description: '부서 이름' })
    departmentName: string;

    @ApiProperty({ description: '상위 부서 ID', nullable: true })
    parentDepartmentId: string | null;

    @ApiProperty({ description: '부서 유형' })
    type: string;

    @ApiProperty({ description: '정렬 순서' })
    order: number;

    @ApiProperty({ description: '직원 수' })
    employeeCount: number;

    @ApiProperty({
        description: '하위 부서 목록',
        type: [DepartmentNodeResponseDto],
    })
    children: DepartmentNodeResponseDto[];
}

/**
 * 부서 정보 응답 DTO (1차원 배열용)
 */
export class DepartmentInfoResponseDto {
    @ApiProperty({ description: '부서 ID' })
    id: string;

    @ApiProperty({ description: '부서 코드' })
    departmentCode: string;

    @ApiProperty({ description: '부서 이름' })
    departmentName: string;

    @ApiProperty({ description: '상위 부서 ID', nullable: true })
    parentDepartmentId: string | null;

    @ApiProperty({ description: '부서 유형' })
    type: string;

    @ApiProperty({ description: '정렬 순서' })
    order: number;

    @ApiProperty({ description: '직원 수' })
    employeeCount: number;
}

/**
 * 부서 목록 조회 응답 DTO
 */
export class GetDepartmentListResponseDto {
    @ApiProperty({
        description: '부서 계층구조',
        type: [DepartmentNodeResponseDto],
    })
    hierarchy: DepartmentNodeResponseDto[];

    @ApiProperty({
        description: '부서 1차원 배열',
        type: [DepartmentInfoResponseDto],
    })
    flatList: DepartmentInfoResponseDto[];

    @ApiProperty({ description: '전체 부서 수' })
    totalDepartments: number;

    @ApiProperty({ description: '전체 직원 수' })
    totalEmployees: number;
}

// --- 부서 목록 + 부서별 직원 조회 (시점 기준) ---

/**
 * 부서 소속 직원 응답 DTO (시점 기준)
 */
export class EmployeeInDepartmentResponseDto {
    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '이름' })
    name: string;

    @ApiProperty({ description: '사번' })
    employeeNumber: string;
}

/**
 * 부서 정보 + 소속 직원 목록 응답 DTO (1차원 배열용)
 */
export class DepartmentInfoWithEmployeesResponseDto {
    @ApiProperty({ description: '부서 ID' })
    id: string;

    @ApiProperty({ description: '부서 코드' })
    departmentCode: string;

    @ApiProperty({ description: '부서 이름' })
    departmentName: string;

    @ApiProperty({ description: '상위 부서 ID', nullable: true })
    parentDepartmentId: string | null;

    @ApiProperty({ description: '부서 유형' })
    type: string;

    @ApiProperty({ description: '정렬 순서' })
    order: number;

    @ApiProperty({ description: '직원 수' })
    employeeCount: number;

    @ApiProperty({
        description: '해당 시점 부서 소속 직원 목록',
        type: [EmployeeInDepartmentResponseDto],
    })
    employees: EmployeeInDepartmentResponseDto[];
}

/**
 * 부서 노드 + 소속 직원 목록 응답 DTO (계층구조용)
 */
export class DepartmentNodeWithEmployeesResponseDto {
    @ApiProperty({ description: '부서 ID' })
    id: string;

    @ApiProperty({ description: '부서 코드' })
    departmentCode: string;

    @ApiProperty({ description: '부서 이름' })
    departmentName: string;

    @ApiProperty({ description: '상위 부서 ID', nullable: true })
    parentDepartmentId: string | null;

    @ApiProperty({ description: '부서 유형' })
    type: string;

    @ApiProperty({ description: '정렬 순서' })
    order: number;

    @ApiProperty({ description: '직원 수' })
    employeeCount: number;

    @ApiProperty({
        description: '해당 시점 부서 소속 직원 목록',
        type: [EmployeeInDepartmentResponseDto],
    })
    employees: EmployeeInDepartmentResponseDto[];

    @ApiProperty({
        description: '하위 부서 목록',
        type: [DepartmentNodeWithEmployeesResponseDto],
    })
    children: DepartmentNodeWithEmployeesResponseDto[];
}

/**
 * 부서 목록 + 부서별 직원 조회 응답 DTO (시점 기준)
 */
export class GetDepartmentListWithEmployeesResponseDto {
    @ApiProperty({
        description: '부서 계층구조 (부서별 직원 포함)',
        type: [DepartmentNodeWithEmployeesResponseDto],
    })
    hierarchy: DepartmentNodeWithEmployeesResponseDto[];

    @ApiProperty({
        description: '부서 1차원 배열 (부서별 직원 포함)',
        type: [DepartmentInfoWithEmployeesResponseDto],
    })
    flatList: DepartmentInfoWithEmployeesResponseDto[];

    @ApiProperty({ description: '전체 부서 수' })
    totalDepartments: number;

    @ApiProperty({ description: '전체 직원 수' })
    totalEmployees: number;
}
