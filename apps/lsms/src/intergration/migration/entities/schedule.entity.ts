import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToMany,
} from 'typeorm';
import { ScheduleParticipant } from './schedule-participant.entity';
import { ScheduleRelation } from './schedule-relations.entity';
import { ScheduleType, ScheduleStatus } from '../../../../libs/enums/schedule-type.enum';
import { ScheduleDepartment } from './schedule-department.entity';

@Entity('schedules')
export class Schedule {
    @PrimaryGeneratedColumn('uuid')
    scheduleId: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    location: string;

    @Column({ type: 'timestamp with time zone' })
    startDate: Date;

    @Column({ type: 'timestamp with time zone' })
    endDate: Date;

    @Column({ default: false })
    notifyBeforeStart: boolean;

    @Column('jsonb', { nullable: true })
    notifyMinutesBeforeStart: number[];

    @Column({
        type: 'enum',
        enum: ScheduleType,
        default: ScheduleType.PERSONAL,
        comment: '일정 유형 (회사전체/부서/개인)',
    })
    scheduleType: ScheduleType;

    @Column({ nullable: true, comment: '일정 담당 부서' })
    scheduleDepartment: string;

    @Column({
        type: 'enum',
        enum: ScheduleStatus,
        default: ScheduleStatus.PENDING,
        comment: '일정 상태 (대기/진행중/완료/취소)',
    })
    status: ScheduleStatus;

    @Column({ nullable: true, comment: '완료 사유' })
    completionReason: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp with time zone' })
    deletedAt: Date;

    @OneToMany(() => ScheduleParticipant, (participant) => participant.schedule)
    participants: ScheduleParticipant[];

    @OneToMany(() => ScheduleRelation, (relation) => relation.schedule)
    relations: ScheduleRelation[];

    @OneToMany(() => ScheduleDepartment, (department) => department.schedule)
    departments: ScheduleDepartment[];
}
