import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Department } from './department.entity';
import { Employee } from './employee.entity';

@Entity('department_employees')
export class DepartmentEmployee {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: '부서 ID', type: 'uuid' })
    departmentId: string;

    @Column({ comment: '직원 ID', type: 'uuid' })
    employeeId: string;

    @Column({ comment: '부서장 여부', default: false })
    isManager: boolean;

    @Column({ comment: '소속 시작일', type: 'date' })
    startDate: Date;

    @Column({ comment: '소속 종료일', type: 'date', nullable: true })
    endDate?: Date;

    @Column({ comment: '활성 상태', default: true })
    isActive: boolean;

    @ManyToOne(() => Department, { nullable: false })
    @JoinColumn({ name: 'departmentId' })
    department: Department;

    @ManyToOne(() => Employee, { nullable: false })
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    @CreateDateColumn({ comment: '생성일' })
    createdAt: Date;

    @UpdateDateColumn({ comment: '수정일' })
    updatedAt: Date;
}
