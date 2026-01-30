import {
    Controller,
    Get,
    Post,
    Delete,
    Query,
    Body,
    Param,
    ParseUUIDPipe,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { User } from '../../../libs/decorators/user.decorator';
import { WorkHoursBusinessService } from '../../business/work-hours-business/work-hours-business.service';
import { AssignProjectRequestDto, AssignProjectResponseDto } from './dto/assigned-project.dto';
import { CreateWorkHoursRequestDto, CreateWorkHoursResponseDto } from './dto/work-hours.dto';
import { GetMonthlyWorkHoursRequestDto, GetMonthlyWorkHoursResponseDto } from './dto/monthly-work-hours.dto';
import { GetProjectListResponseDto } from './dto/project.dto';
import {
    CreateWageCalculationTypeRequestDto,
    CreateWageCalculationTypeResponseDto,
    GetWageCalculationTypeListResponseDto,
} from '../settings/dto/wage-calculation-type.dto';
import { IGetWageCalculationTypeListResponse } from '../../context/settings-context/interfaces';
import { ICreateWageCalculationTypeResponse } from '../../context/settings-context/interfaces';

/**
 * 시수 관리 컨트롤러
 *
 * 시수 관련 API를 제공합니다.
 */
@ApiTags('시수 관리')
@ApiBearerAuth()
@Controller('work-hours')
export class WorkHoursController {
    constructor(private readonly workHoursBusinessService: WorkHoursBusinessService) {}

    /**
     * 프로젝트 할당
     */
    @Post('assign-project')
    @ApiOperation({
        summary: '직원에 프로젝트 할당',
        description: '직원에게 프로젝트를 할당합니다.',
    })
    @ApiResponse({
        status: 201,
        description: '프로젝트 할당 성공',
        type: AssignProjectResponseDto,
    })
    async assignProject(
        @Body() dto: AssignProjectRequestDto,
        @User('id') userId: string,
    ): Promise<AssignProjectResponseDto> {
        const assignedProject = await this.workHoursBusinessService.프로젝트할당한다(
            dto.employeeId,
            dto.projectId,
            dto.startDate,
            dto.endDate,
            userId,
        );
        return {
            id: assignedProject.id,
            employeeId: assignedProject.employeeId,
            projectId: assignedProject.projectId,
            startDate: assignedProject.startDate,
            endDate: assignedProject.endDate,
            isActive: assignedProject.isActive,
        };
    }

    /**
     * 프로젝트 할당 제거
     */
    @Delete('assign-project/:id')
    @ApiOperation({
        summary: '프로젝트 할당 제거',
        description: '직원의 프로젝트 할당을 제거합니다.',
    })
    @ApiParam({ name: 'id', description: '할당된 프로젝트 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '프로젝트 할당 제거 성공',
    })
    async removeProjectAssignment(
        @Param('id', ParseUUIDPipe) id: string,
        @User('id') userId: string,
    ): Promise<{ success: boolean }> {
        await this.workHoursBusinessService.프로젝트할당제거한다(id, userId);
        return { success: true };
    }

    /**
     * 시수 입력
     */
    @Post('work-hours')
    @ApiOperation({
        summary: '시수 입력',
        description: '시수를 입력합니다.',
    })
    @ApiResponse({
        status: 201,
        description: '시수 입력 성공',
        type: CreateWorkHoursResponseDto,
    })
    async createWorkHours(
        @Body() dto: CreateWorkHoursRequestDto,
        @User('id') userId: string,
    ): Promise<CreateWorkHoursResponseDto> {
        const workHours = await this.workHoursBusinessService.시수입력한다(
            dto.assignedProjectId,
            dto.date,
            dto.startTime,
            dto.endTime,
            dto.workMinutes,
            dto.note,
            userId,
        );
        return {
            id: workHours.id,
            assignedProjectId: workHours.assignedProjectId,
            date: workHours.date,
            startTime: workHours.startTime,
            endTime: workHours.endTime,
            workMinutes: workHours.workMinutes,
            note: workHours.note,
        };
    }

    /**
     * 날짜별 시수 삭제
     */
    @Delete('work-hours/by-date/:date')
    @ApiOperation({
        summary: '날짜별 시수 삭제',
        description: '해당 날짜의 모든 시수를 삭제합니다.',
    })
    @ApiParam({ name: 'date', description: '삭제할 날짜 (yyyy-MM-dd 형식)', example: '2024-01-15' })
    @ApiResponse({
        status: 200,
        description: '시수 삭제 성공',
    })
    async deleteWorkHoursByDate(
        @Param('date') date: string,
        @User('id') userId: string,
    ): Promise<{ success: boolean }> {
        // 날짜 형식 검증
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw new BadRequestException('날짜는 yyyy-MM-dd 형식이어야 합니다.');
        }

        await this.workHoursBusinessService.날짜별시수삭제한다(date, userId);
        return { success: true };
    }

    /**
     * 월별 시수 현황 조회
     */
    @Get('monthly')
    @ApiOperation({
        summary: '월별 시수 현황 조회',
        description: '직원의 월별 시수 현황을 조회합니다.',
    })
    @ApiQuery({ name: 'employeeId', description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000', required: true })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '월별 시수 현황 조회 성공',
        type: GetMonthlyWorkHoursResponseDto,
    })
    async getMonthlyWorkHours(@Query() query: GetMonthlyWorkHoursRequestDto): Promise<GetMonthlyWorkHoursResponseDto> {
        const result = await this.workHoursBusinessService.월별시수현황조회한다(
            query.employeeId,
            query.year,
            query.month,
        );
        return {
            employeeId: result.employeeId,
            year: result.year,
            month: result.month,
            workHours: result.workHours,
            totalWorkMinutes: result.totalWorkMinutes,
        };
    }

    /**
     * 프로젝트 목록 조회
     */
    @Get('projects')
    @ApiOperation({
        summary: '프로젝트 목록 조회',
        description: '활성화된 프로젝트 목록을 조회합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '프로젝트 목록 조회 성공',
        type: GetProjectListResponseDto,
    })
    async getProjectList(): Promise<GetProjectListResponseDto> {
        const result = await this.workHoursBusinessService.프로젝트목록조회한다();
        return {
            projects: result.projects,
            totalCount: result.totalCount,
        };
    }

    /**
     * 임금 계산 유형 목록 조회
     *
     * 전체 임금 계산 유형 목록을 조회합니다.
     */
    @Get('wage-calculation-types')
    @ApiOperation({
        summary: '임금 계산 유형 목록 조회',
        description: '전체 임금 계산 유형 목록을 조회합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '임금 계산 유형 목록 조회 성공',
        type: GetWageCalculationTypeListResponseDto,
    })
    async getWageCalculationTypeList(): Promise<IGetWageCalculationTypeListResponse> {
        return await this.workHoursBusinessService.임금계산유형목록을조회한다({});
    }

    /**
     * 임금 계산 유형 생성
     *
     * 새로운 임금 계산 유형을 생성합니다.
     */
    @Post('wage-calculation-types')
    @ApiOperation({
        summary: '임금 계산 유형 생성',
        description: '새로운 임금 계산 유형을 생성합니다.',
    })
    @ApiResponse({
        status: 201,
        description: '임금 계산 유형 생성 성공',
        type: CreateWageCalculationTypeResponseDto,
    })
    async createWageCalculationType(
        @Body() dto: CreateWageCalculationTypeRequestDto,
        @User('id') userId: string,
    ): Promise<ICreateWageCalculationTypeResponse> {
        return await this.workHoursBusinessService.임금계산유형을생성한다({
            calculationType: dto.calculationType,
            startDate: dto.startDate,
            changedAt: dto.changedAt,
            isCurrentlyApplied: dto.isCurrentlyApplied,
            performedBy: userId,
        });
    }
}
