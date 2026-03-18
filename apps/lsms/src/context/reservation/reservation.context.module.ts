import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../../domain/reservation/reservation.entity';
import { ReservationParticipant } from '../../domain/reservation-participant/reservation-participant.entity';
import { Employee } from '@libs/modules/employee/employee.entity';
import { Resource } from '../../domain/resource/resource.entity';
import { ReservationVehicle } from '../../domain/reservation-vehicle/reservation-vehicle.entity';

// Domain Modules
import { DomainReservationModule } from '../../domain/reservation/reservation.module';
import { DomainReservationParticipantModule } from '../../domain/reservation-participant/reservation-participant.module';
import { DomainEmployeeModule } from '@libs/modules/employee/employee.module';
import { DomainResourceModule } from '../../domain/resource/resource.module';
import { DomainNotificationModule } from '../../domain/notification/notification.module';
import { DomainEmployeeNotificationModule } from '../../domain/employee-notification/employee-notification.module';
import { DomainReservationVehicleModule } from '../../domain/reservation-vehicle/reservation-vehicle.module';
import { DomainVehicleInfoModule } from '../../domain/vehicle-info/vehicle-info.module';
import { DomainFileModule } from '../../domain/file/file.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FileContextModule } from '../file/file.context.module';
import { DomainScheduleModule } from '../../domain/schedule/schedule.module';

// Context Services
import { ReservationContextService } from './services/reservation.context.service';
import { DomainScheduleParticipantModule } from '../../domain/schedule-participant/schedule-participant.module';

/**
 * 예약 관리 컨텍스트 모듈
 *
 * 이 모듈은 예약 관리에 관련된 모든 비즈니스 로직을 포함합니다:
 * - 예약 생성, 수정, 취소
 * - 예약 충돌 검증 (동일 시간대 중복 불가)
 * - 예약 일정 조회 및 관리
 * - 예약자 관리 (Employee ID 참조)
 *
 * 특징:
 * - 자원의 세부 정보는 포함하지 않고 식별자만 활용
 * - 예약(Reservation) 도메인에 집중
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([Reservation, ReservationParticipant, Employee, Resource, ReservationVehicle]),
        // Domain Layer Modules
        DomainReservationModule,
        DomainReservationParticipantModule,
        DomainEmployeeModule,
        DomainResourceModule,
        DomainNotificationModule,
        DomainEmployeeNotificationModule,
        DomainReservationVehicleModule,
        DomainVehicleInfoModule,
        DomainFileModule,
        DomainScheduleModule,
        DomainScheduleParticipantModule,
        // Context Layer Modules
        FileContextModule,
        // NotificationModule,
        ScheduleModule.forRoot(),
    ],
    controllers: [],
    providers: [
        // Context Services

        ReservationContextService,
    ],
    exports: [
        // Context Services
        ReservationContextService,
    ],
})
export class ReservationContextModule {}
