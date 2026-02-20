import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsUUID,
    IsBoolean,
    IsNotEmpty,
    IsArray,
    ArrayMinSize,
    ValidateNested,
    IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 부서 권한 정보 DTO (직원 기준 요청 시 부서별 권한)
 */
export class DepartmentPermissionDto {
    @ApiProperty({ description: '부서 ID', example: '123e4567-e89b-12d3-a456-426614174001' })
    @IsUUID()
    @IsNotEmpty()
    departmentId: string;

    @ApiProperty({ description: '접근 권한', example: true })
    @IsBoolean()
    @IsNotEmpty()
    hasAccessPermission: boolean;

    @ApiProperty({ description: '검토 권한', example: false })
    @IsBoolean()
    @IsNotEmpty()
    hasReviewPermission: boolean;
}

/**
 * 직원 권한 정보 DTO (부서 기준 요청 시 직원별 권한)
 */
export class EmployeePermissionDto {
    @ApiProperty({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174001' })
    @IsUUID()
    @IsNotEmpty()
    employeeId: string;

    @ApiProperty({ description: '접근 권한', example: true })
    @IsBoolean()
    @IsNotEmpty()
    hasAccessPermission: boolean;

    @ApiProperty({ description: '검토 권한', example: false })
    @IsBoolean()
    @IsNotEmpty()
    hasReviewPermission: boolean;
}

/**
 * 직원-부서 권한 변경 요청 DTO (부서별로 직원 권한 설정)
 */
export class UpdateEmployeeDepartmentPermissionRequestDto {
    @ApiProperty({ description: '부서 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    @IsNotEmpty()
    departmentId: string;

    @ApiProperty({
        description: '직원별 권한 목록',
        type: [EmployeePermissionDto],
        example: [
            {
                employeeId: '123e4567-e89b-12d3-a456-426614174001',
                hasAccessPermission: true,
                hasReviewPermission: false,
            },
        ],
    })
    @IsArray()
    @ArrayMinSize(0)
    @ValidateNested({ each: true })
    @Type(() => EmployeePermissionDto)
    employees: EmployeePermissionDto[];
}

/**
 * 직원-부서 권한 정보 응답 DTO
 */
export class EmployeeDepartmentPermissionResponseDto {
    @ApiProperty({ description: '권한 ID' })
    id: string;

    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '부서 ID' })
    departmentId: string;

    @ApiProperty({ description: '접근 권한' })
    hasAccessPermission: boolean;

    @ApiProperty({ description: '검토 권한' })
    hasReviewPermission: boolean;

    @ApiProperty({ description: '생성 일시' })
    createdAt: Date;

    @ApiProperty({ description: '수정 일시' })
    updatedAt: Date;

    @ApiPropertyOptional({ description: '삭제 일시' })
    deletedAt?: Date;

    @ApiPropertyOptional({ description: '생성자 ID' })
    createdBy?: string;

    @ApiPropertyOptional({ description: '수정자 ID' })
    updatedBy?: string;

    @ApiProperty({ description: '버전' })
    version: number;
}

/**
 * 직원-부서 권한 변경 응답 DTO
 */
export class UpdateEmployeeDepartmentPermissionResponseDto {
    @ApiProperty({ description: '권한 정보 목록', type: [EmployeeDepartmentPermissionResponseDto] })
    permissions: EmployeeDepartmentPermissionResponseDto[];
}

/**
 * 권한 관련 부서 목록 조회 요청 DTO
 */
export class GetPermissionRelatedDepartmentListRequestDto {
    @ApiPropertyOptional({ description: '직원명 검색', example: '홍길동' })
    @IsOptional()
    @IsString()
    employeeName?: string;

    @ApiPropertyOptional({ description: '부서명 검색', example: '개발팀' })
    @IsOptional()
    @IsString()
    departmentName?: string;
}

/**
 * 권한 관련 직원 목록 조회 요청 DTO
 */
export class GetPermissionRelatedEmployeeListRequestDto {
    @ApiPropertyOptional({ description: '직원명 검색', example: '홍길동' })
    @IsOptional()
    @IsString()
    employeeName?: string;

    @ApiPropertyOptional({ description: '부서명 검색', example: '개발팀' })
    @IsOptional()
    @IsString()
    departmentName?: string;
}

/**
 * 직원의 부서 권한 정보 DTO
 */
export class EmployeeDepartmentPermissionInfoDto {
    @ApiProperty({ description: '부서 ID' })
    departmentId: string;

    @ApiProperty({ description: '부서명' })
    departmentName: string;

    @ApiProperty({ description: '접근 권한' })
    hasAccessPermission: boolean;

    @ApiProperty({ description: '검토 권한' })
    hasReviewPermission: boolean;
}

/**
 * 직원 추가정보 요약 DTO (권한 목록 응답용)
 */
export class EmployeeExtraInfoSummaryDto {
    @ApiProperty({ description: '추가정보 ID' })
    id: string;

    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '대시보드 요약에서 제외 여부' })
    isExcludedFromSummary: boolean;
}

/**
 * 직원 권한 정보 DTO (추가정보 제외)
 */
export class EmployeeWithPermissionsDto {
    @ApiProperty({ description: '직원 ID' })
    id: string;

    @ApiProperty({ description: '직원번호' })
    employeeNumber: string;

    @ApiProperty({ description: '직원명' })
    employeeName: string;

    @ApiProperty({ description: '부서별 권한 목록', type: [EmployeeDepartmentPermissionInfoDto] })
    permissions: EmployeeDepartmentPermissionInfoDto[];
}

/**
 * 직원 추가정보만 응답 DTO (권한 정보 제외)
 */
export class EmployeeWithExtraInfoDto {
    @ApiProperty({ description: '직원 ID' })
    id: string;

    @ApiProperty({ description: '직원번호' })
    employeeNumber: string;

    @ApiProperty({ description: '직원명' })
    employeeName: string;

    @ApiPropertyOptional({
        description: '직원 추가정보 (없을 수 있음)',
        type: EmployeeExtraInfoSummaryDto,
        nullable: true,
    })
    extraInfo?: EmployeeExtraInfoSummaryDto | null;
}

/**
 * 권한 관련 부서 목록 조회 응답 DTO
 */
export class GetPermissionRelatedDepartmentListResponseDto {
    @ApiProperty({ description: '직원 목록', type: [EmployeeWithPermissionsDto] })
    employees: EmployeeWithPermissionsDto[];

    @ApiProperty({ description: '전체 직원 수' })
    totalCount: number;
}

/**
 * 권한 관련 직원 목록 조회 응답 DTO
 */
export class GetPermissionRelatedEmployeeListResponseDto {
    @ApiProperty({ description: '직원 목록', type: [EmployeeWithPermissionsDto] })
    employees: EmployeeWithPermissionsDto[];

    @ApiProperty({ description: '전체 직원 수' })
    totalCount: number;
}

/**
 * 권한 관련 직원 목록 조회 응답 DTO (추가정보만 포함, 권한 정보 제외)
 */
export class GetPermissionRelatedEmployeeListWithExtraInfoResponseDto {
    @ApiProperty({ description: '직원 목록 (추가정보만)', type: [EmployeeWithExtraInfoDto] })
    employees: EmployeeWithExtraInfoDto[];

    @ApiProperty({ description: '전체 직원 수' })
    totalCount: number;
}

/**
 * 직원의 권한 목록 조회 요청 DTO
 */
export class GetEmployeePermissionListRequestDto {
    @ApiProperty({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    @IsNotEmpty()
    employeeId: string;
}

/**
 * 직원의 권한 목록 조회 응답 DTO
 */
export class GetEmployeePermissionListResponseDto {
    @ApiProperty({ description: '직원 ID' })
    id: string;

    @ApiProperty({ description: '직원번호' })
    employeeNumber: string;

    @ApiProperty({ description: '직원명' })
    employeeName: string;

    @ApiProperty({ description: '부서별 권한 목록', type: [EmployeeDepartmentPermissionInfoDto] })
    permissions: EmployeeDepartmentPermissionInfoDto[];
}
