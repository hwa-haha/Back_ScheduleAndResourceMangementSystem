import { Entity, PrimaryColumn, Column, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { EmployeeNotification } from './employee-notification.entity';
import { ReservationParticipant } from './reservation-participant.entity';
import { ResourceManager } from './resource-manager.entity';
import { Role } from '../../../../libs/enums/role-type.enum';
import { PushSubscriptionDto } from '../../../business.dto.index';
import { DepartmentEmployee } from './department-employee.entity';

@Entity('employees')
export class Employee {
    @PrimaryColumn('uuid', {
        generated: 'uuid',
    })
    employeeId: string;

    @Column()
    name: string;

    @Column()
    employeeNumber: string;

    @Column()
    department: string;

    @Column({ comment: '직급 (레거시, rank와 동일한 값)' })
    position: string;

    @Column({ nullable: true, comment: '직급' })
    rank: string;

    @Column({ nullable: true, comment: '직위' })
    positionTitle: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    mobile: string;

    @Column({ nullable: true })
    password: string;

    @Column({ nullable: true })
    accessToken: string;

    @Column({ nullable: true })
    expiredAt: string;

    @Column({ type: 'jsonb', nullable: true, comment: '웹푸시 알림 관련 구독 정보 배열' })
    subscriptions: PushSubscriptionDto[];

    @Column({ default: true, comment: '웹푸시 알림 설정 여부' })
    isPushNotificationEnabled: boolean;

    @Column({ type: 'enum', enum: Role, array: true, default: [Role.USER], comment: '사용자 역할' })
    roles: Role[];

    @Column({ nullable: true, comment: '직원 상태 (재직중, 퇴사)' })
    status: string;

    @Column({ default: false, comment: '필터링 조건에서 숨기기 여부' })
    isHiddenInFilter: boolean;

    @OneToMany(() => ReservationParticipant, (participant) => participant.employee)
    participants: ReservationParticipant[];

    @OneToMany(() => EmployeeNotification, (notification) => notification.employee)
    notifications: EmployeeNotification[];

    @OneToMany(() => ResourceManager, (resourceManager) => resourceManager.employee)
    resourceManagers: ResourceManager[];

    @OneToMany(() => DepartmentEmployee, (departmentEmployee) => departmentEmployee.employee)
    departmentEmployees: DepartmentEmployee[];
}
