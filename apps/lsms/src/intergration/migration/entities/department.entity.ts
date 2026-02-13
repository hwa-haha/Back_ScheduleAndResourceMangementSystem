import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { DepartmentEmployee } from './department-employee.entity';

@Entity('departments')
export class Department {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: '부서명' })
    departmentName: string;

    @Column({ unique: true, comment: '부서 코드' })
    departmentCode: string;

    @Column({ comment: '유형' })
    type: string;

    @Column({ comment: '상위 부서 ID', type: 'uuid', nullable: true })
    parentDepartmentId?: string;

    @Column({ comment: '정렬 순서', default: 0 })
    order: number;

    // 부서장 관계는 별도 이력 테이블로 관리
    // 부서 계층 구조는 유지 (조직도 표현을 위해)
    @ManyToOne(() => Department, (department) => department.childDepartments, { nullable: true })
    @JoinColumn({ name: 'parentDepartmentId' })
    parentDepartment?: Department;

    @OneToMany(() => Department, (department) => department.parentDepartment)
    childDepartments: Department[];

    @OneToMany(() => DepartmentEmployee, (departmentEmployee) => departmentEmployee.department)
    departmentEmployees: DepartmentEmployee[];

    @CreateDateColumn({ comment: '생성일' })
    createdAt: Date;

    @UpdateDateColumn({ comment: '수정일' })
    updatedAt: Date;
}
