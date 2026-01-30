import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { DataSnapshotInfoDTO } from '../../../domain/data-snapshot-info/data-snapshot-info.types';
import { Transform } from 'class-transformer';

/**
 * 근태 스냅샷 저장 요청 DTO
 */
export class SaveAttendanceSnapshotRequestDto {
    @ApiProperty({ description: '연도', example: '2026' })
    @IsString()
    @IsNotEmpty()
    year: string;

    @ApiProperty({ description: '월', example: '01' })
    @Transform(({ value }) => (typeof value === 'string' && value.length === 1 ? value.padStart(2, '0') : value))
    @IsString()
    @IsNotEmpty()
    month: string;

    @ApiProperty({ description: '부서 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    @IsOptional()
    departmentId?: string;

    @ApiPropertyOptional({ description: '스냅샷 이름', example: '2024년 1월 근태 스냅샷' })
    @IsString()
    @IsOptional()
    snapshotName?: string;

    @ApiPropertyOptional({ description: '스냅샷 설명', example: '월간 요약 데이터 백업' })
    @IsString()
    @IsOptional()
    description?: string;
}

/**
 * 근태 스냅샷 저장 응답 DTO
 */
export class SaveAttendanceSnapshotResponseDto {
    @ApiProperty({ description: '스냅샷 정보' })
    snapshot: DataSnapshotInfoDTO;
}
