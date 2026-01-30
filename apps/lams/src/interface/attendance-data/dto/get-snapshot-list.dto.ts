import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * 날짜 범위 필터 DTO
 */
export class DateRangeFilterDto {
    @ApiPropertyOptional({ description: '시작 날짜', example: '2024-01-01' })
    @IsOptional()
    @IsString()
    startDate?: string;

    @ApiPropertyOptional({ description: '종료 날짜', example: '2024-12-31' })
    @IsOptional()
    @IsString()
    endDate?: string;
}

/**
 * 필터 조건 DTO
 */
export class SnapshotFiltersDto {
    @ApiPropertyOptional({ description: '스냅샷 타입', example: 'MONTHLY' })
    @IsOptional()
    @IsString()
    snapshotType?: string;

    @ApiPropertyOptional({ description: '날짜 범위', type: DateRangeFilterDto })
    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => DateRangeFilterDto)
    dateRange?: DateRangeFilterDto;
}

/**
 * 스냅샷 목록 조회 요청 DTO
 */
export class GetSnapshotListRequestDto {
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

    // @ApiPropertyOptional({
    //     description: '정렬 기준',
    //     enum: ['latest', 'oldest', 'name', 'type'],
    //     example: 'latest',
    //     default: 'latest',
    // })
    // @IsOptional()
    // @IsEnum(['latest', 'oldest', 'name', 'type'])
    // sortBy?: 'latest' | 'oldest' | 'name' | 'type';

    // @ApiPropertyOptional({ description: '필터 조건', type: SnapshotFiltersDto })
    // @IsOptional()
    // @IsObject()
    // @ValidateNested()
    // @Type(() => SnapshotFiltersDto)
    // filters?: SnapshotFiltersDto;
}

/**
 * 스냅샷 자식 정보 응답 DTO
 */
export class SnapshotChildResponseDto {
    @ApiProperty({ description: '스냅샷 자식 ID' })
    id: string;

    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '직원명' })
    employeeName: string;

    @ApiProperty({ description: '직원번호' })
    employeeNumber: string;

    @ApiProperty({ description: '연도' })
    yyyy: string;

    @ApiProperty({ description: '월' })
    mm: string;

    @ApiProperty({ description: '스냅샷 데이터 (JSON)' })
    snapshotData: string | Record<string, any>;

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
 * 스냅샷 정보 응답 DTO
 */
export class SnapshotInfoResponseDto {
    @ApiProperty({ description: '스냅샷 ID' })
    id: string;

    @ApiProperty({ description: '스냅샷명' })
    snapshotName: string;

    @ApiProperty({ description: '설명' })
    description: string;

    @ApiProperty({ description: '스냅샷 타입' })
    snapshotType: string;

    @ApiProperty({ description: '연도' })
    yyyy: string;

    @ApiProperty({ description: '월' })
    mm: string;

    @ApiProperty({ description: '부서 ID' })
    departmentId: string;

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

    @ApiPropertyOptional({
        description: '스냅샷 자식 데이터 목록',
        type: [SnapshotChildResponseDto],
    })
    children?: SnapshotChildResponseDto[];
}

/**
 * 스냅샷 목록 조회 응답 DTO
 */
export class GetSnapshotListResponseDto {
    @ApiProperty({
        description: '가장 최신 스냅샷 (조건에 맞는 첫 번째)',
        type: SnapshotInfoResponseDto,
        nullable: true,
    })
    latestSnapshot: SnapshotInfoResponseDto | null;

    @ApiProperty({
        description: '전체 스냅샷 목록 (조건에 맞는 모든 스냅샷)',
        type: [SnapshotInfoResponseDto],
    })
    snapshots: SnapshotInfoResponseDto[];

    @ApiProperty({ description: '전체 스냅샷 수' })
    totalCount: number;
}
