import { Entity, PrimaryColumn, Column, ManyToOne, OneToOne, JoinColumn, OneToMany, DeleteDateColumn } from 'typeorm';
import { ResourceGroup } from './resource-group.entity';
import { VehicleInfo } from './vehicle-info.entity';
import { MeetingRoomInfo } from './meeting-room-info.entity';
import { AccommodationInfo } from './accommodation-info.entity';
import { Reservation } from './reservation.entity';
import { ResourceType } from '../../../../libs/enums/resource-type.enum';
import { ResourceManager } from './resource-manager.entity';
import { EquipmentInfo } from './equipment-info.entity';

export interface ResourceLocation {
    address: string;
    detailAddress?: string;
}

export interface ResourceLocationURL {
    tmap?: string;
    navermap?: string;
    kakaomap?: string;
}

@Entity('resources')
export class Resource {
    @PrimaryColumn('uuid', {
        generated: 'uuid', // UUID 자동 생성
    })
    resourceId: string;

    @Column('uuid', { nullable: true })
    resourceGroupId: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column('jsonb', { nullable: true })
    location: ResourceLocation;

    @Column('jsonb', { nullable: true })
    locationURLs: ResourceLocationURL;

    @Column({ default: true })
    isAvailable: boolean;

    @Column({ nullable: true })
    unavailableReason: string;

    @Column('jsonb')
    images: string[];

    @Column({ default: true })
    notifyParticipantChange: boolean;

    @Column({ default: true })
    notifyReservationChange: boolean;

    @Column({ type: 'enum', enum: ResourceType })
    type: ResourceType;

    @Column({ default: 0 })
    order: number;

    @DeleteDateColumn({ type: 'timestamp with time zone' })
    deletedAt: Date;

    @ManyToOne(() => ResourceGroup)
    @JoinColumn({ name: 'resourceGroupId' })
    resourceGroup: ResourceGroup;

    @OneToOne(() => VehicleInfo, (vehicleInfo) => vehicleInfo.resource)
    vehicleInfo: VehicleInfo;

    @OneToOne(() => MeetingRoomInfo, (meetingRoomInfo) => meetingRoomInfo.resource)
    meetingRoomInfo: MeetingRoomInfo;

    @OneToOne(() => AccommodationInfo, (accommodationInfo) => accommodationInfo.resource)
    accommodationInfo: AccommodationInfo;

    @OneToOne(() => EquipmentInfo, (equipmentInfo) => equipmentInfo.resource)
    equipmentInfo: EquipmentInfo;

    @OneToMany(() => Reservation, (reservation) => reservation.resource)
    reservations: Reservation[];

    @OneToMany(() => ResourceManager, (resourceManager) => resourceManager.resource)
    resourceManagers: ResourceManager[];
}
