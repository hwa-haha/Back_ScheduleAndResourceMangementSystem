import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 파일 목록과 반영이력 조회 요청 DTO
 */
export class GetFileListWithHistoryRequestDto {
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
 * 파일 내용 반영이력 응답 DTO
 */
export class FileContentReflectionHistoryResponseDto {
    @ApiProperty({ description: 'ID' })
    id: string;

    @ApiProperty({ description: '파일 ID' })
    fileId: string;

    @ApiProperty({ description: '상태' })
    status: string;

    @ApiProperty({ description: '타입' })
    type: string;

    @ApiProperty({ description: '데이터', nullable: true })
    data: Record<string, any> | null;

    @ApiProperty({ description: '생성 일시' })
    createdAt: Date;

    @ApiProperty({ description: '반영 일시', nullable: true })
    reflectedAt: Date | null;

    @ApiProperty({ description: '수정 일시' })
    updatedAt: Date;

    @ApiProperty({ description: '삭제 일시', nullable: true })
    deletedAt?: Date;

    @ApiProperty({ description: '생성자 ID', nullable: true })
    createdBy?: string;

    @ApiProperty({ description: '수정자 ID', nullable: true })
    updatedBy?: string;

    @ApiProperty({ description: '버전' })
    version: number;
}

/**
 * 파일 정보 응답 DTO (반영이력 포함)
 */
export class FileWithHistoryResponseDto {
    @ApiProperty({ description: 'ID' })
    id: string;

    @ApiProperty({ description: '파일명' })
    fileName: string;

    @ApiProperty({ description: '원본 파일명', nullable: true })
    fileOriginalName: string | null;

    @ApiProperty({ description: '파일 경로' })
    filePath: string;

    @ApiProperty({ description: '연도', nullable: true })
    year: string | null;

    @ApiProperty({ description: '월', nullable: true })
    month: string | null;

    @ApiProperty({ description: '읽음 일시', nullable: true })
    readAt: string | null;

    @ApiProperty({ description: '상태' })
    status: string;

    @ApiProperty({ description: '에러 메시지', nullable: true })
    error: string | null;

    @ApiProperty({ description: '데이터', nullable: true })
    data: Record<string, any> | null;

    @ApiProperty({ description: '업로드한 사용자 ID' })
    uploadBy: string;

    @ApiProperty({ description: '업로드 일시' })
    uploadedAt: Date;

    @ApiProperty({ description: '생성 일시' })
    createdAt: Date;

    @ApiProperty({ description: '수정 일시' })
    updatedAt: Date;

    @ApiProperty({ description: '삭제 일시', nullable: true })
    deletedAt?: Date;

    @ApiProperty({ description: '생성자 ID', nullable: true })
    createdBy?: string;

    @ApiProperty({ description: '수정자 ID', nullable: true })
    updatedBy?: string;

    @ApiProperty({ description: '버전' })
    version: number;

    @ApiProperty({
        description: '반영이력 목록',
        type: [FileContentReflectionHistoryResponseDto],
    })
    reflectionHistories: FileContentReflectionHistoryResponseDto[];
}

/**
 * 파일 목록과 반영이력 조회 응답 DTO
 */
export class GetFileListWithHistoryResponseDto {
    @ApiProperty({
        description: '파일 목록 (반영이력 포함)',
        type: [FileWithHistoryResponseDto],
    })
    files: FileWithHistoryResponseDto[];
}
