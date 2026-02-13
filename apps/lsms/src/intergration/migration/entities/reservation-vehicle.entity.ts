import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Reservation } from './reservation.entity';
import { VehicleInfo } from './vehicle-info.entity';

@Entity('reservation_vehicles')
export class ReservationVehicle {
    @PrimaryColumn('uuid', {
        generated: 'uuid',
    })
    reservationVehicleId: string;

    @Column()
    reservationId: string;

    @Column()
    vehicleInfoId: string;

    @Column({ nullable: true })
    startOdometer: number;

    @Column({ nullable: true })
    endOdometer: number;

    @Column({ nullable: true })
    startFuelLevel: number;

    @Column({ nullable: true })
    endFuelLevel: number;

    @Column({ type: 'jsonb', nullable: true })
    location: any;

    @Column({
        type: 'jsonb',
        nullable: true,
        comment: '주차위치 좌표 (위도, 경도)',
    })
    parkingCoordinates: { lat: number; lng: number };

    @Column({ nullable: true, comment: '비고' })
    remarks: string;

    @Column({ default: false })
    isReturned: boolean;

    @Column({ nullable: true })
    returnedBy: string;

    @Column({ type: 'timestamp with time zone', nullable: true })
    returnedAt: Date;

    @ManyToOne(() => Reservation)
    @JoinColumn({ name: 'reservationId' })
    reservation: Reservation;

    @ManyToOne(() => VehicleInfo)
    @JoinColumn({ name: 'vehicleInfoId' })
    vehicleInfo: VehicleInfo;
}
