import { Controller, Get, Query } from '@nestjs/common';
import { User } from '../../../../libs/decorators/user.decorator';
import { Employee } from '@libs/modules/employee/employee.entity';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse } from '../../../../libs/decorators/api-responses.decorator';
import { TaskManagementService } from '../task-management.service';
import { TaskListResponseDto, TaskResponseDto } from '../dtos/task-response.dto';

@ApiTags('v2 태스크 관리')
@ApiBearerAuth()
@Controller('v2/tasks')
export class TaskController {
    constructor(private readonly taskManagementService: TaskManagementService) {}

    @Get('')
    @ApiOperation({ summary: '태스크 목록 조회' })
    @ApiDataResponse({
        status: 200,
        description: '태스크 목록 조회 성공',
        type: TaskResponseDto,
    })
    @ApiQuery({
        name: 'type',
        type: String,
        required: false,
        description: '태스크 타입',
        enum: ['전체', '차량반납지연', '소모품교체'],
    })
    async getUserTasks(@User() user: Employee, @Query('type') type?: string): Promise<TaskListResponseDto> {
        return this.taskManagementService.getTaskList(user, type);
    }

    @Get('admin')
    @ApiOperation({ summary: '태스크 목록 조회 (관리자용)' })
    @ApiDataResponse({
        status: 200,
        description: '태스크 목록 조회 성공',
        type: [TaskResponseDto],
    })
    @ApiQuery({
        name: 'type',
        type: String,
        required: false,
        description: '태스크 타입',
        enum: ['전체', '차량반납지연', '소모품교체'],
    })
    async getAdminTasks(@Query('type') type?: string): Promise<TaskResponseDto[]> {
        return this.taskManagementService.getAdminTaskList(type);
    }
}
