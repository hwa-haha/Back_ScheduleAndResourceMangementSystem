import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

/**
 * 직원 추가 정보 변경 요청 DTO
 */
export class UpdateEmployeeExtraInfoRequestDto {
    @ApiProperty({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    @IsNotEmpty()
    employeeId: string;

    @ApiProperty({ description: '대시보드 요약에서 제외 여부', example: false })
    @IsBoolean()
    @IsNotEmpty()
    isExcludedFromSummary: boolean;

    @ApiPropertyOptional({ description: '연도 (YYYY 형식)', example: '2025' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{4}$/, { message: '연도는 YYYY 형식이어야 합니다.' })
    year?: string;

    @ApiPropertyOptional({ description: '월 (MM 형식)', example: '01' })
    @IsOptional()
    @IsString()
    @Matches(/^(0[1-9]|1[0-2])$/, { message: '월은 01-12 형식이어야 합니다.' })
    month?: string;
}

/**
 * 직원 추가 정보 응답 DTO
 */
export class EmployeeExtraInfoResponseDto {
    @ApiProperty({ description: '추가 정보 ID' })
    id: string;

    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '대시보드 요약에서 제외 여부' })
    isExcludedFromSummary: boolean;

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
 * 직원 추가 정보 변경 응답 DTO
 */
export class UpdateEmployeeExtraInfoResponseDto {
    @ApiProperty({ description: '추가 정보', type: EmployeeExtraInfoResponseDto })
    extraInfo: EmployeeExtraInfoResponseDto;
}
