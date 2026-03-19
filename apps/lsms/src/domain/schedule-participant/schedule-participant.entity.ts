import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ParticipantsType } from '../../../libs/enums/reservation-type.enum';
import { Schedule } from '../schedule/schedule.entity';
import { Employee } from '@libs/modules/employee/employee.entity';

@Entity('schedule_participants')
export class ScheduleParticipant {
    @PrimaryGeneratedColumn('uuid')
    participantId: string;

    @Column()
    scheduleId: string;

    @Column({ type: 'uuid', nullable: true })
    employeeId: string;

    @Column({
        type: 'enum',
        enum: ParticipantsType,
    })
    type: ParticipantsType;

    @ManyToOne(() => Schedule)
    @JoinColumn({ name: 'scheduleId' })
    schedule: Schedule;

    @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;
}
