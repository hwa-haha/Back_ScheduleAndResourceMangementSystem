import { Injectable } from '@nestjs/common';
import { Employee } from '@libs/modules/employee/employee.entity';

// Context Services
import { ConsumableContextService } from '../../../context/resource/services/consumable.context.service';

// DTOs
import { CreateConsumableDto } from '../dtos/vehicle/create-vehicle-info.dto';
import { UpdateConsumableDto } from '../dtos/vehicle/update-vehicle-info.dto';
import { ConsumableResponseDto } from '../dtos/vehicle/vehicle-response.dto';

@Injectable()
export class ConsumableService {
    constructor(private readonly consumableContextService: ConsumableContextService) {}

    async save(createConsumableDto: CreateConsumableDto): Promise<ConsumableResponseDto> {
        return this.consumableContextService.소모품을_저장한다(createConsumableDto);
    }

    async findAll(vehicleInfoId: string): Promise<ConsumableResponseDto[]> {
        return this.consumableContextService.차량별_소모품목록을_조회한다(vehicleInfoId);
    }

    async findOne(consumableId: string): Promise<ConsumableResponseDto> {
        return this.consumableContextService.소모품을_조회한다(consumableId);
    }

    async update(consumableId: string, updateConsumableDto: UpdateConsumableDto): Promise<ConsumableResponseDto> {
        return this.consumableContextService.소모품을_수정한다(consumableId, updateConsumableDto);
    }

    async delete(consumableId: string): Promise<void> {
        return this.consumableContextService.소모품을_삭제한다(consumableId);
    }
}
