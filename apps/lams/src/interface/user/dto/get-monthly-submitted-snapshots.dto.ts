import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 연월별 제출된 최신 스냅샷 목록 조회 요청 DTO
 */
export class GetMonthlySubmittedSnapshotsRequestDto {
    @ApiProperty({ description: '연도', example: '2026' })
    @IsString()
    @Matches(/^\d{4}$/, { message: '연도는 4자리 숫자입니다.' })
    year: string;

    @ApiProperty({ description: '월 (1~12 또는 01~12)', example: '02' })
    @IsString()
    @Matches(/^(0?[1-9]|1[0-2])$/, { message: '월은 01~12입니다.' })
    @Transform(({ value }) => (typeof value === 'string' && value.length === 1 ? value.padStart(2, '0') : value))
    month: string;
}

/**
 * 연월별 제출된 최신 스냅샷 한 건 (연월 + 제출일)
 */
export class MonthlySubmittedSnapshotItemDto {
    @ApiProperty({ description: '스냅샷 ID' })
    id: string;

    @ApiProperty({ description: '연도', example: '2026' })
    yyyy: string;

    @ApiProperty({ description: '월', example: '02' })
    mm: string;

    @ApiProperty({ description: '제출 일시' })
    submittedAt: Date;
}

