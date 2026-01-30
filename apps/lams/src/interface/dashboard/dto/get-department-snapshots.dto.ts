import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 부서별 연도, 월별 스냅샷 조회 요청 DTO
 */
export class GetDepartmentSnapshotsRequestDto {
    @ApiProperty({
        description: '부서 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    departmentId: string;

    @ApiProperty({
        description: '연도',
        example: '2026',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    year: string;

    @ApiProperty({
        description: '월',
        example: '01',
        required: true,
    })
    @Transform(({ value }) => (typeof value === 'string' && value.length === 1 ? value.padStart(2, '0') : value))
    @IsString()
    @IsNotEmpty()
    month: string;
}

/**
 * 스냅샷 자식 정보
 */
export class SnapshotChildInfoDto {
    @ApiProperty({ description: '자식 스냅샷 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    employeeId: string;

    @ApiProperty({ description: '직원 이름', example: '홍길동' })
    employeeName: string;

    @ApiProperty({ description: '직원 번호', example: 'E001' })
    employeeNumber: string;

    @ApiProperty({ description: '연도', example: '2026' })
    yyyy: string;

    @ApiProperty({ description: '월', example: '01' })
    mm: string;

    @ApiProperty({ description: '스냅샷 데이터 (JSON 문자열)', example: '{"key": "value"}' })
    snapshotData: string;

    @ApiProperty({
        description: '원본 데이터 (eventInfo, usedAttendance 등)',
        example: { eventInfo: [], usedAttendance: [] },
        nullable: true,
    })
    rawData?: Record<string, any> | null;
}

/**
 * 스냅샷 정보
 */
export class SnapshotInfoDto {
    @ApiProperty({ description: '스냅샷 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ description: '스냅샷 이름', example: '2024년 1월 스냅샷' })
    snapshotName: string;

    @ApiProperty({ description: '연도', example: '2026' })
    year: string;

    @ApiProperty({ description: '월', example: '01' })
    month: string;

    @ApiProperty({ description: '생성일시', example: '2024-01-15T10:30:00Z' })
    createdAt: string;

    @ApiProperty({
        description: '자식 스냅샷 목록',
        type: [SnapshotChildInfoDto],
        nullable: true,
    })
    children?: SnapshotChildInfoDto[];
}

/**
 * 부서별 연도, 월별 스냅샷 조회 응답 DTO
 */
export class GetDepartmentSnapshotsResponseDto {
    @ApiProperty({ description: '부서 ID' })
    departmentId: string;

    @ApiProperty({ description: '연도' })
    year: string;

    @ApiProperty({ description: '월' })
    month: string;

    @ApiProperty({
        description: '스냅샷 목록',
        type: [SnapshotInfoDto],
    })
    snapshots: SnapshotInfoDto[];
}
