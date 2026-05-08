import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ScheduleStatus, ScheduleType } from '../../../../libs/enums/schedule-type.enum';
import { ResourceType } from '../../../../libs/enums/resource-type.enum';
import { ReservationStatus, ParticipantsType } from '../../../../libs/enums/reservation-type.enum';
import { VehicleInfoResponseDto } from '../../resource-management/dtos/vehicle/vehicle-response.dto';
import { MeetingRoomInfoResponseDto } from '../../../business.dto.index';
import { AccommodationInfoResponseDto } from '../../../business.dto.index';
import { EquipmentInfoResponseDto } from '../../../business.dto.index';
import { File } from '../../../domain/file/file.entity';
import { Resource } from '../../../domain/resource/resource.entity';
import { Reservation } from '../../../domain/reservation/reservation.entity';
import {
    ProjectInfo,
    ScheduleParticipantsWithEmployee,
} from '../../../context/schedule/services/schedule-query.context.service';

export class ScheduleDetailProjectDto {
    @ApiProperty({
        description: '프로젝트 ID',
        example: 'uuid-string',
    })
    projectId: string;

    @ApiProperty({
        description: '프로젝트 이름 (추후 프로젝트 테이블 구현 시 실제 데이터로 대체)',
        example: '신규 시스템 개발',
    })
    projectName: string;

    /**
     * 프로젝트 상세 DTO 생성
     */
    static fromProject(project: ProjectInfo): ScheduleDetailProjectDto {
        const dto = new ScheduleDetailProjectDto();
        dto.projectId = project.projectId;
        dto.projectName = project.projectName;
        return dto;
    }
}

export class ScheduleDetailDepartmentDto {
    @ApiProperty({
        description: '부서 ID',
        example: 'uuid-string',
    })
    id: string;

    @ApiProperty({
        description: '부서 이름',
        example: '개발팀',
    })
    departmentName: string;

    /**
     * 부서 상세 DTO 생성
     */
    static fromDepartment(department: { id: string; departmentName: string }): ScheduleDetailDepartmentDto {
        const dto = new ScheduleDetailDepartmentDto();
        dto.id = department.id;
        dto.departmentName = department.departmentName;
        return dto;
    }
}

export class ScheduleDetailParticipantDto {
    @ApiProperty({
        description: '참가자 ID',
        example: 'uuid-string',
    })
    participantId: string;

    @ApiProperty({
        description: '직원 ID',
        example: 'uuid-string',
    })
    employeeId: string;

    @ApiProperty({
        description: '직원 이름',
        example: '김철수',
    })
    employeeName: string;

    @ApiProperty({
        description: '참가자 유형 (예약자/참석자)',
        example: 'RESERVER',
    })
    participantType: string;

    /**
     * 참가자 DTO 생성
     */
    static fromParticipantWithEmployee(
        participantWithEmployee: ScheduleParticipantsWithEmployee,
    ): ScheduleDetailParticipantDto {
        const dto = new ScheduleDetailParticipantDto();
        dto.participantId = participantWithEmployee.participantId;
        dto.employeeId = participantWithEmployee.employeeId;
        dto.employeeName = participantWithEmployee.employee?.name || '';
        dto.participantType = participantWithEmployee.type;
        return dto;
    }

    /**
     * 참가자 배열을 DTO 배열로 변환
     */
    static fromParticipantsArray(participants: ScheduleParticipantsWithEmployee[]): ScheduleDetailParticipantDto[] {
        return participants.map((p) => this.fromParticipantWithEmployee(p));
    }
}

export class ScheduleDetailResourceDto {
    @ApiProperty({
        description: '자원 ID',
        example: 'uuid-string',
    })
    resourceId: string;

    @ApiProperty({
        description: '자원 이름',
        example: '회의실 A',
    })
    name: string;

    @ApiProperty({
        description: '자원 타입',
        enum: ResourceType,
        example: ResourceType.MEETING_ROOM,
    })
    type: ResourceType;

    @ApiProperty({
        description: '자원 설명',
        required: false,
        example: '대형 회의실, 프로젝터 완비',
    })
    description?: string;

    @ApiProperty({
        description: '자원 이미지',
        isArray: true,
        required: false,
        type: [String],
    })
    images?: string[];

    @ApiProperty({
        description: '자원 위치 정보',
        required: false,
        type: 'object',
    })
    location?: {
        address?: string;
        floor?: string;
        room?: string;
        longitude?: number;
        latitude?: number;
    };

    @ApiProperty({
        description: '자원 타입별 상세 정보',
        required: false,
        oneOf: [
            { $ref: getSchemaPath(VehicleInfoResponseDto) },
            { $ref: getSchemaPath(MeetingRoomInfoResponseDto) },
            { $ref: getSchemaPath(AccommodationInfoResponseDto) },
            { $ref: getSchemaPath(EquipmentInfoResponseDto) },
        ],
    })
    typeInfo?:
        | (VehicleInfoResponseDto & {
              files?: {
                  parkingLocationImages: File[];
                  odometerImages: File[];
                  indoorImages: File[];
              };
          })
        | MeetingRoomInfoResponseDto
        | AccommodationInfoResponseDto
        | EquipmentInfoResponseDto;

    /**
     * 자원 상세 DTO 생성
     */
    static fromResourceAndTypeInfo(resource: Resource, typeInfo: any): ScheduleDetailResourceDto {
        const dto = new ScheduleDetailResourceDto();
        dto.resourceId = resource.resourceId;
        dto.name = resource.name;
        dto.type = resource.type;
        dto.images = resource.images;
        dto.description = resource.description;
        dto.location = resource.location;
        dto.typeInfo = typeInfo;
        return dto;
    }
}

export class ScheduleDetailReservationDto {
    @ApiProperty({
        description: '예약 ID',
        example: 'uuid-string',
    })
    reservationId: string;

    @ApiProperty({
        description: '예약 제목',
        example: '회의실 A 예약',
    })
    title: string;

    @ApiProperty({
        description: '예약 설명',
        required: false,
        example: '주간 회의를 위한 예약',
    })
    description?: string;

    @ApiProperty({
        description: '예약 상태',
        enum: ReservationStatus,
        example: ReservationStatus.CONFIRMED,
    })
    status: ReservationStatus;

    @ApiProperty({
        description: '자원 정보',
        type: ScheduleDetailResourceDto,
    })
    resource: ScheduleDetailResourceDto;

    /**
     * 예약 상세 DTO 생성
     */
    static fromReservationAndResource(
        reservation: Reservation,
        resource: Resource,
        typeInfo: any,
    ): ScheduleDetailReservationDto {
        const dto = new ScheduleDetailReservationDto();
        dto.reservationId = reservation.reservationId;
        dto.title = reservation.title;
        dto.description = reservation.description;
        dto.status = reservation.status;
        dto.resource = ScheduleDetailResourceDto.fromResourceAndTypeInfo(resource, typeInfo);
        return dto;
    }
}

export class ScheduleDetailResponseDto {
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
        enum: ScheduleType,
        example: ScheduleType.COMPANY,
    })
    scheduleType: ScheduleType;

    @ApiProperty({
        description: '일정 담당 부서',
        example: '영업팀',
        required: false,
    })
    scheduleDepartment?: string;

    @ApiProperty({
        description: '일정 위치',
        example: '서울시 종로구 회의실 A',
        required: false,
    })
    location?: string;

    @ApiProperty({
        description: '일정 상태',
        enum: ScheduleStatus,
        example: ScheduleStatus.PROCESSING,
    })
    status: ScheduleStatus;

    @ApiProperty({
        description: '시작 전 알림 여부',
        example: true,
    })
    notifyBeforeStart: boolean;

    @ApiProperty({
        description: '시작 전 알림 시점 (분 단위)',
        type: [Number],
        required: false,
        example: [10, 30],
    })
    notifyMinutesBeforeStart?: number[];

    @ApiProperty({
        description: '일정 소유자 여부',
        example: true,
        required: false,
    })
    isMine?: boolean;

    @ApiProperty({
        description: '예약자 정보',
        type: ScheduleDetailParticipantDto,
        required: false,
    })
    reserver?: ScheduleDetailParticipantDto;

    @ApiProperty({
        description: '참가자 목록 (예약자 제외)',
        type: [ScheduleDetailParticipantDto],
    })
    participants: ScheduleDetailParticipantDto[];

    @ApiProperty({
        description: '관련 프로젝트 정보 (옵션)',
        type: ScheduleDetailProjectDto,
        required: false,
    })
    project?: ScheduleDetailProjectDto;

    @ApiProperty({
        description: '관련 부서 정보 목록 (옵션)',
        type: [ScheduleDetailDepartmentDto],
        required: false,
    })
    departments?: ScheduleDetailDepartmentDto[];

    @ApiProperty({
        description: '관련 자원예약 정보 (옵션)',
        type: ScheduleDetailReservationDto,
        required: false,
    })
    reservation?: ScheduleDetailReservationDto;

    @ApiProperty({
        description:
            '「내 일정에 표시(참조)」 영역 전체 표시 여부. 예약자·참석자이거나, 부서 일정이면서 일정에 연결된 부서 중 직원 EDP 부서와 겹치면 false (내 일정에 이미 소속으로 포함).',
        example: true,
    })
    showMyScheduleReferenceControl: boolean;

    @ApiProperty({
        description:
            '내 일정(참조)에 포함됨. showMyScheduleReferenceControl이 true일 때만 의미가 있으며, false인 경우 항상 false.',
        example: false,
    })
    myScheduleReferenceIncluded: boolean;
}
