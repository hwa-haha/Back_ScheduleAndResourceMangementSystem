import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 결재시 스냅샷 내용 보기 요청 (Query)
 */
export class GetSnapshotContentForApprovalRequestDto {
    @ApiProperty({ description: '연도', example: '2026', required: true })
    @IsString()
    @IsNotEmpty()
    year: string;

    @ApiProperty({ description: '월 (01-12)', example: '01', required: true })
    @Transform(({ value }) => (typeof value === 'string' && value.length === 1 ? value.padStart(2, '0') : value))
    @IsString()
    @IsNotEmpty()
    month: string;
}

/**
 * 스냅샷 자식 데이터 DTO (결재용)
 */
export class SnapshotChildForApprovalDto {
    @ApiProperty({ description: '자식 스냅샷 ID' })
    id: string;

    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '직원명' })
    employeeName: string;

    @ApiProperty({ description: '사번' })
    employeeNumber: string;

    @ApiProperty({ description: '스냅샷 데이터 (JSON 문자열)' })
    snapshotData: string;
}

/**
 * 부서별 스냅샷 내용 DTO
 */
export class DepartmentSnapshotContentDto {
    @ApiProperty({ description: '부서 ID' })
    departmentId: string;

    @ApiProperty({ description: '부서명' })
    departmentName: string;

    @ApiProperty({ description: '해당 부서 직원 스냅샷 child 목록', type: [SnapshotChildForApprovalDto] })
    children: SnapshotChildForApprovalDto[];
}

/**
 * 결재시 스냅샷 내용 보기 응답 DTO
 */
export class GetSnapshotContentForApprovalResponseDto {
    @ApiProperty({ description: '스냅샷 메타 정보 (children 제외)' })
    snapshot: Record<string, unknown>;

    @ApiProperty({ description: '검토 권한 부서별 스냅샷 child 목록', type: [DepartmentSnapshotContentDto] })
    departments: DepartmentSnapshotContentDto[];
}
