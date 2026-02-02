import {
    Controller,
    Get,
    Post,
    Put,
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
import {
    ReplaceProjectAssignmentsRequestDto,
    ReplaceProjectAssignmentsResponseDto,
    AssignProjectResponseDto,
} from './dto/assigned-project.dto';
import { CreateWorkHoursRequestDto, CreateWorkHoursResponseDto, UpdateWorkHoursRequestDto } from './dto/work-hours.dto';
import {
    GetMonthlyWorkHoursRequestDto,
    GetMonthlyWorkHoursResponseDto,
    GetDailyWorkHoursRequestDto,
    GetDailyWorkHoursResponseDto,
} from './dto/monthly-work-hours.dto';
import {
    GetProjectListResponseDto,
    GetEmployeeWithAssignedProjectsResponseDto,
    GetEmployeeAssignedProjectsResponseDto,
} from './dto/project.dto';
import {
    GetWorkHoursStatisticsRequestDto,
    GetWorkHoursStatisticsResponseDto,
    GetWorkHoursStatisticsByProjectRequestDto,
    GetWorkHoursStatisticsByProjectResponseDto,
} from './dto/work-hours-statistics.dto';
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
     * 직원 목록 및 할당 프로젝트 조회
     */
    @Get('employees-with-assignments')
    @ApiOperation({
        summary: '직원 목록 및 할당 프로젝트 조회',
        description: '조직도에 재직 중인 직원 목록과 각 직원에게 할당된 활성 프로젝트를 반환합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '직원 목록 및 할당 프로젝트 조회 성공',
        type: GetEmployeeWithAssignedProjectsResponseDto,
    })
    async getEmployeeWithAssignedProjects(): Promise<GetEmployeeWithAssignedProjectsResponseDto> {
        return await this.workHoursBusinessService.직원목록및할당프로젝트조회한다({});
    }

    /**
     * 직원별 할당 프로젝트 목록 조회
     */
    @Get('employees/:employeeId/assigned-projects')
    @ApiOperation({
        summary: '직원별 할당 프로젝트 목록 조회',
        description: '직원 ID를 받아 해당 직원의 활성 할당 프로젝트 목록을 반환합니다.',
    })
    @ApiParam({ name: 'employeeId', description: '직원 ID (UUID)' })
    @ApiResponse({
        status: 200,
        description: '직원별 할당 프로젝트 목록 조회 성공',
        type: GetEmployeeAssignedProjectsResponseDto,
    })
    async getEmployeeAssignedProjects(
        @Param('employeeId', ParseUUIDPipe) employeeId: string,
    ): Promise<GetEmployeeAssignedProjectsResponseDto> {
        return await this.workHoursBusinessService.직원별할당프로젝트목록을조회한다(employeeId);
    }

    /**
     * 시수 통계 조회 (직원 기준)
     *
     * 월별·선택 부서(및 하위부서) 부서원 기준, 해당 월 일수별 입력 시수 총합.
     * 직원명·부서명 검색, 직원·프로젝트 필터 지원.
     */
    @Get('statistics/by-employee')
    @ApiOperation({
        summary: '시수 통계 조회 (직원 기준)',
        description:
            '선택된 부서와 하위 부서의 부서원을 기준으로, 해당 월 일수별 입력된 시수의 총 시간을 직원별로 조회합니다. 직원명·부서명 검색, 직원별·프로젝트별 필터를 지원합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '시수 통계 조회 성공',
        type: GetWorkHoursStatisticsResponseDto,
    })
    async getWorkHoursStatisticsByEmployee(
        @Query() dto: GetWorkHoursStatisticsRequestDto,
    ): Promise<GetWorkHoursStatisticsResponseDto> {
        const monthStr = dto.month.length === 1 ? dto.month.padStart(2, '0') : dto.month;
        return await this.workHoursBusinessService.시수통계를조회한다({
            year: dto.year,
            month: monthStr,
            departmentIds: dto.departmentIds,
            employeeNameSearch: dto.employeeNameSearch,
            departmentNameSearch: dto.departmentNameSearch,
            employeeIds: dto.employeeIds,
        });
    }

    /**
     * 시수 통계 조회 (프로젝트 기준)
     *
     * project_id 기준으로 시수를 그룹핑하여, 해당 월 일자별 시수와 총합을 조회.
     */
    @Get('statistics/by-project')
    @ApiOperation({
        summary: '시수 통계 조회 (프로젝트 기준)',
        description:
            '할당프로젝트의 project_id 기준으로 시수를 그룹핑하여, 해당 월 1일~말일 일자별 시수(시간)와 총합을 프로젝트별로 조회합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '프로젝트 기준 시수 통계 조회 성공',
        type: GetWorkHoursStatisticsByProjectResponseDto,
    })
    async getWorkHoursStatisticsByProject(
        @Query() dto: GetWorkHoursStatisticsByProjectRequestDto,
    ): Promise<GetWorkHoursStatisticsByProjectResponseDto> {
        const monthStr = dto.month.length === 1 ? dto.month.padStart(2, '0') : dto.month;
        return await this.workHoursBusinessService.프로젝트기준시수통계를조회한다({
            year: dto.year,
            month: monthStr,
            projectIds: dto.projectIds,
        });
    }

    /**
     * 직원 프로젝트 할당 일괄 갱신
     *
     * 해당 직원의 기존 할당을 전부 비활성화(is_active=false)한 뒤,
     * 요청한 프로젝트만 활성화(기존 행 있으면 갱신, 없으면 생성)합니다.
     * 시수(work_hours)가 같은 할당 행에 연결되어 있으므로 삭제하지 않고 활성화 컬럼으로 관리합니다.
     */
    @Put('assign-projects')
    @ApiOperation({
        summary: '직원 프로젝트 할당 일괄 갱신',
        description:
            '해당 직원의 기존 할당을 전부 비활성화한 뒤, 요청한 프로젝트만 활성화합니다. 기존 할당 행이 있으면 활성화·갱신하고, 없으면 새로 생성합니다. 시수 이력은 같은 할당 행에 연결되므로 삭제하지 않고 is_active로 관리합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '프로젝트 할당 일괄 갱신 성공',
        type: ReplaceProjectAssignmentsResponseDto,
    })
    async replaceProjectAssignments(
        @Body() dto: ReplaceProjectAssignmentsRequestDto,
        @User('id') userId: string,
    ): Promise<ReplaceProjectAssignmentsResponseDto> {
        const result = await this.workHoursBusinessService.직원프로젝트할당일괄갱신한다({
            employeeId: dto.employeeId,
            projects: dto.projects.map((p) => ({ projectId: p.projectId })),
            performedBy: userId,
        });
        return {
            assignedProjects: result.assignedProjects.map((ap) => ({
                id: ap.id,
                employeeId: ap.employeeId,
                projectId: ap.projectId,
                startDate: ap.startDate,
                endDate: ap.endDate,
                isActive: ap.isActive,
            })),
        };
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
            undefined,
            undefined,
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
     * 시수 수정 (ID 기준)
     */
    @Put('work-hours/:id')
    @ApiOperation({
        summary: '시수 수정',
        description: '시수 엔티티 ID로 해당 시수를 수정합니다.',
    })
    @ApiParam({ name: 'id', description: '시수 ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '시수 수정 성공',
        type: CreateWorkHoursResponseDto,
    })
    async updateWorkHours(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateWorkHoursRequestDto,
        @User('id') userId: string,
    ): Promise<CreateWorkHoursResponseDto> {
        const workHours = await this.workHoursBusinessService.시수수정한다(
            id,
            {
                startTime: dto.startTime,
                endTime: dto.endTime,
            },
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
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw new BadRequestException('날짜는 yyyy-MM-dd 형식이어야 합니다.');
        }
        await this.workHoursBusinessService.날짜별시수삭제한다(date, userId);
        return { success: true };
    }

    /**
     * 시수 삭제 (ID 기준, 완전 삭제)
     */
    @Delete('work-hours/:id')
    @ApiOperation({
        summary: '시수 삭제',
        description: '시수 엔티티 ID로 해당 시수를 완전 삭제합니다.',
    })
    @ApiParam({ name: 'id', description: '시수 ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '시수 삭제 성공',
    })
    async deleteWorkHours(
        @Param('id', ParseUUIDPipe) id: string,
        @User('id') userId: string,
    ): Promise<{ success: boolean }> {
        await this.workHoursBusinessService.시수삭제한다(id, userId);
        return { success: true };
    }

    /**
     * 월별 시수 현황 조회
     *
     * 토큰 사용: 로그인한 사용자 본인의 월별 시수 현황을 조회합니다.
     */
    @Get('monthly')
    @ApiOperation({
        summary: '월별 시수 현황 조회',
        description: '로그인한 사용자 본인의 월별 시수 현황을 조회합니다.',
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '월별 시수 현황 조회 성공',
        type: GetMonthlyWorkHoursResponseDto,
    })
    async getMonthlyWorkHours(
        @Query() query: GetMonthlyWorkHoursRequestDto,
        @User('id') userId: string,
    ): Promise<GetMonthlyWorkHoursResponseDto> {
        const result = await this.workHoursBusinessService.월별시수현황조회한다(userId, query.year, query.month);
        return {
            employeeId: result.employeeId,
            year: result.year,
            month: result.month,
            workHours: result.workHours,
            totalWorkMinutes: result.totalWorkMinutes,
        };
    }

    /**
     * 일별 시수 상세 조회
     *
     * 토큰 사용: 로그인한 사용자 본인의 해당 날짜 시수 상세를 조회합니다.
     */
    @Get('daily')
    @ApiOperation({
        summary: '일별 시수 상세 조회',
        description: '로그인한 사용자 본인의 특정 날짜 시수 상세를 조회합니다.',
    })
    @ApiQuery({ name: 'date', description: '조회할 날짜 (yyyy-MM-dd)', example: '2026-01-15', required: true })
    @ApiResponse({
        status: 200,
        description: '일별 시수 상세 조회 성공',
        type: GetDailyWorkHoursResponseDto,
    })
    async getDailyWorkHours(
        @Query() query: GetDailyWorkHoursRequestDto,
        @User('id') userId: string,
    ): Promise<GetDailyWorkHoursResponseDto> {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(query.date)) {
            throw new BadRequestException('날짜는 yyyy-MM-dd 형식이어야 합니다.');
        }
        return await this.workHoursBusinessService.일별시수상세조회한다(userId, query.date);
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
