import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { Resource } from './resource.entity';
import { Consumable } from './consumable.entity';

@Entity('vehicle_infos')
export class VehicleInfo {
    @PrimaryGeneratedColumn('uuid')
    vehicleInfoId: string;

    @Column()
    resourceId: string;

    @Column({ nullable: true })
    vehicleNumber: string;

    @Column({ default: 0 })
    leftMileage: number;

    @Column({ default: 0 })
    totalMileage: number;

    @Column({ nullable: true })
    insuranceName: string;

    @Column({ nullable: true })
    insuranceNumber: string;

    @Column({ type: 'jsonb', nullable: true, comment: '주차위치 이미지 배열' })
    parkingLocationImages: string[];

    @Column({
        type: 'jsonb',
        nullable: true,
        comment: '주차위치 좌표 (위도, 경도)',
    })
    parkingCoordinates: { lat: number; lng: number };

    @Column({ type: 'jsonb', nullable: true, comment: '계기판 이미지 배열' })
    odometerImages: string[];

    @Column({ type: 'jsonb', nullable: true, comment: '차량 실내 이미지 배열' })
    indoorImages: string[];

    @OneToOne(() => Resource, (resource) => resource.vehicleInfo)
    @JoinColumn({ name: `resourceId` })
    resource: Resource;

    @OneToMany(() => Consumable, (consumable) => consumable.vehicleInfo)
    consumables: Consumable[];
}
