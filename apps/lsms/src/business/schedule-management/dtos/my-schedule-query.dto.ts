import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { ParticipantsType } from '../../../../libs/enums/reservation-type.enum';

export enum ScheduleCategoryType {
    ALL = 'ALL',
    SCHEDULE = 'SCHEDULE',
    PROJECT = 'PROJECT',
    RESOURCE = 'RESOURCE',
}

export class MyScheduleQueryDto {
    @ApiProperty({
        description:
            '역할 기준 필터 (예약자, 참석자, 수신참조자, 일정 캘린더 참조). 미지정 시 모든 관계 포함.',
        enum: ParticipantsType,
        required: false,
        example: ParticipantsType.RESERVER,
    })
    @IsOptional()
    @IsEnum(ParticipantsType)
    role?: ParticipantsType;

    @ApiProperty({
        description: '카테고리 필터 (전체, 일정, 프로젝트, 자원)',
        enum: ScheduleCategoryType,
        required: false,
        example: ScheduleCategoryType.ALL,
    })
    @IsOptional()
    @IsEnum(ScheduleCategoryType)
    category?: ScheduleCategoryType;

    @ApiProperty({
        description: '검색 키워드 (제목 또는 자원명)',
        required: false,
        example: '회의실',
    })
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    keyword?: string;

    @ApiProperty({
        description: '페이지 번호',
        required: false,
        example: 1,
        default: 1,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value) || 1)
    page?: number = 1;

    @ApiProperty({
        description: '페이지당 항목 수',
        required: false,
        example: 20,
        default: 20,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value) || 20)
    limit?: number = 20;
}
