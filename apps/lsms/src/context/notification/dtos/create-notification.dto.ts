import { NotificationData } from '../../../domain/notification/notification.entity';
import { NotificationType } from '../../../../libs/enums/notification-type.enum';
import { ReservationStatus } from '../../../../libs/enums/reservation-type.enum';
import { ResourceType } from '../../../../libs/enums/resource-type.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, ValidateNested, IsBoolean } from 'class-validator';

// 공통 알림 데이터 DTOs (create와 response에서 공통 사용)
export class NotificationConsumableDto {
    @ApiProperty({ description: '소모품 ID' })
    @IsString()
    consumableId: string;

    @ApiProperty({ description: '소모품 이름' })
    @IsOptional()
    @IsString()
    consumableName?: string;
}

export class NotificationVehicleInfoDto {
    @ApiPropertyOptional({ type: NotificationConsumableDto, description: '소모품 정보' })
    @IsOptional()
    @ValidateNested()
    @Type(() => NotificationConsumableDto)
    consumable?: NotificationConsumableDto;
}

export class NotificationResourceDto {
    @ApiProperty({ description: '자원 ID' })
    @IsString()
    resourceId: string;

    @ApiProperty({ description: '자원 이름' })
    @IsOptional()
    @IsString()
    resourceName?: string;

    @ApiProperty({ enum: ResourceType, description: '자원 타입' })
    @IsOptional()
    @IsEnum(ResourceType)
    resourceType?: ResourceType;

    @ApiPropertyOptional({ type: NotificationVehicleInfoDto, description: '차량 정보 (차량 자원인 경우)' })
    @IsOptional()
    @ValidateNested()
    @Type(() => NotificationVehicleInfoDto)
    vehicleInfo?: NotificationVehicleInfoDto;
}

export class NotificationReservationDto {
    @ApiProperty({ description: '예약 ID' })
    @IsString()
    reservationId: string;

    @ApiProperty({ description: '예약 제목' })
    @IsOptional()
    @IsString()
    reservationTitle?: string;

    @ApiProperty({ description: '예약 날짜' })
    @IsOptional()
    @IsString()
    reservationDate?: string;

    @ApiPropertyOptional({ enum: ReservationStatus, description: '예약 상태' })
    @IsOptional()
    @IsEnum(ReservationStatus)
    status?: ReservationStatus;
}

export class NotificationScheduleDto {
    @ApiProperty({ description: '일정 ID' })
    @IsString()
    scheduleId: string;

    @ApiProperty({ description: '일정 제목' })
    @IsOptional()
    @IsString()
    scheduleTitle?: string;

    @ApiPropertyOptional({ description: '알림 전 분 수' })
    @IsOptional()
    @IsNumber()
    beforeMinutes?: number;

    @ApiProperty({ description: '시작 날짜' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiProperty({ description: '종료 날짜' })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}

export class NotificationProjectDto {
    @ApiProperty({ description: '프로젝트 ID' })
    @IsString()
    projectId: string;

    @ApiPropertyOptional({ description: '프로젝트 이름' })
    @IsOptional()
    @IsString()
    projectName?: string;
}

export class CreateNotificationDataDto implements NotificationData {
    @ApiPropertyOptional({
        type: NotificationScheduleDto,
        description: '일정 관련 정보 (일정 알림인 경우 필수)',
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => NotificationScheduleDto)
    schedule?: NotificationScheduleDto;

    @ApiPropertyOptional({
        type: NotificationReservationDto,
        description: '예약 관련 정보 (예약 알림인 경우 필수)',
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => NotificationReservationDto)
    reservation?: NotificationReservationDto;

    @ApiPropertyOptional({
        type: NotificationResourceDto,
        description: '자원 관련 정보 (자원/소모품 알림인 경우 필수)',
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => NotificationResourceDto)
    resource?: NotificationResourceDto;

    @ApiPropertyOptional({
        type: NotificationProjectDto,
        description: '프로젝트 관련 정보 (프로젝트 알림인 경우 필수)',
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => NotificationProjectDto)
    project?: NotificationProjectDto;
}

export class CreateNotificationDto {
    @ApiProperty({ description: '알림 제목' })
    @IsString()
    title: string;

    @ApiProperty({ description: '알림 내용' })
    @IsString()
    body: string;

    @ApiProperty({
        type: CreateNotificationDataDto,
        description: '알림 데이터 (타입별 필수 정보)',
    })
    @ValidateNested()
    @Type(() => CreateNotificationDataDto)
    notificationData: CreateNotificationDataDto;

    @ApiPropertyOptional({ description: '생성 시간 (YYYY-MM-DD HH:mm 형식)' })
    @IsOptional()
    @IsString()
    createdAt?: string;

    @ApiPropertyOptional({ description: '발송 여부', default: true })
    @IsOptional()
    @IsBoolean()
    isSent?: boolean;

    @ApiProperty({
        enum: NotificationType,
        description: '알림 타입',
        example: NotificationType.RESERVATION_STATUS_CONFIRMED,
    })
    @IsEnum(NotificationType)
    notificationType: NotificationType;
}

export class CreateEmployeeNotificationDto {
    @ApiProperty({ description: '직원 ID' })
    @IsString()
    employeeId: string;

    @ApiProperty({ description: '알림 ID' })
    @IsString()
    notificationId: string;

    @ApiPropertyOptional({ description: '읽음 여부', default: false })
    @IsOptional()
    @IsBoolean()
    isRead?: boolean;
}

export class SendNotificationDto {
    @ApiProperty({
        enum: NotificationType,
        description: '알림 타입',
        example: NotificationType.RESERVATION_STATUS_CONFIRMED,
    })
    @IsEnum(NotificationType)
    notificationType: NotificationType;

    @ApiProperty({
        type: CreateNotificationDataDto,
        description: '알림 데이터 (타입별 필수 정보)',
    })
    @ValidateNested()
    @Type(() => CreateNotificationDataDto)
    notificationData: CreateNotificationDataDto;

    @ApiProperty({
        type: [String],
        example: ['1256124-ef14-4124-9124-124124124124'],
        description: '알림 수신자 목록 (employeeId)',
    })
    @IsString({ each: true })
    notificationTarget: string[];

    @ApiPropertyOptional({ description: '알림 링크 URL' })
    @IsOptional()
    @IsString()
    linkUrl?: string;
}
