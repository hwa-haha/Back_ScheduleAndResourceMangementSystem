import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 파일 업로드 요청 DTO
 */
export class UploadFileRequestDto {
    @ApiProperty({
        description: '연도',
        example: '2026',
        required: false,
    })
    @IsString()
    @IsOptional()
    year?: string;

    @ApiProperty({
        description: '월',
        example: '01',
        required: false,
    })
    @IsString()
    @IsOptional()
    month?: string;
}

/**
 * 파일 업로드 응답 DTO
 */
export class UploadFileResponseDto {
    @ApiProperty({ description: '파일 ID' })
    fileId: string;

    @ApiProperty({ description: '파일명' })
    fileName: string;

    @ApiProperty({ description: '파일 경로' })
    filePath: string;

    @ApiProperty({ description: '연도' })
    year: string | null;

    @ApiProperty({ description: '월' })
    month: string | null;
}
