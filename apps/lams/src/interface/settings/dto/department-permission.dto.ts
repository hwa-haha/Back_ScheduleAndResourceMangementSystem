import { ApiProperty } from '@nestjs/swagger';

/**
 * 권한 목록에 포함될 직원 요약 정보 DTO
 */
export class EmployeeInfoForPermissionResponseDto {
    @ApiProperty({ description: '직원 ID' })
    id: string;

    @ApiProperty({ description: '사번' })
    employeeNumber: string;

    @ApiProperty({ description: '직원명' })
    employeeName: string;

    @ApiProperty({ description: '퇴사 여부 (직원 상태 퇴사 또는 퇴사자 부서 소속)' })
    isTerminated: boolean;
}

/**
 * 부서 정보 응답 DTO (보기권한/검토권한별 직원 목록 포함)
 */
export class DepartmentInfoForPermissionResponseDto {
    @ApiProperty({ description: '부서 ID' })
    id: string;

    @ApiProperty({ description: '부서 코드' })
    departmentCode: string;

    @ApiProperty({ description: '부서명' })
    departmentName: string;

    @ApiProperty({ description: '부서 타입' })
    type: string;

    @ApiProperty({ description: '정렬 순서' })
    order: number;

    @ApiProperty({
        description: '보기권한(접근권한)을 가진 직원 목록',
        type: [EmployeeInfoForPermissionResponseDto],
    })
    accessPermissionEmployees: EmployeeInfoForPermissionResponseDto[];

    @ApiProperty({
        description: '검토권한을 가진 직원 목록',
        type: [EmployeeInfoForPermissionResponseDto],
    })
    reviewPermissionEmployees: EmployeeInfoForPermissionResponseDto[];

    @ApiProperty({ description: '해당 부서 권한자 중 퇴사자가 한 명이라도 있는지 여부' })
    hasTerminatedPermissionHolder: boolean;
}

/**
 * 권한 관리용 부서 목록 조회 응답 DTO
 */
export class GetDepartmentListForPermissionResponseDto {
    @ApiProperty({ description: '부서 목록 (부서별 보기권한/검토권한 직원 목록 포함)', type: [DepartmentInfoForPermissionResponseDto] })
    departments: DepartmentInfoForPermissionResponseDto[];

    @ApiProperty({ description: '전체 부서 수' })
    totalCount: number;
}

/**
 * 특정 부서의 직원별 권한 정보 DTO
 */
export class DepartmentPermissionEmployeeInfoDto {
    @ApiProperty({ description: '직원 ID' })
    id: string;

    @ApiProperty({ description: '사번' })
    employeeNumber: string;

    @ApiProperty({ description: '직원명' })
    employeeName: string;

    @ApiProperty({ description: '보기권한(접근권한) 여부' })
    hasAccessPermission: boolean;

    @ApiProperty({ description: '검토권한 여부' })
    hasReviewPermission: boolean;

    @ApiProperty({ description: '퇴사 여부 (직원 상태 퇴사 또는 퇴사자 부서 소속)' })
    isTerminated: boolean;
}

/**
 * 특정 부서별 직원 권한 목록 조회 응답 DTO
 */
export class GetDepartmentPermissionListResponseDto {
    @ApiProperty({ description: '부서 ID' })
    departmentId: string;

    @ApiProperty({ description: '부서명' })
    departmentName: string;

    @ApiProperty({
        description: '해당 부서에 권한을 가진 직원 목록',
        type: [DepartmentPermissionEmployeeInfoDto],
    })
    employees: DepartmentPermissionEmployeeInfoDto[];
}
