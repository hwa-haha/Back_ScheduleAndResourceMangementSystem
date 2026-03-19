import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 부서 상세 정보
export class DepartmentDetailDto {
    @ApiProperty({ description: '부서 ID' })
    id: string;

    @ApiProperty({ description: '부서명' })
    departmentName: string;

    @ApiProperty({ description: '부서 코드' })
    departmentCode: string;

    @ApiProperty({ description: '부서 유형', enum: ['COMPANY', 'DIVISION', 'DEPARTMENT', 'TEAM'] })
    type: string;

    @ApiPropertyOptional({ description: '상위 부서 ID' })
    parentDepartmentId?: string;

    @ApiPropertyOptional({ description: '상위 부서명' })
    parentDepartmentName?: string;

    @ApiProperty({ description: '정렬 순서' })
    order: number;
}

// 직책 상세 정보
export class PositionDetailDto {
    @ApiProperty({ description: '직책 ID' })
    id: string;

    @ApiProperty({ description: '직책명' })
    positionTitle: string;

    @ApiProperty({ description: '직책 코드' })
    positionCode: string;

    @ApiProperty({ description: '직책 레벨' })
    level: number;

    @ApiProperty({ description: '관리 권한 여부' })
    hasManagementAuthority: boolean;
}

// 직급 상세 정보
export class RankDetailDto {
    @ApiProperty({ description: '직급 ID' })
    id: string;

    @ApiProperty({ description: '직급명' })
    rankName: string;

    @ApiProperty({ description: '직급 코드' })
    rankCode: string;

    @ApiProperty({ description: '직급 레벨' })
    level: number;
}

export class EmployeeResponseDto {
    @ApiProperty({ description: '직원 ID' })
    id: string;

    @ApiProperty({ description: '직원 이름' })
    name: string;

    @ApiProperty({ description: '직원 이메일' })
    email: string;

    @ApiProperty({ description: '사번' })
    employeeNumber: string;

    @ApiPropertyOptional({ description: '전화번호' })
    phoneNumber?: string;

    @ApiPropertyOptional({ description: '생년월일' })
    dateOfBirth?: Date;

    @ApiPropertyOptional({ description: '성별' })
    gender?: string;

    @ApiProperty({ description: '입사일' })
    hireDate: Date;

    @ApiProperty({ description: '직원 상태' })
    status: string;

    // withDetail=true일 때만 포함되는 상세 정보
    @ApiPropertyOptional({ description: '부서 상세 정보 (withDetail=true일 때만 포함)', type: DepartmentDetailDto })
    department?: DepartmentDetailDto;

    @ApiPropertyOptional({ description: '직책 상세 정보 (withDetail=true일 때만 포함)', type: PositionDetailDto })
    position?: PositionDetailDto;

    @ApiPropertyOptional({ description: '직급 상세 정보 (withDetail=true일 때만 포함)', type: RankDetailDto })
    rank?: RankDetailDto;
}
