import { Controller, Get, Post, Delete, Body, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { CreateMaintenanceDto } from '../../dtos/vehicle/create-vehicle-info.dto';
import { UpdateMaintenanceDto } from '../../dtos/vehicle/update-vehicle-info.dto';
import { MaintenanceResponseDto } from '../../dtos/vehicle/vehicle-response.dto';
import { User } from '../../../../../libs/decorators/user.decorator';
import { Employee } from '@libs/modules/employee/employee.entity';

import { PaginationQueryDto } from '../../../../../libs/dtos/pagination-query.dto';
import { PaginationData } from '../../../../../libs/dtos/pagination-response.dto';
import { MaintenanceService } from '../../services/maintenance.service';

@ApiTags('v2 차량 정비 이력')
@Controller('v2/maintenances')
@ApiBearerAuth()
export class MaintenanceController {
    constructor(private readonly maintenanceService: MaintenanceService) {}

    @Post()
    @ApiOperation({ summary: '정비 이력 생성' })
    @ApiOkResponse({
        status: 201,
        description: '정비 이력이 생성되었습니다.',
        type: MaintenanceResponseDto,
    })
    async create(@Body() createMaintenanceDto: CreateMaintenanceDto): Promise<MaintenanceResponseDto> {
        return this.maintenanceService.save(createMaintenanceDto);
    }

    @Get('vehicle/:vehicleInfoId')
    @ApiOperation({ summary: '정비 이력 목록 조회' })
    @ApiOkResponse({
        description: '정비 이력 목록을 조회했습니다.',
        type: [MaintenanceResponseDto],
    })
    @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
    @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
    async findAll(
        @Param('vehicleInfoId') vehicleInfoId: string,
        @Query() query: PaginationQueryDto,
    ): Promise<PaginationData<MaintenanceResponseDto>> {
        const { page, limit } = query;
        return this.maintenanceService.findAllByVehicleInfoId(vehicleInfoId, page, limit);
    }

    @Get(':maintenanceId')
    @ApiOperation({ summary: '정비 상세 이력 조회' })
    @ApiOkResponse({
        description: '정비 상세 이력을 조회했습니다.',
        type: MaintenanceResponseDto,
    })
    async findOne(@Param('maintenanceId') maintenanceId: string): Promise<MaintenanceResponseDto> {
        return this.maintenanceService.findOne(maintenanceId);
    }

    @Patch(':maintenanceId')
    @ApiOperation({ summary: '정비 이력 수정' })
    @ApiOkResponse({
        description: '정비 이력이 수정되었습니다.',
        type: MaintenanceResponseDto,
    })
    async update(
        @Param('maintenanceId') maintenanceId: string,
        @Body() updateMaintenanceDto: UpdateMaintenanceDto,
    ): Promise<MaintenanceResponseDto> {
        return this.maintenanceService.update(maintenanceId, updateMaintenanceDto);
    }

    @Delete(':maintenanceId')
    @ApiOperation({ summary: '정비 이력 삭제' })
    @ApiOkResponse({
        description: '정비 이력이 삭제되었습니다.',
    })
    async remove(@Param('maintenanceId') maintenanceId: string): Promise<void> {
        return this.maintenanceService.delete(maintenanceId);
    }
}
