import { ApiProperty } from '@nestjs/swagger';

/**
 * 검토 권한자 정보 DTO
 */
export class ReviewerInfoDto {
    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '직원명' })
    employeeName: string;

    @ApiProperty({ description: '사번' })
    employeeNumber: string;
}

/**
 * 부서별 권한자 DTO
 */
export class DepartmentReviewersDto {
    @ApiProperty({ description: '부서 ID' })
    departmentId: string;

    @ApiProperty({ description: '부서명' })
    departmentName: string;

    @ApiProperty({ description: '검토 권한자 목록', type: [ReviewerInfoDto] })
    reviewers: ReviewerInfoDto[];
}

/**
 * 결재 관련 부서별 권한자 조회 응답 DTO
 */
export class GetReviewersByDepartmentResponseDto {
    @ApiProperty({ description: '부서별 권한자 목록', type: [DepartmentReviewersDto] })
    departments: DepartmentReviewersDto[];
}
