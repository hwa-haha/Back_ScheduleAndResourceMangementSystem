import { PrimaryColumn, Column, OneToMany, Entity } from 'typeorm';
import { EmployeeNotification } from './employee-notification.entity';
import { NotificationType } from '../../../../libs/enums/notification-type.enum';
import { ResourceType } from '../../../../libs/enums/resource-type.enum';
import { ReservationStatus } from '../../../../libs/enums/reservation-type.enum';

/**
 * 알림 데이터 인터페이스
 * - 기존 flat 구조 (하위 호환성 유지)
 * - 새로운 nested 구조 (향상된 타입 안전성)
 */
export interface NotificationData {
    // ==================== 기존 Flat 구조 (하위 호환성 유지) ====================
    reservationId?: string;
    reservationTitle?: string;
    reservationDate?: string;
    beforeMinutes?: number;
    resourceId?: string;
    resourceName?: string;
    resourceType?: ResourceType;
    consumableName?: string;
    scheduleId?: string;
    scheduleTitle?: string;
    startDate?: string;
    endDate?: string;
    projectId?: string;
    projectName?: string;
    status?: ReservationStatus;

    // ==================== 새로운 Nested 구조 (타입 안전성 향상) ====================
    schedule?: {
        scheduleId: string;
        scheduleTitle?: string;
        beforeMinutes?: number;
        startDate?: string;
        endDate?: string;
    };
    reservation?: {
        reservationId: string;
        reservationTitle?: string;
        reservationDate?: string;
        status?: ReservationStatus;
    };
    resource?: {
        resourceId: string;
        resourceName?: string;
        resourceType?: ResourceType;
        vehicleInfo?: {
            consumable?: {
                consumableId: string;
                consumableName?: string;
            };
        };
    };
    project?: {
        projectId: string;
        projectName?: string;
    };
}

@Entity('notifications')
export class Notification {
    @PrimaryColumn('uuid', {
        generated: 'uuid',
    })
    notificationId: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    body: string;

    @Column({
        type: 'enum',
        enum: NotificationType,
        nullable: true,
    })
    notificationType: NotificationType;

    @Column('jsonb', { nullable: true })
    notificationData: NotificationData;

    @Column({ default: true })
    isSent: boolean;

    @Column()
    createdAt: string;

    @OneToMany(() => EmployeeNotification, (notification) => notification.notification)
    employees: EmployeeNotification[];
}
