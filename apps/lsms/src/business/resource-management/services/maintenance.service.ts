import { Injectable } from '@nestjs/common';
import { PaginationData } from '../../../../libs/dtos/pagination-response.dto';

// Context Services
import { MaintenanceContextService } from '../../../context/resource/services/maintenance.context.service';
import { NotificationContextService } from '../../../context/notification/services/notification.context.service';

// DTOs
import { CreateMaintenanceDto } from '../dtos/vehicle/create-vehicle-info.dto';
import { UpdateMaintenanceDto } from '../dtos/vehicle/update-vehicle-info.dto';
import { MaintenanceResponseDto } from '../dtos/vehicle/vehicle-response.dto';
import { EmployeeContextService } from '../../../context/employee/employee.context.service';
import { ResourceContextService } from '../../../context/resource/services/resource.context.service';
import { ResourceNotificationContextService } from '../../../context/notification/services/resource-notification.context.service';

@Injectable()
export class MaintenanceService {
    constructor(
        private readonly maintenanceContextService: MaintenanceContextService,
        private readonly employeeContextService: EmployeeContextService,
        private readonly resourceContextService: ResourceContextService,
        private readonly resourceNotificationContextService: ResourceNotificationContextService,
    ) {}

    async save(createMaintenanceDto: CreateMaintenanceDto): Promise<MaintenanceResponseDto> {
        const maintenance = await this.maintenanceContextService.정비이력을_저장한다(createMaintenanceDto);

        // 시스템 관리자들에게 알림 발송
        const systemAdmins = await this.employeeContextService.시스템관리자_목록을_조회한다();

        const consumable = await this.resourceContextService.소모품의_자원을_조회한다(
            createMaintenanceDto.consumableId,
        );

        await this.resourceNotificationContextService.정비완료_알림을_전송한다(
            { resource: consumable.vehicleInfo.resource, consumable: consumable },
            systemAdmins.map((admin) => admin.id),
        );
        return maintenance;
    }

    async findAllByVehicleInfoId(
        vehicleInfoId: string,
        page: number,
        limit: number,
    ): Promise<PaginationData<MaintenanceResponseDto>> {
        return this.maintenanceContextService.차량별_정비이력을_조회한다(vehicleInfoId, page, limit);
    }

    async findOne(maintenanceId: string): Promise<MaintenanceResponseDto> {
        return this.maintenanceContextService.정비이력을_조회한다(maintenanceId);
    }

    async update(maintenanceId: string, updateMaintenanceDto: UpdateMaintenanceDto): Promise<MaintenanceResponseDto> {
        return this.maintenanceContextService.정비이력을_수정한다(maintenanceId, updateMaintenanceDto);
    }

    async delete(maintenanceId: string): Promise<void> {
        return this.maintenanceContextService.정비이력을_삭제한다(maintenanceId);
    }
}
