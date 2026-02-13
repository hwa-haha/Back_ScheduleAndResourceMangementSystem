import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, Exclusion } from 'typeorm';
import { Resource } from './resource.entity';
import { ReservationParticipant } from './reservation-participant.entity';
import { ReservationStatus } from '../../../../libs/enums/reservation-type.enum';
import { ReservationVehicle } from './reservation-vehicle.entity';
import { ScheduleRelation } from './schedule-relations.entity';

@Entity('reservations')
export class Reservation {
    @PrimaryColumn('uuid', {
        generated: 'uuid',
    })
    reservationId: string;

    @Column()
    resourceId: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'timestamp with time zone' })
    startDate: Date;

    @Column({ type: 'timestamp with time zone' })
    endDate: Date;

    @Column({
        type: 'enum',
        enum: ReservationStatus,
    })
    status: ReservationStatus;

    @Column({ nullable: true })
    rejectReason: string;

    @Column({ default: false })
    isAllDay: boolean;

    @Column({ default: false })
    notifyBeforeStart: boolean;

    @Column('jsonb', { nullable: true })
    notifyMinutesBeforeStart: number[];

    @ManyToOne(() => Resource)
    @JoinColumn({ name: 'resourceId' })
    resource: Resource;

    @OneToMany(() => ReservationParticipant, (participant) => participant.reservation)
    participants: ReservationParticipant[];

    @OneToMany(() => ReservationVehicle, (reservationVehicle) => reservationVehicle.reservation)
    reservationVehicles: ReservationVehicle[];

    @OneToMany(() => ScheduleRelation, (relation) => relation.reservation)
    scheduleRelations: ScheduleRelation[];
}
