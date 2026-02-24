import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 제출된 가장 최신 스냅샷 조회 요청 DTO (연·월 미지정 시 전월 기준)
 */
export class GetLatestSubmittedSnapshotRequestDto {
    @ApiPropertyOptional({ description: '연도', example: '2026' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{4}$/, { message: '연도는 4자리 숫자입니다.' })
    year?: string;

    @ApiPropertyOptional({ description: '월 (01~12)', example: '01' })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value.padStart(2, '0'))
    month?: string;
}

/**
 * 제출된 가장 최신 스냅샷 정보 (id, submittedAt)
 */
export class LatestSubmittedSnapshotItemDto {
    @ApiProperty({ description: '스냅샷 ID' })
    id: string;

    @ApiProperty({ description: '제출 일시' })
    submittedAt: Date;
}

/**
 * 제출된 가장 최신 스냅샷 조회 응답 DTO (없으면 null)
 */
export class GetLatestSubmittedSnapshotResponseDto {
    @ApiProperty({ description: '스냅샷 ID' })
    id: string;

    @ApiProperty({ description: '제출 일시' })
    submittedAt: Date;
}
