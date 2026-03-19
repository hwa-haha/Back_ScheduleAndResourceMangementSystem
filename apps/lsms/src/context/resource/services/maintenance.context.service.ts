import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, In, MoreThanOrEqual, Not, Raw } from 'typeorm';
import { Maintenance } from '../../../domain/maintenance/maintenance.entity';
import { Employee } from '@libs/modules/employee/employee.entity';
import { ERROR_MESSAGE } from '../../../../libs/constants/error-message';
import { NotificationType } from '../../../../libs/enums/notification-type.enum';
import { Role } from '../../../../libs/enums/role-type.enum';

// Domain Services
import { DomainMaintenanceService } from '../../../domain/maintenance/maintenance.service';
import { DomainConsumableService } from '../../../domain/consumable/consumable.service';
import { DomainVehicleInfoService } from '../../../domain/vehicle-info/vehicle-info.service';
import { DomainEmployeeService } from '@libs/modules/employee/employee.service';
import { DomainFileService } from '../../../domain/file/file.service';

// Context Services
import { FileContextService } from '../../file/services/file.context.service';

// DTOs
import { CreateMaintenanceDto } from '../../../business/resource-management/dtos/vehicle/create-vehicle-info.dto';
import { UpdateMaintenanceDto } from '../../../business/resource-management/dtos/vehicle/update-vehicle-info.dto';
import { MaintenanceResponseDto } from '../../../business/resource-management/dtos/vehicle/vehicle-response.dto';
import { PaginationData } from '../../../../libs/dtos/pagination-response.dto';
import { IRepositoryOptions } from '../../../../libs/interfaces/repository.interface';

@Injectable()
export class MaintenanceContextService {
    constructor(
        private readonly domainMaintenanceService: DomainMaintenanceService,
        private readonly domainConsumableService: DomainConsumableService,
        private readonly domainVehicleInfoService: DomainVehicleInfoService,
        private readonly domainEmployeeService: DomainEmployeeService,
        private readonly domainFileService: DomainFileService,
        private readonly fileContextService: FileContextService,
        private readonly dataSource: DataSource,
    ) {}

    async 정비이력을_저장한다(createMaintenanceDto: CreateMaintenanceDto): Promise<MaintenanceResponseDto> {
        const existingMaintenance = await this.domainMaintenanceService.findOne({
            where: {
                consumableId: createMaintenanceDto.consumableId,
                date: MoreThanOrEqual(createMaintenanceDto.date),
            },
        });

        if (existingMaintenance) {
            throw new BadRequestException(ERROR_MESSAGE.BUSINESS.MAINTENANCE.INVALID_DATE);
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 파일 ID 배열 준비 (기본값 빈 배열)
            if (!createMaintenanceDto.images) createMaintenanceDto.images = [];
            const fileIds = createMaintenanceDto.images;

            // 파일 ID들을 filePath로 변환
            let filePaths: string[] = [];
            if (fileIds.length > 0) {
                const files = await this.domainFileService.findAll({
                    where: { fileId: In(fileIds) },
                });
                filePaths = files.map((file) => file.filePath);
            }

            // 이미지 파일들을 임시에서 영구로 변경
            if (fileIds.length > 0) {
                await this.fileContextService.파일들을_영구로_변경한다(fileIds, queryRunner);
            }

            // 정비 이력 저장 (filePath 포함)
            const { images, ...maintenanceData } = createMaintenanceDto;
            const maintenance = await this.domainMaintenanceService.save(
                { ...maintenanceData, images: filePaths },
                { queryRunner },
            );

            // 정비에 파일들을 연결
            await this.fileContextService.정비에_파일들을_연결한다(maintenance.maintenanceId!, fileIds, queryRunner);

            if (createMaintenanceDto.mileage) {
                const consumable = await this.domainConsumableService.findOne({
                    where: { consumableId: maintenance.consumableId },
                    relations: ['vehicleInfo'],
                });

                if (consumable.vehicleInfo.totalMileage < createMaintenanceDto.mileage) {
                    await this.domainVehicleInfoService.update(
                        consumable.vehicleInfo.vehicleInfoId,
                        {
                            totalMileage: createMaintenanceDto.mileage,
                        },
                        { queryRunner },
                    );
                }
            }

            await queryRunner.commitTransaction();

            return {
                maintenanceId: maintenance.maintenanceId,
                consumableId: maintenance.consumableId,
                date: maintenance.date,
                mileage: maintenance.mileage,
                cost: maintenance.cost,
                images: maintenance.images || [],
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async 모든_정비이력을_조회한다(user: Employee): Promise<MaintenanceResponseDto[]> {
        const maintenances = await this.domainMaintenanceService.findAll({
            relations: ['consumable', 'consumable.vehicleInfo', 'consumable.vehicleInfo.resource'],
            order: { date: 'DESC' },
        });

        return maintenances.map((maintenance) => {
            return {
                maintenanceId: maintenance.maintenanceId,
                consumableId: maintenance.consumableId,
                resourceName: maintenance.consumable?.vehicleInfo?.resource?.name,
                consumableName: maintenance.consumable?.name,
                date: maintenance.date,
                mileage: maintenance.mileage,
                cost: maintenance.cost,
                images: maintenance.images || [],
            };
        });
    }

    async 차량별_정비이력을_조회한다(
        vehicleInfoId: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<PaginationData<MaintenanceResponseDto>> {
        const vehicleInfo = await this.domainVehicleInfoService.findOne({
            where: { vehicleInfoId },
            relations: ['resource', 'consumables', 'consumables.maintenances'],
            withDeleted: true,
        });
        const options: IRepositoryOptions<Maintenance> = {
            where: {
                maintenanceId: In(
                    vehicleInfo.consumables.flatMap((consumable) =>
                        consumable.maintenances.map((maintenance) => maintenance.maintenanceId),
                    ),
                ),
            },
            withDeleted: true,
        };
        const count = await this.domainMaintenanceService.count(options);

        if (page && limit) {
            options.skip = (page - 1) * limit;
            options.take = limit;
        }
        options.relations = ['consumable'];
        options.order = { createdAt: 'DESC' };
        const maintenances = await this.domainMaintenanceService.findAll(options);

        const items = maintenances.map((maintenance, index, array) => {
            return {
                maintenanceId: maintenance.maintenanceId,
                consumableId: maintenance.consumableId,
                date: maintenance.date,
                mileage: maintenance.mileage,
                cost: maintenance.cost,
                images: maintenance.images || [],
                consumableName: maintenance.consumable.name,
                resourceName: vehicleInfo.resource.name,
                previousMileage: index !== array.length - 1 ? array[index + 1].mileage : 0,
                isLatest: index === 0,
            };
        });

        return {
            items,
            meta: {
                total: count,
                page,
                limit,
                hasNext: page * limit < count,
            },
        };
    }

    async 정비이력을_조회한다(maintenanceId: string): Promise<MaintenanceResponseDto> {
        const maintenance = await this.domainMaintenanceService.findOne({
            where: { maintenanceId },
            relations: ['consumable', 'consumable.vehicleInfo', 'consumable.vehicleInfo.resource'],
        });

        if (!maintenance) {
            throw new NotFoundException(ERROR_MESSAGE.BUSINESS.MAINTENANCE.NOT_FOUND);
        }

        // 파일 정보 조회
        const imageFiles = await this.fileContextService.정비_파일정보를_조회한다(maintenanceId);

        return {
            maintenanceId: maintenance.maintenanceId,
            consumableId: maintenance.consumableId,
            resourceName: maintenance.consumable?.vehicleInfo?.resource?.name,
            consumableName: maintenance.consumable?.name,
            date: maintenance.date,
            mileage: maintenance.mileage,
            cost: maintenance.cost,
            images: maintenance.images || [],
            imageFiles: imageFiles,
        };
    }

    async 정비이력을_수정한다(
        maintenanceId: string,
        updateMaintenanceDto: UpdateMaintenanceDto,
    ): Promise<MaintenanceResponseDto> {
        const existingMaintenance = await this.domainMaintenanceService.findOne({
            where: { maintenanceId },
        });

        if (!existingMaintenance) {
            throw new NotFoundException(ERROR_MESSAGE.BUSINESS.MAINTENANCE.NOT_FOUND);
        }

        // 날짜 변경 시 유효성 검사
        if (updateMaintenanceDto.date && updateMaintenanceDto.date !== existingMaintenance.date) {
            const conflictingMaintenance = await this.domainMaintenanceService.findOne({
                where: {
                    consumableId: existingMaintenance.consumableId,
                    date: MoreThanOrEqual(updateMaintenanceDto.date),
                    maintenanceId: Not(maintenanceId),
                },
            });

            if (conflictingMaintenance) {
                throw new BadRequestException(ERROR_MESSAGE.BUSINESS.MAINTENANCE.INVALID_DATE);
            }
        }

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 파일 관련 처리
            let filePaths: string[] = [];
            if (updateMaintenanceDto.images !== undefined) {
                const fileIds = updateMaintenanceDto.images || [];

                // 파일 ID들을 filePath로 변환
                if (fileIds.length > 0) {
                    const files = await this.domainFileService.findAll({
                        where: { fileId: In(fileIds) },
                    });
                    filePaths = files.map((file) => file.filePath);
                }

                // 파일들을 임시에서 영구로 변경
                if (fileIds.length > 0) {
                    await this.fileContextService.파일들을_영구로_변경한다(fileIds, queryRunner);
                }

                // 정비에 파일들을 연결 (덮어쓰기)
                await this.fileContextService.정비에_파일들을_연결한다(maintenanceId, fileIds, queryRunner);
            }

            // 정비 이력 업데이트 (filePath 포함)
            const { images, ...maintenanceData } = updateMaintenanceDto;
            const updateData =
                updateMaintenanceDto.images !== undefined ? { ...maintenanceData, images: filePaths } : maintenanceData;
            await this.domainMaintenanceService.update(maintenanceId, updateData, { queryRunner });

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        const updatedMaintenance = await this.domainMaintenanceService.findOne({
            where: { maintenanceId },
            relations: ['consumable', 'consumable.vehicleInfo', 'consumable.vehicleInfo.resource'],
        });

        return {
            maintenanceId: updatedMaintenance.maintenanceId,
            consumableId: updatedMaintenance.consumableId,
            resourceName: updatedMaintenance.consumable?.vehicleInfo?.resource?.name,
            consumableName: updatedMaintenance.consumable?.name,
            date: updatedMaintenance.date,
            mileage: updatedMaintenance.mileage,
            cost: updatedMaintenance.cost,
            images: updatedMaintenance.images || [],
        };
    }

    async 정비이력을_삭제한다(maintenanceId: string): Promise<void> {
        const maintenance = await this.domainMaintenanceService.findOne({
            where: { maintenanceId },
        });

        if (!maintenance) {
            throw new NotFoundException(ERROR_MESSAGE.BUSINESS.MAINTENANCE.NOT_FOUND);
        }

        await this.domainMaintenanceService.delete(maintenanceId);
    }
}
