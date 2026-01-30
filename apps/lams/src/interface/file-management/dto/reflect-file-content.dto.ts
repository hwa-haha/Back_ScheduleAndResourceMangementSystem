import { IsString, IsNotEmpty, IsArray, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 파일 내용 반영 요청 DTO
 */
export class ReflectFileContentRequestDto {
    @ApiProperty({
        description: '파일 ID',
        example: 'dd0cbfa8-94ef-4540-aa3c-c0d0178d5c19',
    })
    @IsString()
    @IsNotEmpty()
    @IsUUID('4')
    fileId: string;

    @ApiProperty({
        description: '적용할 직원 번호 목록',
        example: ['10001', '10002'],
        type: [String],
    })
    @IsArray()
    @IsNotEmpty()
    @IsString({ each: true })
    employeeNumbers: string[];

    @ApiProperty({
        description: '연도',
        example: '2026',
    })
    @IsString()
    @IsNotEmpty()
    year: string;

    @ApiProperty({
        description: '월 (1~12, 1월은 01 또는 1 입력 가능)',
        example: '01',
    })
    @Transform(({ value }) => (typeof value === 'string' && value.length === 1 ? value.padStart(2, '0') : value))
    @IsString()
    @IsNotEmpty()
    month: string;

    @ApiProperty({
        description: '추가 정보 (선택사항)',
        example: '파일 반영에 대한 추가 메모',
        required: false,
    })
    @IsString()
    info?: string;
}

/**
 * 파일 내용 반영 응답 DTO
 */
export class ReflectFileContentResponseDto {
    @ApiProperty({ description: '파일 ID' })
    fileId: string;

    @ApiProperty({ description: '반영 이력 ID' })
    reflectionHistoryId: string;
}
