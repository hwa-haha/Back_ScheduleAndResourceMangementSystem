import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { File } from './file.entity';
import { ReservationVehicle } from './reservation-vehicle.entity';

@Entity('file_reservation_vehicles')
export class FileReservationVehicle {
    @PrimaryGeneratedColumn('uuid')
    fileReservationVehicleId: string;

    @Column()
    reservationVehicleId: string;

    @Column()
    fileId: string;

    @Column()
    type: string;

    @ManyToOne(() => ReservationVehicle)
    @JoinColumn({ name: 'reservationVehicleId' })
    reservationVehicle: ReservationVehicle;

    @ManyToOne(() => File)
    @JoinColumn({ name: 'fileId' })
    file: File;
}
