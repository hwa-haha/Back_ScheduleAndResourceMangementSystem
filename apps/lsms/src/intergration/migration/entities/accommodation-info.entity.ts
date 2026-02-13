import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Resource } from './resource.entity';

export interface ResourceLocationURL {
    tmap?: string;
    navermap?: string;
    kakaomap?: string;
}

@Entity('accommodation_infos')
export class AccommodationInfo {
    @PrimaryColumn('uuid', {
        generated: 'uuid',
    })
    accommodationInfoId: string;

    @Column()
    resourceId: string;

    @Column('jsonb', { nullable: true })
    locationURLs: ResourceLocationURL;

    @OneToOne(() => Resource, (resource) => resource.accommodationInfo)
    @JoinColumn({ name: 'resourceId' })
    resource: Resource;
}
