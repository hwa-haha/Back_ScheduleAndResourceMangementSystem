import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Schedule } from './schedule.entity';
import { Reservation } from './reservation.entity';

@Entity('schedule_relations')
export class ScheduleRelation {
    @PrimaryGeneratedColumn('uuid')
    scheduleRelationId: string;

    @Column()
    scheduleId: string;

    @Column({ nullable: true })
    reservationId: string;

    @Column({ nullable: true })
    projectId: string;

    // 관계설정
    @ManyToOne(() => Schedule, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'scheduleId' })
    schedule: Schedule;

    @ManyToOne(() => Reservation, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reservationId' })
    reservation: Reservation;
}
