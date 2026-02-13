import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Resource } from './resource.entity';
import { ResourceType } from '../../../../libs/enums/resource-type.enum';

@Entity('resource_groups')
export class ResourceGroup {
    @PrimaryColumn('uuid', {
        generated: 'uuid',
    })
    resourceGroupId: string;

    @Column({ unique: true })
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    parentResourceGroupId: string;

    @Column({
        type: 'enum',
        enum: ResourceType,
    })
    type: ResourceType;

    @Column({ default: 0 })
    order: number;

    @OneToMany(() => Resource, (resource) => resource.resourceGroup)
    resources: Resource[];

    @ManyToOne(() => ResourceGroup, (resourceGroup) => resourceGroup.children)
    @JoinColumn({ name: 'parentResourceGroupId' })
    parent: ResourceGroup;

    @OneToMany(() => ResourceGroup, (resourceGroup) => resourceGroup.parent)
    children: ResourceGroup[];
}
