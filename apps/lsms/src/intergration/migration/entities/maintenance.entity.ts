import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Consumable } from './consumable.entity';

@Entity('maintenances')
export class Maintenance {
    @PrimaryColumn('uuid', {
        generated: 'uuid',
    })
    maintenanceId: string;

    @Column()
    consumableId: string;

    @Column()
    date: string;

    @Column({ default: 0 })
    mileage: number;

    @Column({ default: 0 })
    cost: number;

    @Column({ type: 'json', nullable: true, comment: '정비사진 배열' })
    images: string[];

    @Column({ nullable: true })
    maintananceBy: string;

    @CreateDateColumn({ type: 'timestamp with time zone' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp with time zone' })
    updatedAt: Date;

    @ManyToOne(() => Consumable)
    @JoinColumn({ name: 'consumableId' })
    consumable: Consumable;
}
