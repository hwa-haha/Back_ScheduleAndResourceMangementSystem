import { ApiProperty } from '@nestjs/swagger';
import { ParticipantsType } from '../../../../libs/enums/reservation-type.enum';
import { StatisticsItemDto } from './my-schedule-statistics-response.dto';

export class MyScheduleResourceDto {
    @ApiProperty({
        description: '자원 ID',
        example: 'uuid-string',
    })
    resourceId: string;

    @ApiProperty({
        description: '자원 이름',
        example: '회의실 A',
    })
    resourceName: string;

    @ApiProperty({
        description: '자원 타입',
        example: 'MEETING_ROOM',
    })
    resourceType: string;
}

export class MyScheduleProjectDto {
    @ApiProperty({
        description: '프로젝트 ID',
        example: 'uuid-string',
    })
    projectId: string;

    @ApiProperty({
        description: '프로젝트 이름',
        example: '신규 시스템 개발',
    })
    projectName: string;
}

export class MyScheduleItemDto {
    @ApiProperty({
        description: '일정 ID',
        example: 'uuid-string',
    })
    scheduleId: string;

    @ApiProperty({
        description: '일정 제목',
        example: '주간 프로젝트 회의',
    })
    title: string;

    @ApiProperty({
        description: '일정 설명',
        required: false,
        example: '주간 진행사항 점검 및 이슈 논의',
    })
    description?: string;

    @ApiProperty({
        description: '시작 날짜 및 시간',
        example: '2024-01-15T09:00:00Z',
    })
    startDate: Date;

    @ApiProperty({
        description: '종료 날짜 및 시간',
        example: '2024-01-15T10:00:00Z',
    })
    endDate: Date;

    @ApiProperty({
        description: '일정 유형',
        example: '프로젝트',
        enum: ['일정', '프로젝트', '자원'],
    })
    scheduleType: string;

    @ApiProperty({
        description: '일정 담당 부서',
        example: '영업팀',
        required: false,
    })
    scheduleDepartment?: string;

    @ApiProperty({
        description: '관련 프로젝트 정보',
        type: MyScheduleProjectDto,
        required: false,
    })
    project?: MyScheduleProjectDto;

    @ApiProperty({
        description: '관련 자원 정보',
        type: MyScheduleResourceDto,
        required: false,
    })
    resource?: MyScheduleResourceDto;

    @ApiProperty({
        description:
            '예약자·참석자가 아닌 상태에서, 내 일정(참조)로만 이 항목이 목록에 포함된 경우 true (참석·예약과 겹치면 false)',
        example: false,
    })
    isIncludedAsMyScheduleReference: boolean;
}

export class MyScheduleResponseDto {
    @ApiProperty({
        description: '통계 정보 (검색/페이지네이션과 무관한 전체 통계)',
        type: [StatisticsItemDto],
    })
    statistics: StatisticsItemDto[];

    @ApiProperty({
        description: '전체 일정 개수 (필터링 후, 검색 전)',
        example: 45,
    })
    totalCount: number;

    @ApiProperty({
        description: '검색 결과 개수',
        example: 25,
    })
    filteredCount: number;

    @ApiProperty({
        description: '현재 페이지',
        example: 1,
    })
    currentPage: number;

    @ApiProperty({
        description: '페이지당 항목 수',
        example: 20,
    })
    pageSize: number;

    @ApiProperty({
        description: '총 페이지 수',
        example: 3,
    })
    totalPages: number;

    @ApiProperty({
        description: '다음 페이지 존재 여부',
        example: true,
    })
    hasNext: boolean;

    @ApiProperty({
        description: '이전 페이지 존재 여부',
        example: false,
    })
    hasPrevious: boolean;

    @ApiProperty({
        description: '일정 목록 (페이지네이션 적용됨)',
        type: [MyScheduleItemDto],
    })
    schedules: MyScheduleItemDto[];
}
