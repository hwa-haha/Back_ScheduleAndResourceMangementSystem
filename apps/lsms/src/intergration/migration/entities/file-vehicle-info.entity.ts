import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { VehicleInfo } from './vehicle-info.entity';
import { File } from './file.entity';

@Entity('file_vehicle_infos')
export class FileVehicleInfo {
    @PrimaryGeneratedColumn('uuid')
    fileVehicleInfoId: string;

    @Column()
    vehicleInfoId: string;

    @Column()
    fileId: string;

    @Column()
    type: string;

    @ManyToOne(() => VehicleInfo)
    @JoinColumn({ name: 'vehicleInfoId' })
    vehicleInfo: VehicleInfo;

    @ManyToOne(() => File)
    @JoinColumn({ name: 'fileId' })
    file: File;
}
