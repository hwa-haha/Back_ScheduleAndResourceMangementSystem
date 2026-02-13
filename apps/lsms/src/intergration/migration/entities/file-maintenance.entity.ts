import { File } from './file.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Maintenance } from './maintenance.entity';

@Entity('file_maintenances')
export class FileMaintenance {
    @PrimaryGeneratedColumn('uuid')
    fileMaintenanceId: string;

    @Column()
    maintenanceId: string;

    @Column()
    fileId: string;

    @ManyToOne(() => Maintenance)
    @JoinColumn({ name: 'maintenanceId' })
    maintenance: Maintenance;

    @ManyToOne(() => File)
    @JoinColumn({ name: 'fileId' })
    file: File;
}
