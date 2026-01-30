import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

/**
 * 휴일 정보 생성 요청 DTO
 */
export class CreateHolidayInfoRequestDto {
    @ApiProperty({ description: '휴일명', example: '신정' })
    @IsString()
    @IsNotEmpty()
    holidayName: string;

    @ApiProperty({ description: '휴일 날짜', example: '2024-01-01' })
    @IsString()
    @IsNotEmpty()
    holidayDate: string;
}

/**
 * 휴일 정보 응답 DTO
 */
export class HolidayInfoResponseDto {
    @ApiProperty({ description: '휴일 ID' })
    id: string;

    @ApiProperty({ description: '휴일명' })
    holidayName: string;

    @ApiProperty({ description: '휴일 날짜' })
    holidayDate: string;

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
 * 휴일 정보 생성 응답 DTO
 */
export class CreateHolidayInfoResponseDto {
    @ApiProperty({ description: '휴일 정보', type: HolidayInfoResponseDto })
    holidayInfo: HolidayInfoResponseDto;
}

/**
 * 휴일 정보 수정 요청 DTO
 */
export class UpdateHolidayInfoRequestDto {
    @ApiProperty({ description: '휴일 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    @IsNotEmpty()
    id: string;

    @ApiPropertyOptional({ description: '휴일명', example: '신정' })
    @IsString()
    @IsOptional()
    holidayName?: string;

    @ApiPropertyOptional({ description: '휴일 날짜', example: '2024-01-01' })
    @IsString()
    @IsOptional()
    holidayDate?: string;
}

/**
 * 휴일 정보 수정 응답 DTO
 */
export class UpdateHolidayInfoResponseDto {
    @ApiProperty({ description: '휴일 정보', type: HolidayInfoResponseDto })
    holidayInfo: HolidayInfoResponseDto;
}

/**
 * 휴일 정보 삭제 요청 DTO
 */
export class DeleteHolidayInfoRequestDto {
    @ApiProperty({ description: '휴일 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    @IsNotEmpty()
    id: string;
}

/**
 * 휴일 정보 삭제 응답 DTO
 */
export class DeleteHolidayInfoResponseDto {
    @ApiProperty({ description: '삭제 성공 여부' })
    success: boolean;
}

/**
 * 휴일 목록 조회 요청 DTO
 */
export class GetHolidayListRequestDto {
    @ApiPropertyOptional({
        description: '연도',
        example: '2026',
        required: false,
    })
    @IsString()
    @IsOptional()
    year?: string;
}

/**
 * 휴일 목록 조회 응답 DTO
 */
export class GetHolidayListResponseDto {
    @ApiProperty({ description: '휴일 목록', type: [HolidayInfoResponseDto] })
    holidays: HolidayInfoResponseDto[];

    @ApiProperty({ description: '전체 휴일 수' })
    totalCount: number;
}
