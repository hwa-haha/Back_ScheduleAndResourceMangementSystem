import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Resource } from './resource.entity';
import { File } from './file.entity';

@Entity('file_resources')
export class FileResource {
    @PrimaryGeneratedColumn('uuid')
    fileResourceId: string;

    @Column()
    resourceId: string;

    @Column()
    fileId: string;

    @ManyToOne(() => Resource)
    @JoinColumn({ name: 'resourceId' })
    resource: Resource;

    @ManyToOne(() => File)
    @JoinColumn({ name: 'fileId' })
    file: File;
}
