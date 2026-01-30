import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 이력으로 되돌리기 요청 DTO
 */
export class RestoreFromHistoryRequestDto {
    @ApiProperty({
        description: '반영 이력 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    reflectionHistoryId: string;

    @ApiProperty({
        description: '연도',
        example: '2026',
    })
    @IsString()
    @IsNotEmpty()
    year: string;

    @ApiProperty({
        description: '월',
        example: '01',
    })
    @Transform(({ value }) => (typeof value === 'string' && value.length === 1 ? value.padStart(2, '0') : value))
    @IsString()
    @IsNotEmpty()
    month: string;
}

/**
 * 이력으로 되돌리기 응답 DTO
 */
export class RestoreFromHistoryResponseDto {
    @ApiProperty({ description: '원본 반영 이력 ID' })
    reflectionHistoryId: string;

    @ApiProperty({ description: '스냅샷으로부터 복원 결과' })
    restoreSnapshotResult: {
        year: string;
        month: string;
    };
}
