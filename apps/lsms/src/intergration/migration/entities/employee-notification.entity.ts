import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { Notification } from './notification.entity';

@Entity('employee_notifications')
export class EmployeeNotification {
    @PrimaryColumn('uuid', {
        generated: 'uuid',
    })
    employeeNotificationId: string;

    @Column()
    employeeId: string;

    @Column()
    notificationId: string;

    @Column({ default: false })
    isRead: boolean;

    @ManyToOne(() => Notification)
    @JoinColumn({ name: 'notificationId' })
    notification: Notification;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;
}
