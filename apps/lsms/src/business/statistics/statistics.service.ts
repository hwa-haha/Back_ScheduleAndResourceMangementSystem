import { Injectable } from '@nestjs/common';
import { Repository, FindOptionsWhere, Between, Like, MoreThanOrEqual } from 'typeorm';
import {
    ResourceUsageStats,
    VehicleMaintenanceHistory,
    ConsumableMaintenanceStats,
    EmployeeReservationStats,
} from '../../domain/statistics-views';
import { InjectRepository } from '@nestjs/typeorm';
import {
    ConsumableMaintenanceStatsFilterDto,
    EmployeeReservationStatsFilterDto,
    ResourceUsageStatsFilterDto,
    VehicleMaintenanceHistoryFilterDto,
} from './dtos';

@Injectable()
export class StatisticsService {
    constructor(
        @InjectRepository(ResourceUsageStats)
        private readonly resourceUsageStatsRepository: Repository<ResourceUsageStats>,
        @InjectRepository(VehicleMaintenanceHistory)
        private readonly vehicleMaintenanceHistoryRepository: Repository<VehicleMaintenanceHistory>,
        @InjectRepository(ConsumableMaintenanceStats)
        private readonly consumableMaintenanceStatsRepository: Repository<ConsumableMaintenanceStats>,
        @InjectRepository(EmployeeReservationStats)
        private readonly employeeReservationStatsRepository: Repository<EmployeeReservationStats>,
    ) {}

    async getResourceUsageStats(filter?: ResourceUsageStatsFilterDto): Promise<ResourceUsageStats[]> {
        const where: FindOptionsWhere<ResourceUsageStats> = {};

        if (filter?.year) {
            where.year = filter.year;
        }

        if (filter?.month) {
            where.month = filter.month;
        }

        if (filter?.resourceId) {
            where.resourceId = filter.resourceId;
        }

        if (filter?.employeeId) {
            where.employeeId = filter.employeeId;
        }

        if (filter?.resourceType) {
            where.resourceType = filter.resourceType;
        }

        return this.resourceUsageStatsRepository.find({ where });
    }

    async getVehicleMaintenanceHistory(
        filter?: VehicleMaintenanceHistoryFilterDto,
    ): Promise<VehicleMaintenanceHistory[]> {
        const where: FindOptionsWhere<VehicleMaintenanceHistory> = {};

        if (filter?.startDate && filter?.endDate) {
            where.maintenanceDate = Between(filter.startDate, filter.endDate);
        } else if (filter?.startDate) {
            where.maintenanceDate = Between(filter.startDate, new Date().toISOString());
        }

        if (filter?.resourceId) {
            where.resourceId = filter.resourceId;
        }

        if (filter?.vehicleInfoId) {
            where.vehicleInfoId = filter.vehicleInfoId;
        }

        if (filter?.consumableId) {
            where.consumableId = filter.consumableId;
        }

        if (filter?.responsibleEmployeeId) {
            where.responsibleEmployeeId = filter.responsibleEmployeeId;
        }

        return this.vehicleMaintenanceHistoryRepository.find({ where });
    }

    async getConsumableMaintenanceStats(
        filter?: ConsumableMaintenanceStatsFilterDto,
    ): Promise<ConsumableMaintenanceStats[]> {
        const where: FindOptionsWhere<ConsumableMaintenanceStats> = {};

        if (filter?.year) {
            where.currentYear = filter.year;
        }

        if (filter?.month) {
            where.currentMonth = filter.month;
        }

        if (filter?.resourceId) {
            where.resourceId = filter.resourceId;
        }

        if (filter?.vehicleInfoId) {
            where.vehicleInfoId = filter.vehicleInfoId;
        }

        if (filter?.consumableId) {
            where.consumableId = filter.consumableId;
        }

        if (filter?.minMaintenanceCount) {
            where.maintenanceCount = MoreThanOrEqual(filter.minMaintenanceCount);
        }

        return this.consumableMaintenanceStatsRepository.find({ where });
    }

    async getEmployeeReservationStats(filter?: EmployeeReservationStatsFilterDto): Promise<EmployeeReservationStats[]> {
        const where: FindOptionsWhere<EmployeeReservationStats> = {};

        if (filter?.year) {
            where.year = filter.year;
        }

        if (filter?.month) {
            where.month = filter.month;
        }

        if (filter?.employeeId) {
            where.employeeId = filter.employeeId;
        }

        if (filter?.employeeName) {
            where.employeeName = Like(`%${filter.employeeName}%`);
        }

        return this.employeeReservationStatsRepository.find({ where });
    }
}
