import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsArray,
    IsEnum,
    IsDateString,
    IsUUID,
    IsInt,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ScheduleType } from '../../../../libs/enums/schedule-type.enum';
import { ResourceType } from '../../../../libs/enums/resource-type.enum';
import { DateUtil } from '../../../../libs/utils/date.util';

/**
 * 일정 날짜 범위 DTO
 */
export class ScheduleDateRangeDto {
    @ApiProperty({
        description: '시작 날짜 및 시간',
        example: '2025-08-25T10:00:00Z',
    })
    @IsDateString()
    startDate: string;

    @ApiProperty({
        description: '종료 날짜 및 시간',
        example: '2025-08-25T11:00:00Z',
    })
    @IsDateString()
    endDate: string;
}

/**
 * 참석자 DTO
 */
export class ScheduleParticipantDto {
    @ApiProperty({
        description: '참석자 직원 ID',
        example: 'uuid-string',
    })
    @IsUUID()
    employeeId: string;
}

/**
 * 프로젝트 선택 DTO
 */
export class ProjectSelectionDto {
    @ApiProperty({
        description: '프로젝트 ID',
        example: 'uuid-string',
    })
    @IsUUID()
    projectId: string;
}

/**
 * 자원 선택 DTO
 */
export class ResourceSelectionDto {
    @ApiProperty({
        description: '자원 유형',
        enum: ResourceType,
        example: ResourceType.MEETING_ROOM,
    })
    @IsEnum(ResourceType)
    resourceType: ResourceType;

    @ApiProperty({
        description: '자원 ID',
        example: 'uuid-string',
    })
    @IsUUID()
    resourceId: string;
}

/**
 * 일정 생성 요청 DTO
 */
export class ScheduleCreateRequestDto {
    @ApiProperty({
        description: '일정 날짜 범위 목록 (연속되지 않은 여러 날짜 가능)',
        type: [ScheduleDateRangeDto],
        example: [
            {
                startDate: new Date('2025-09-05T01:00:00Z').toISOString(),
                endDate: new Date('2025-09-05T02:00:00Z').toISOString(),
            },
            {
                startDate: new Date('2025-09-06T01:00:00Z').toISOString(),
                endDate: new Date('2025-09-06T02:00:00Z').toISOString(),
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ScheduleDateRangeDto)
    datesSelection: ScheduleDateRangeDto[];

    @ApiProperty({
        description: '일정 제목',
        example: '주간 팀 회의',
    })
    @IsString()
    title: string;

    @ApiProperty({
        description: '일정 내용',
        example: '주간 업무 공유 및 계획 수립',
        required: false,
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        description: '일정 장소',
        example: '회의실 A',
        required: false,
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({
        description: '일정 시작 전 알림 여부',
        example: true,
    })
    notifyBeforeStart: boolean;

    @ApiProperty({
        description: '알림 시간 (분 단위)',
        example: [5, 10, 30],
        type: [Number],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    @Min(0, { each: true })
    notificationMinutes?: number[];

    @ApiProperty({
        description: '일정 유형',
        enum: ScheduleType,
        example: ScheduleType.DEPARTMENT,
    })
    @IsEnum(ScheduleType)
    scheduleType: ScheduleType;

    @ApiProperty({
        description: '참석자 목록',
        type: [ScheduleParticipantDto],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ScheduleParticipantDto)
    participants?: ScheduleParticipantDto[];

    @ApiProperty({
        description: '일정 참조자(내 캘린더 참조로만 연결되는 직원)',
        type: [ScheduleParticipantDto],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ScheduleParticipantDto)
    referenceParticipants?: ScheduleParticipantDto[];

    @ApiProperty({
        description: '프로젝트 선택',
        type: ProjectSelectionDto,
        required: false,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => ProjectSelectionDto)
    projectSelection?: ProjectSelectionDto;

    @ApiProperty({
        description: '자원 선택',
        type: ResourceSelectionDto,
        required: false,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => ResourceSelectionDto)
    resourceSelection?: ResourceSelectionDto;

    @ApiProperty({
        description: '부서 ID 목록 (여러 부서 선택 가능)',
        example: ['uuid-string-1', 'uuid-string-2'],
        required: false,
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    departmentIds?: string[];
}

/**
 * 다중 일정 생성 요청 DTO (배열)
 */
export class ScheduleCreateRequestListDto {
    @ApiProperty({
        description: '일정 생성 요청 목록',
        type: [ScheduleCreateRequestDto],
        example: [
            {
                datesSelection: [
                    {
                        startDate: new Date('2025-09-05T01:00:00Z').toISOString(),
                        endDate: new Date('2025-09-05T02:00:00Z').toISOString(),
                    },
                ],
                title: '첫 번째 일정',
                description: '첫 번째 일정 설명',
                location: '회의실 A',
                notifyBeforeStart: true,
                notificationMinutes: [10],
                scheduleType: ScheduleType.DEPARTMENT,
                departmentIds: ['uuid-string-1', 'uuid-string-2'],
                participants: [
                    {
                        employeeId: 'uuid-string',
                    },
                ],
            },
            {
                datesSelection: [
                    {
                        startDate: new Date('2025-09-06T01:00:00Z').toISOString(),
                        endDate: new Date('2025-09-06T02:00:00Z').toISOString(),
                    },
                ],
                title: '두 번째 일정',
                description: '두 번째 일정 설명',
                location: '회의실 B',
                notifyBeforeStart: true,
                notificationMinutes: [5],
                scheduleType: ScheduleType.PERSONAL,
                departmentIds: ['uuid-string-1', 'uuid-string-2'],
                participants: [
                    {
                        employeeId: 'uuid-string',
                    },
                ],
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ScheduleCreateRequestDto)
    schedules: ScheduleCreateRequestDto[];
}
