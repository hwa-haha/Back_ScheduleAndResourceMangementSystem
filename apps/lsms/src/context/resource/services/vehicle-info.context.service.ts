import { Injectable, NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGE } from '../../../../libs/constants/error-message';
import { DataSource, In } from 'typeorm';

// Domain Services
import { DomainVehicleInfoService } from '../../../domain/vehicle-info/vehicle-info.service';
import { DomainReservationVehicleService } from '../../../domain/reservation-vehicle/reservation-vehicle.service';
import { ReservationVehicle } from '../../../domain/reservation-vehicle/reservation-vehicle.entity';
import { DomainFileService } from '../../../domain/file/file.service';
import { DomainConsumableService } from '../../../domain/consumable/consumable.service';
import { Consumable } from '../../../domain/consumable/consumable.entity';
import { Employee } from '@libs/modules/employee/employee.entity';
import { FileContextService } from '../../file/services/file.context.service';

// DTOs
import { VehicleInfoResponseDto } from '../../../business/resource-management/dtos/vehicle/vehicle-response.dto';
import { UpdateVehicleInfoDto } from '../../../business/resource-management/dtos/vehicle/update-vehicle-info.dto';

@Injectable()
export class VehicleInfoContextService {
    constructor(
        private readonly domainVehicleInfoService: DomainVehicleInfoService,
        private readonly domainReservationVehicleService: DomainReservationVehicleService,
        private readonly domainFileService: DomainFileService,
        private readonly domainConsumableService: DomainConsumableService,
        private readonly fileContextService: FileContextService,
        private readonly dataSource: DataSource,
    ) {}

    async 차량정보를_조회한다(vehicleInfoId: string): Promise<VehicleInfoResponseDto> {
        const vehicleInfo = await this.domainVehicleInfoService.findOne({
            where: { vehicleInfoId },
        });

        if (!vehicleInfo) {
            throw new NotFoundException(ERROR_MESSAGE.BUSINESS.VEHICLE_INFO.NOT_FOUND);
        }

        return {
            vehicleInfoId: vehicleInfo.vehicleInfoId,
            resourceId: vehicleInfo.resourceId,
            totalMileage: Number(vehicleInfo.totalMileage),
            leftMileage: Number(vehicleInfo.leftMileage),
            insuranceName: vehicleInfo.insuranceName,
            insuranceNumber: vehicleInfo.insuranceNumber,
            parkingCoordinates: vehicleInfo.parkingCoordinates,
            parkingLocationImages: vehicleInfo.parkingLocationImages || [],
            odometerImages: vehicleInfo.odometerImages || [],
            indoorImages: vehicleInfo.indoorImages || [],
        };
    }

    async 차량정보를_수정한다(
        vehicleInfoId: string,
        updateVehicleInfoDto: UpdateVehicleInfoDto,
    ): Promise<VehicleInfoResponseDto> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 파일 ID 배열 준비 (기본값 빈 배열)
            if (!updateVehicleInfoDto.parkingLocationImages) updateVehicleInfoDto.parkingLocationImages = [];
            if (!updateVehicleInfoDto.odometerImages) updateVehicleInfoDto.odometerImages = [];
            if (!updateVehicleInfoDto.indoorImages) updateVehicleInfoDto.indoorImages = [];

            // 차량정보 업데이트 (이미지 필드 제외)
            const { parkingLocationImages, odometerImages, indoorImages, ...vehicleData } = updateVehicleInfoDto;

            // 파일 ID들을 filePath로 변환
            let parkingLocationFilePaths: string[] = [];
            let odometerFilePaths: string[] = [];
            let indoorFilePaths: string[] = [];

            if (parkingLocationImages.length > 0) {
                const files = await this.domainFileService.findAll({
                    where: { fileId: In(parkingLocationImages) },
                });
                parkingLocationFilePaths = files.map((file) => file.filePath);
            }

            if (odometerImages.length > 0) {
                const files = await this.domainFileService.findAll({
                    where: { fileId: In(odometerImages) },
                });
                odometerFilePaths = files.map((file) => file.filePath);
            }

            if (indoorImages.length > 0) {
                const files = await this.domainFileService.findAll({
                    where: { fileId: In(indoorImages) },
                });
                indoorFilePaths = files.map((file) => file.filePath);
            }

            // 차량정보 업데이트 (filePath 포함)
            const vehicleInfo = await this.domainVehicleInfoService.update(
                vehicleInfoId,
                {
                    ...vehicleData,
                    parkingLocationImages: parkingLocationFilePaths,
                    odometerImages: odometerFilePaths,
                    indoorImages: indoorFilePaths,
                },
                {
                    queryRunner,
                },
            );

            // 모든 파일 ID들을 수집
            const allFileIds = [...parkingLocationImages, ...odometerImages, ...indoorImages];

            // 파일들을 임시에서 영구로 변경
            if (allFileIds.length > 0) {
                await this.fileContextService.파일들을_영구로_변경한다(allFileIds, queryRunner);
            }

            // 차량정보에 파일들을 연결 (덮어쓰기)
            await this.fileContextService.차량정보에_파일들을_연결한다(
                vehicleInfoId,
                {
                    parkingLocationImages,
                    odometerImages,
                    indoorImages,
                },
                queryRunner,
            );

            // 소모품 복사
            const hasConsumables = await this.domainConsumableService.count({
                where: {
                    vehicleInfoId: vehicleInfoId,
                },
            });
            if (hasConsumables === 0) {
                const sourceConsumables = await queryRunner.manager
                    .createQueryBuilder(Consumable, 'consumable')
                    .select(
                        'DISTINCT ON (consumable.name) consumable.name, consumable.notifyReplacementCycle, consumable.replaceCycle',
                    )
                    .where('consumable.vehicleInfoId != :vehicleInfoId', { vehicleInfoId })
                    .orderBy('consumable.name', 'ASC')
                    .getRawMany();

                // 이름으로 그룹화하여 각 이름별로 하나씩만 선택
                const newConsumables = sourceConsumables.map((consumable) => {
                    const newConsumable = new Consumable();
                    newConsumable.vehicleInfoId = vehicleInfoId;
                    newConsumable.name = consumable.name;
                    newConsumable.notifyReplacementCycle = consumable.notifyReplacementCycle;
                    newConsumable.replaceCycle = consumable.replaceCycle;
                    newConsumable.initMileage = updateVehicleInfoDto.totalMileage || 0;
                    return newConsumable;
                });

                await this.domainConsumableService.bulkCreate(newConsumables, {
                    queryRunner,
                });
            }

            await queryRunner.commitTransaction();

            // 업데이트된 차량정보 조회
            const updatedVehicleInfo = await this.domainVehicleInfoService.findOne({
                where: { vehicleInfoId },
            });

            return {
                vehicleInfoId: updatedVehicleInfo.vehicleInfoId,
                resourceId: updatedVehicleInfo.resourceId,
                totalMileage: Number(updatedVehicleInfo.totalMileage),
                leftMileage: Number(updatedVehicleInfo.leftMileage),
                insuranceName: updatedVehicleInfo.insuranceName,
                insuranceNumber: updatedVehicleInfo.insuranceNumber,
                parkingCoordinates: updatedVehicleInfo.parkingCoordinates,
                parkingLocationImages: updatedVehicleInfo.parkingLocationImages || [],
                odometerImages: updatedVehicleInfo.odometerImages || [],
                indoorImages: updatedVehicleInfo.indoorImages || [],
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async 반납_리스트를_조회한다(vehicleInfoId: string): Promise<ReservationVehicle[]> {
        const reservationVehicles = await this.domainReservationVehicleService.findAll({
            where: { isReturned: true, vehicleInfoId },
            order: {
                returnedAt: 'DESC',
            },
        });
        const employees = await this.dataSource.getRepository(Employee).find({
            where: { id: In(reservationVehicles.map((reservationVehicle) => reservationVehicle.returnedBy)) },
        });
        const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));

        // 각 반납 정보에 직원 이름과 반납 이미지 추가
        for (const reservationVehicle of reservationVehicles) {
            reservationVehicle.returnedBy = employeeMap.get(reservationVehicle.returnedBy)?.name;

            // 반납 이미지 조회
            const returnFiles = await this.fileContextService.차량예약_파일을_조회한다(
                reservationVehicle.reservationVehicleId,
            );
            (reservationVehicle as any).parkingLocationImages = returnFiles.parkingLocationImages.map(
                (file) => file.filePath,
            );
            (reservationVehicle as any).odometerImages = returnFiles.odometerImages.map((file) => file.filePath);
            (reservationVehicle as any).indoorImages = returnFiles.indoorImages.map((file) => file.filePath);
        }

        return reservationVehicles;
    }

    async 반납_상세정보를_조회한다(reservationVehicleId: string): Promise<ReservationVehicle> {
        const reservationVehicle =
            await this.domainReservationVehicleService.findByReservationVehicleId(reservationVehicleId);
        const employee = await this.dataSource
            .getRepository(Employee)
            .findOne({ where: { id: reservationVehicle.returnedBy } });
        reservationVehicle.returnedBy = employee.name;

        return reservationVehicle;
    }

    /**
     * resourceId로 차량 정보만 조회
     */
    async 차량정보만_조회한다(resourceId: string) {
        const vehicleInfo = await this.domainVehicleInfoService.findOne({
            where: { resourceId },
        });
        return vehicleInfo;
    }
}
