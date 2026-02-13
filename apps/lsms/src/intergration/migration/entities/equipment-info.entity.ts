import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Resource } from './resource.entity';

@Entity('equipment_infos')
export class EquipmentInfo {
    @PrimaryGeneratedColumn('uuid')
    equipmentInfoId: string;

    @Column()
    resourceId: string;

    @OneToOne(() => Resource, (resource) => resource.equipmentInfo)
    @JoinColumn({ name: 'resourceId' })
    resource: Resource;
}
