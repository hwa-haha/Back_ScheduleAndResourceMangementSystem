import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Schedule } from '../schedule/schedule.entity';
import { Department } from '@libs/modules/department/department.entity';

@Entity('schedule_departments')
export class ScheduleDepartment {
    @PrimaryGeneratedColumn('uuid')
    scheduleDepartmentId: string;

    @Column()
    scheduleId: string;

    @Column()
    departmentId: string;

    @CreateDateColumn()
    createdAt: Date;

    // 관계설정
    @ManyToOne(() => Schedule, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'scheduleId' })
    schedule: Schedule;

    @ManyToOne(() => Department, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'departmentId' })
    department: Department;
}
