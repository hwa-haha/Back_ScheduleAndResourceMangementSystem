import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { Employee } from './employee.entity';
import { Resource } from './resource.entity';

@Entity('resource_managers')
export class ResourceManager {
    @PrimaryColumn('uuid', {
        generated: 'uuid', // UUID 자동 생성
    })
    resourceManagerId: string;

    @Column()
    employeeId: string;

    @Column()
    resourceId: string;

    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employeeId' })
    employee: Employee;

    @ManyToOne(() => Resource)
    @JoinColumn({ name: 'resourceId' })
    resource: Resource;
}
