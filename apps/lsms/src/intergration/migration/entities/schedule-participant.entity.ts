import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ParticipantsType } from '../../../../libs/enums/reservation-type.enum';
import { Schedule } from './schedule.entity';

@Entity('schedule_participants')
export class ScheduleParticipant {
    @PrimaryGeneratedColumn('uuid')
    participantId: string;

    @Column()
    scheduleId: string;

    @Column()
    employeeId: string;

    @Column({
        type: 'enum',
        enum: ParticipantsType,
    })
    type: ParticipantsType;

    @ManyToOne(() => Schedule)
    @JoinColumn({ name: 'scheduleId' })
    schedule: Schedule;
}
