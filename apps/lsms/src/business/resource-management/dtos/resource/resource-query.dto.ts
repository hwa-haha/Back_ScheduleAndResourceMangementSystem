import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ResourceType } from '../../../../../libs/enums/resource-type.enum';
import { PaginationQueryDto } from '../../../../../libs/dtos/pagination-query.dto';

export class ResourceQueryDto extends PaginationQueryDto {
    @ApiProperty({
        description: '리소스 타입',
        enum: ResourceType,
        required: true,
        example: ResourceType.MEETING_ROOM,
    })
    @IsEnum(ResourceType)
    resourceType: ResourceType;

    @ApiPropertyOptional({
        description: '리소스 그룹 ID',
        example: 'ca33f67a-a9c2-4a29-b266-3d82f9aa7fe4',
    })
    @IsOptional()
    @IsString()
    resourceGroupId?: string;

    @ApiPropertyOptional({
        description: '예약 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsString()
    reservationId?: string;

    @ApiPropertyOptional({
        description: '시작 날짜',
        example: '2024-01-01',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: '종료 날짜',
        example: '2024-01-31',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        description: '시작 시간',
        example: '09:00:00',
    })
    @IsOptional()
    @IsString()
    startTime?: string;

    @ApiPropertyOptional({
        description: '종료 시간',
        example: '18:00:00',
    })
    @IsOptional()
    @IsString()
    endTime?: string;

    @ApiPropertyOptional({
        description: '오전 시간대 필터',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    am?: boolean;

    @ApiPropertyOptional({
        description: '오후 시간대 필터',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    pm?: boolean;

    @ApiPropertyOptional({
        description: '이용 시간 단위(분)',
        example: 30,
        minimum: 1,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    timeUnit?: number;

    @ApiPropertyOptional({
        description: '슬롯 간격(분) - 시간 슬롯 생성 시 간격을 설정합니다. 기본값: 30',
        example: 30,
        minimum: 1,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    slotIntervalMinutes?: number;
}
