import { Controller, Get, Post, Delete, Body, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiOkResponse } from '@nestjs/swagger';

import { ResourceType } from '../../../../../libs/enums/resource-type.enum';
import {
    CreateResourceResponseDto,
    ResourceResponseDto,
    MyManagementResourcesResponseDto,
} from '../../dtos/resource/resource-response.dto';
import { CreateResourceInfoDto } from '../../dtos/resource/create-resource.dto';
import { UpdateResourceInfoDto, UpdateResourceOrdersDto } from '../../dtos/resource/update-resource.dto';
import { ResourceService } from '../../services/resource.service';
import { ResourceAvailabilityDto } from '../../dtos/resource/available-time-response.dto';
import { ResourceQueryDto } from '../../dtos/resource/resource-query.dto';
import { CheckAvailabilityQueryDto } from '../../dtos/resource/check-availability.dto';
import { ResourceMonthAvailabilityQueryDto } from '../../dtos/resource/resource-month-availability-query.dto';
import { ResourceMonthAvailabilityResponseDto } from '../../dtos/resource/resource-month-availability-response.dto';
import { Employee } from '../../../../domain/employee/employee.entity';
import { User } from '../../../../../libs/decorators/user.decorator';

@ApiTags('v2 자원')
@Controller('v2/resources')
@ApiBearerAuth()
export class ResourceController {
    constructor(private readonly resourceService: ResourceService) {}

    @Post()
    @ApiOperation({ summary: '자원 생성 #관리자/자원관리/생성' })
    @ApiOkResponse({
        status: 201,
        description: '자원이 성공적으로 생성되었습니다.',
        type: CreateResourceResponseDto,
    })
    async createWithInfos(@Body() createResourceInfo: CreateResourceInfoDto): Promise<CreateResourceResponseDto> {
        return this.resourceService.createResourceWithInfos(createResourceInfo);
    }

    @Get()
    @ApiOperation({ summary: '자원 목록 조회 #관리자/자원관리/자원리스트' })
    @ApiOkResponse({
        status: 200,
        description: '자원 목록을 성공적으로 조회했습니다.',
        type: [ResourceResponseDto],
    })
    @ApiQuery({ name: 'type', enum: ResourceType })
    async findAll(@Query('type') type: ResourceType): Promise<ResourceResponseDto[]> {
        return this.resourceService.findResources(type);
    }

    @Get('my-managemanment')
    @ApiOperation({ summary: '내 관리 자원 목록 조회 #관리자/자원관리/자원리스트' })
    @ApiOkResponse({
        status: 200,
        description: '내 관리 자원 목록을 성공적으로 조회했습니다.',
        type: MyManagementResourcesResponseDto,
    })
    async findMyManagementResources(@User() user: Employee): Promise<MyManagementResourcesResponseDto> {
        return this.resourceService.findMyManagementResources(user.employeeId);
    }

    @Get('availability')
    @ApiOperation({
        summary: '예약 가능 시간 조회 #사용자/예약 생성 페이지',
        description: `
## 자원 가용성 조회 API

이 API는 세 가지 시나리오로 사용할 수 있습니다:

### 🎯 시나리오 1: 시간 슬롯 방식 (회의실, 장비)
시간 슬롯 단위로 사용 가능한 시간 슬롯을 조회합니다.
- **필수**: resourceType, resourceGroupId, startDate, endDate(=startDate), timeUnit
- **선택**: am, pm (시간대 필터), slotIntervalMinutes (슬롯 간격, 기본값: 30분)

**예시**: \`?resourceType=MEETING_ROOM&resourceGroupId=xxx&startDate=2024-01-15&endDate=2024-01-15&timeUnit=30&slotIntervalMinutes=30&pm=true\`

### 🎯 시나리오 2: 시간 범위 방식 (정확한 시간 지정)
특정 시간 범위에서 자원 가용성을 확인합니다.
- **필수**: resourceType, startDate, endDate, startTime, endTime, timeUnit
- **선택**: resourceGroupId

**예시**: \`?resourceType=EQUIPMENT&resourceGroupId=xxx&startDate=2024-01-15&endDate=2024-01-15&startTime=09:00:00&endTime=17:00:00\`

### 🎯 시나리오 3: 날짜 범위 방식 (숙소, 다일자)
여러 날짜에 걸친 자원 가용성을 확인합니다.
- **필수**: resourceType, startDate, endDate
- **선택**: resourceGroupId, startTime, endTime (체크인/체크아웃 시간)

**예시**: \`?resourceType=ACCOMMODATION&resourceGroupId=xxx&startDate=2024-01-15&endDate=2024-01-17&startTime=15:00:00&endTime=11:00:00\`
        `,
    })
    @ApiOkResponse({
        description: '예약 가능 시간 조회 성공',
        type: [ResourceAvailabilityDto],
    })
    async findAvailableTime(@Query() query: ResourceQueryDto): Promise<ResourceAvailabilityDto[]> {
        return this.resourceService.findAvailableTime(query);
    }

    @Get('check-availability')
    @ApiOperation({ summary: '예약 시간 가용성 확인' })
    @ApiOkResponse({
        description: '예약 시간 가용성 확인 결과',
        type: Boolean,
    })
    async checkAvailability(@Query() query: CheckAvailabilityQueryDto): Promise<boolean> {
        return this.resourceService.checkAvailability(
            query.resourceId,
            query.startDate,
            query.endDate,
            query.reservationId,
        );
    }

    // 해당월에 대한 예약시간 가용성 확인
    @Get('check-availability/month')
    @ApiOperation({ summary: '해당월의 각 날짜별 예약 가용성 확인' })
    @ApiOkResponse({
        description: '해당월의 각 날짜별 예약 가용성 확인 결과',
        type: ResourceMonthAvailabilityResponseDto,
    })
    async checkAvailabilityMonth(
        @Query() query: ResourceMonthAvailabilityQueryDto,
    ): Promise<ResourceMonthAvailabilityResponseDto> {
        return this.resourceService.checkAvailabilityMonth(query);
    }

    @Get(':resourceId')
    @ApiOperation({ summary: '자원 상세 조회 #관리자/자원관리/상세' })
    @ApiOkResponse({
        status: 200,
        description: '자원을 성공적으로 조회했습니다.',
        type: ResourceResponseDto,
    })
    async findOne(@Param('resourceId') resourceId: string): Promise<ResourceResponseDto> {
        return this.resourceService.findResourceDetailForAdmin(resourceId);
    }

    @Get('resource-group/:resourceGroupId')
    @ApiOperation({ summary: '자원 그룹 상세 조회 #관리자/자원관리/자원리스트' })
    @ApiOkResponse({
        status: 200,
        description: '자원 그룹을 성공적으로 조회했습니다.',
        type: [ResourceResponseDto],
    })
    async findResourcesByResourceGroupId(
        @Param('resourceGroupId') resourceGroupId: string,
    ): Promise<ResourceResponseDto[]> {
        return this.resourceService.findResourcesByResourceGroupId(resourceGroupId);
    }

    @Patch('order')
    @ApiOperation({ summary: '자원 순서 변경' })
    @ApiOkResponse({
        status: 200,
        description: '자원 순서가 성공적으로 변경되었습니다.',
    })
    async reorder(@Body() updateResourceOrdersDto: UpdateResourceOrdersDto): Promise<void> {
        return this.resourceService.reorderResources(updateResourceOrdersDto);
    }

    @Patch(':resourceId')
    @ApiOperation({ summary: '자원 수정' })
    @ApiOkResponse({
        status: 200,
        description: '자원이 성공적으로 수정되었습니다.',
        type: ResourceResponseDto,
    })
    async update(
        @Param('resourceId') resourceId: string,
        @Body() updateResourceInfoDto: UpdateResourceInfoDto,
    ): Promise<ResourceResponseDto> {
        return this.resourceService.updateResource(resourceId, updateResourceInfoDto);
    }

    @Patch(':resourceId/availability')
    @ApiOperation({ summary: '자원 예약 가능 상태 수정' })
    @ApiOkResponse({
        status: 200,
        description: '자원이 성공적으로 수정되었습니다.',
        type: ResourceResponseDto,
    })
    async updateAvailability(
        @Param('resourceId') resourceId: string,
        @Body() updateResourceInfoDto: UpdateResourceInfoDto,
    ): Promise<ResourceResponseDto> {
        return this.resourceService.updateResource(resourceId, updateResourceInfoDto);
    }

    @Delete(':resourceId')
    @ApiOperation({ summary: '자원 삭제' })
    @ApiOkResponse({
        status: 200,
        description: '자원이 성공적으로 삭제되었습니다.',
    })
    async remove(@Param('resourceId') resourceId: string): Promise<void> {
        return this.resourceService.deleteResource(resourceId);
    }
}
