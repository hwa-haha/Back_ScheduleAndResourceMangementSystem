import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Reservation } from './reservation.entity';
import { Employee } from './employee.entity';
import { ParticipantsType } from '../../../../libs/enums/reservation-type.enum';

@Entity('reservation_participants')
export class ReservationParticipant {
    @PrimaryColumn('uuid', {
        generated: 'uuid',
    })
    participantId: string;

    @Column()
    reservationId: string;

    @Column()
    employeeId: string;

    @Column({
        type: 'enum',
        enum: ParticipantsType,
    })
    type: ParticipantsType;

    @ManyToOne(() => Reservation)
    @JoinColumn({ name: 'reservationId' })
    reservation: Reservation;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;
}
