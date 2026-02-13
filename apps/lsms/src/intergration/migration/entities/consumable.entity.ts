import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, DeleteDateColumn } from 'typeorm';
import { VehicleInfo } from './vehicle-info.entity';
import { Maintenance } from './maintenance.entity';

@Entity('consumables')
export class Consumable {
    @PrimaryColumn('uuid', {
        generated: 'uuid',
    })
    consumableId: string;

    @Column()
    vehicleInfoId: string;

    @Column()
    name: string;

    @Column({ default: 0 })
    replaceCycle: number;

    @Column({ default: true })
    notifyReplacementCycle: boolean;

    @Column({ default: 0 })
    initMileage: number;

    @DeleteDateColumn()
    deletedAt: Date;

    @ManyToOne(() => VehicleInfo)
    @JoinColumn({ name: 'vehicleInfoId', referencedColumnName: 'vehicleInfoId' })
    vehicleInfo: VehicleInfo;

    @OneToMany(() => Maintenance, (maintenance) => maintenance.consumable)
    maintenances: Maintenance[];
}
