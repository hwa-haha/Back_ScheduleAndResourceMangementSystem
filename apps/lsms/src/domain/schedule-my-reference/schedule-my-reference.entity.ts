import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Schedule } from '../schedule/schedule.entity';
import { Employee } from '@libs/modules/employee/employee.entity';

/**
 * 직원이 일정을 "내 일정(참조)"에 넣어 두었는지 여부.
 * 예약자·참석자(schedule_participants)와 별도로, 개인 관심 일정만 관리한다.
 */
@Entity('schedule_my_references')
@Unique('UQ_schedule_my_references_employee_schedule', ['employeeId', 'scheduleId'])
export class ScheduleMyReference {
    @PrimaryGeneratedColumn('uuid')
    scheduleMyReferenceId: string;

    @Column({ type: 'uuid' })
    employeeId: string;

    @Column({ type: 'uuid' })
    scheduleId: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @ManyToOne(() => Schedule, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'scheduleId' })
    schedule: Schedule;

    @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;
}
