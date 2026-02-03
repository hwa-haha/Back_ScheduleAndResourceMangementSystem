import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 해당 직원 해당 연월 스냅샷 존재 여부 조회 요청 (Query)
 */
export class CheckEmployeeSnapshotExistsRequestDto {
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
 * 해당 직원 해당 연월 스냅샷 존재 여부 조회 응답 DTO
 */
export class CheckEmployeeSnapshotExistsResponseDto {
    @ApiProperty({
        description: '해당 연월에 해당 직원의 스냅샷 데이터가 존재하면 true',
        example: true,
    })
    exists: boolean;
}
