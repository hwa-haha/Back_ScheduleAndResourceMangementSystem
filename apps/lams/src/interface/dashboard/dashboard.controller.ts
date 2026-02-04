import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
    GetDepartmentMonthlyAverageWorkHoursRequestDto,
    GetDepartmentMonthlyAverageWorkHoursResponseDto,
} from './dto/get-department-monthly-average-work-hours.dto';
import {
    GetDepartmentMonthlyEmployeeWorkHoursRequestDto,
    GetDepartmentMonthlyEmployeeWorkHoursResponseDto,
} from './dto/get-department-monthly-employee-work-hours.dto';
import {
    GetDepartmentMonthlyEmployeeAttendanceRequestDto,
    GetDepartmentMonthlyEmployeeAttendanceResponseDto,
} from './dto/get-department-monthly-employee-attendance.dto';
import {
    GetDepartmentWeeklyTopEmployeesRequestDto,
    GetDepartmentWeeklyTopEmployeesResponseDto,
} from './dto/get-department-weekly-top-employees.dto';
import {
    GetDepartmentSnapshotsRequestDto,
    GetDepartmentSnapshotsResponseDto,
    SnapshotInfoDto,
} from './dto/get-department-snapshots.dto';
import {
    GetEmployeeAttendanceDetailRequestDto,
    GetEmployeeAttendanceDetailResponseDto,
} from './dto/get-employee-attendance-detail.dto';
import { DashboardBusinessService } from '../../business/dashboard-business/dashboard-business.service';
import { IGetEmployeeAttendanceDetailResponse } from '../../context/dashboard-context/interfaces/response/get-employee-attendance-detail-response.interface';

/**
 * 대시보드 컨트롤러
 *
 * 대시보드 관련 API를 제공합니다.
 */
@ApiTags('대시보드')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardBusinessService: DashboardBusinessService) {}
    /**
     * 부서별 월별 일평균 근무시간 조회 (1~12월 연간)
     *
     * 연도별로 1월부터 12월까지의 월별 일평균 근무시간만 조회합니다.
     */
    @Get('department/monthly-average-work-hours')
    @ApiOperation({
        summary: '부서별 월별 일평균 근무시간 조회',
        description: '연도별로 1월부터 12월까지의 월별 일평균 근무시간만 조회합니다.',
    })
    @ApiQuery({
        name: 'departmentId',
        description: '부서 ID',
        example: 'd2860a56-99e0-4e79-b70e-0461eef212ac',
        required: true,
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiResponse({
        status: 200,
        description: '부서별 월별 일평균 근무시간 조회 성공',
        type: GetDepartmentMonthlyAverageWorkHoursResponseDto,
    })
    async getDepartmentMonthlyAverageWorkHours(
        @Query() query: GetDepartmentMonthlyAverageWorkHoursRequestDto,
    ): Promise<GetDepartmentMonthlyAverageWorkHoursResponseDto> {
        return await this.dashboardBusinessService.부서별월별일평균근무시간을조회한다(query.departmentId, query.year);
    }

    /**
     * 부서별 월별 직원별 근무시간 조회 (특정 연·월)
     *
     * 선택한 연·월에 해당 부서 직원들의 근무시간 상세(총 근무시간, 지각·조퇴, 주차별 근무시간)를 내림차순으로 조회합니다.
     */
    @Get('department/monthly-employee-work-hours')
    @ApiOperation({
        summary: '부서별 월별 직원별 근무시간 조회',
        description:
            '선택한 연·월에 해당 부서 직원들의 근무시간 상세(총 근무시간, 지각·조퇴, 주차별 근무시간)를 내림차순으로 조회합니다.',
    })
    @ApiQuery({
        name: 'departmentId',
        description: '부서 ID',
        example: 'd2860a56-99e0-4e79-b70e-0461eef212ac',
        required: true,
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월 (01-12)', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '부서별 월별 직원별 근무시간 조회 성공',
        type: GetDepartmentMonthlyEmployeeWorkHoursResponseDto,
    })
    async getDepartmentMonthlyEmployeeWorkHours(
        @Query() query: GetDepartmentMonthlyEmployeeWorkHoursRequestDto,
    ): Promise<GetDepartmentMonthlyEmployeeWorkHoursResponseDto> {
        return await this.dashboardBusinessService.부서별월별직원별근무시간을조회한다(
            query.departmentId,
            query.year,
            query.month,
        );
    }

    /**
     * 부서별 월별 직원별 근무내역 조회
     *
     * 근태사용내역을 기준으로 출장, 연차, 결근, 지각에 대한 정보를 조회합니다.
     */
    @Get('department/monthly-employee-attendance')
    @ApiOperation({
        summary: '부서별 월별 직원별 근무내역 조회',
        description: '근태사용내역을 기준으로 출장, 연차, 결근, 지각에 대한 정보를 조회합니다.',
    })
    @ApiQuery({
        name: 'departmentId',
        description: '부서 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true,
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '부서별 월별 직원별 근무내역 조회 성공',
        type: GetDepartmentMonthlyEmployeeAttendanceResponseDto,
    })
    async getDepartmentMonthlyEmployeeAttendance(
        @Query() query: GetDepartmentMonthlyEmployeeAttendanceRequestDto,
    ): Promise<GetDepartmentMonthlyEmployeeAttendanceResponseDto> {
        return await this.dashboardBusinessService.부서별월별직원별근무내역을조회한다(
            query.departmentId,
            query.year,
            query.month,
        );
    }

    /**
     * 부서별 월별 주차별 주간근무시간 상위 5명 조회
     *
     * 각 주차별로 주간근무시간이 높은 상위 5명의 직원을 조회합니다.
     */
    @Get('department/weekly-top-employees')
    @ApiOperation({
        summary: '부서별 월별 주차별 주간근무시간 상위 5명 조회',
        description: '각 주차별로 주간근무시간이 높은 상위 5명의 직원을 조회합니다.',
    })
    @ApiQuery({
        name: 'departmentId',
        description: '부서 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true,
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '부서별 월별 주차별 주간근무시간 상위 5명 조회 성공',
        type: GetDepartmentWeeklyTopEmployeesResponseDto,
    })
    async getDepartmentWeeklyTopEmployees(
        @Query() query: GetDepartmentWeeklyTopEmployeesRequestDto,
    ): Promise<GetDepartmentWeeklyTopEmployeesResponseDto> {
        return await this.dashboardBusinessService.부서별월별주차별주간근무시간상위5명을조회한다(
            query.departmentId,
            query.year,
            query.month,
        );
    }

    /**
     * 부서별 연도, 월별 스냅샷 조회
     *
     * 특정 부서의 연도, 월별 스냅샷 목록을 조회합니다.
     */
    @Get('department/snapshots')
    @ApiOperation({
        summary: '부서별 연도, 월별 스냅샷 조회',
        description: '특정 부서의 연도, 월별 스냅샷 목록을 조회합니다.',
    })
    @ApiQuery({
        name: 'departmentId',
        description: '부서 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true,
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '부서별 연도, 월별 스냅샷 조회 성공 (스냅샷이 없으면 null)',
        type: SnapshotInfoDto,
    })
    async getDepartmentSnapshots(
        @Query() query: GetDepartmentSnapshotsRequestDto,
    ): Promise<GetDepartmentSnapshotsResponseDto> {
        return await this.dashboardBusinessService.부서별연도월별스냅샷을조회한다(
            query.departmentId,
            query.year,
            query.month,
        );
    }

    /**
     * 연도, 월별 직원 근태상세 조회
     *
     * 특정 직원의 연도, 월별 근태 상세 정보를 조회합니다.
     */
    @Get('employee/attendance-detail')
    @ApiOperation({
        summary: '연도, 월별 직원 근태상세 조회',
        description: '특정 직원의 연도, 월별 근태 상세 정보를 조회합니다.',
    })
    @ApiQuery({
        name: 'employeeId',
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true,
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '연도, 월별 직원 근태상세 조회 성공',
        type: GetEmployeeAttendanceDetailResponseDto,
    })
    async getEmployeeAttendanceDetail(
        @Query() query: GetEmployeeAttendanceDetailRequestDto,
    ): Promise<IGetEmployeeAttendanceDetailResponse> {
        return await this.dashboardBusinessService.연도월별직원근태상세를조회한다(
            query.employeeId,
            query.year,
            query.month,
        );
    }
}
