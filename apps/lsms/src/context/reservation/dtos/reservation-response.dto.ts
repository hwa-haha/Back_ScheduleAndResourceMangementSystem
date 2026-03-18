import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { ReservationStatus } from '../../../../libs/enums/reservation-type.enum';
import { Reservation } from '../../../domain/reservation/reservation.entity';
import { ParticipantsType } from '../../../../libs/enums/reservation-type.enum';
import { EmployeeResponseDto, ResourceResponseDto, ResponseNotificationDto } from '../../../business.dto.index';
import { DateUtil } from '../../../../libs/utils/date.util';

export class ReservationResponseDto {
    constructor(reservation?: Reservation) {
        this.reservationId = reservation?.reservationId;
        this.resourceId = reservation?.resourceId;
        this.title = reservation?.title;
        this.description = reservation?.description;
        this.rejectReason = reservation?.rejectReason;
        this.startDate = DateUtil.format(reservation?.startDate);
        this.endDate = DateUtil.format(reservation?.endDate);
        this.status = reservation?.status;
        this.isAllDay = reservation?.isAllDay;
        this.notifyBeforeStart = reservation?.notifyBeforeStart;
        this.notifyMinutesBeforeStart = reservation?.notifyMinutesBeforeStart;
    }

    @ApiProperty()
    reservationId: string;

    @ApiProperty({ required: false })
    resourceId?: string;

    @ApiProperty({ required: false })
    title?: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty({ required: false })
    startDate?: string;

    @ApiProperty({ required: false })
    endDate?: string;

    @ApiProperty({ required: false })
    rejectReason?: string;

    @ApiProperty({ enum: ReservationStatus, required: false })
    status?: ReservationStatus;

    @ApiProperty({ required: false })
    isAllDay?: boolean;

    @ApiProperty({ required: false })
    notifyBeforeStart?: boolean;

    @ApiProperty({ required: false, type: [Number] })
    notifyMinutesBeforeStart?: number[];

    @ApiProperty({ required: false })
    isMine?: boolean;
}

export class ReservationParticipantResponseDto {
    @ApiProperty()
    participantId: string;

    @ApiProperty()
    employeeId: string;

    @ApiProperty()
    type: string;

    @ApiProperty({ type: () => EmployeeResponseDto, required: false })
    employee?: EmployeeResponseDto;
}

export class ReservationVehicleResponseDto {
    @ApiProperty()
    reservationVehicleId: string;

    @ApiProperty()
    vehicleInfoId: string;

    @ApiProperty()
    startOdometer: number;

    @ApiProperty()
    endOdometer: number;

    @ApiProperty()
    startFuelLevel: number;

    @ApiProperty()
    endFuelLevel: number;

    @ApiProperty()
    isReturned: boolean;

    @ApiProperty()
    returnedAt: Date;
}

export class ReservationWithResourceResponseDto extends ReservationResponseDto {
    constructor(reservation?: Reservation) {
        super(reservation);
        this.resource = reservation?.resource as any;
    }

    @ApiProperty({ type: () => ResourceResponseDto, required: false })
    resource?: ResourceResponseDto;
}

export class ReservationWithRelationsResponseDto extends ReservationResponseDto {
    constructor(reservation?: Reservation) {
        super(reservation);
        this.resource = reservation?.resource as any;
        this.reservers = reservation?.participants?.filter(
            (participant) => participant.type === ParticipantsType.RESERVER,
        ) as any;
        this.participants = reservation?.participants?.filter(
            (participant) => participant.type === ParticipantsType.PARTICIPANT,
        ) as any;
        this.reservationVehicles = reservation?.reservationVehicles;
    }

    @ApiProperty({ type: () => ResourceResponseDto, required: false })
    resource?: ResourceResponseDto;

    @ApiProperty({ type: [ReservationParticipantResponseDto], required: false })
    reservers?: ReservationParticipantResponseDto[];

    @ApiProperty({ type: [ReservationParticipantResponseDto], required: false })
    participants?: ReservationParticipantResponseDto[];

    @ApiProperty({ type: [ReservationVehicleResponseDto], required: false })
    reservationVehicles?: ReservationVehicleResponseDto[];

    @ApiProperty({ type: [ResponseNotificationDto], required: false })
    notifications?: ResponseNotificationDto[];

    @ApiProperty({ required: false })
    isMine?: boolean;

    @ApiProperty({ required: false })
    returnable?: boolean;

    @ApiProperty({ required: false })
    isDelayed?: boolean;

    @ApiProperty({ required: false })
    modifiable?: boolean;

    @ApiProperty({ required: false })
    hasUnreadNotification?: boolean;
}

export class CreateReservationResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    reservationId: string;
}

export class GroupedReservationResponseDto {
    @ApiProperty({ description: '날짜 (YYYY-MM-DD 형식)' })
    date: string;

    @ApiProperty({
        description: '해당 날짜의 예약 목록',
        type: [ReservationWithRelationsResponseDto],
    })
    reservations: ReservationWithRelationsResponseDto[];
}

export class GroupedReservationWithResourceResponseDto {
    @ApiProperty({
        description: '자원 정보',
        type: () => ResourceResponseDto,
    })
    resource: ResourceResponseDto;

    @ApiProperty({
        description: '예약 목록',
        required: false,
        type: [GroupedReservationResponseDto],
    })
    groupedReservations?: GroupedReservationResponseDto[];
}

export class CalendarResponseDto {
    @ApiProperty({
        description: '예약 캘린더',
        type: [ReservationWithRelationsResponseDto],
    })
    reservations: ReservationWithRelationsResponseDto[];
}
