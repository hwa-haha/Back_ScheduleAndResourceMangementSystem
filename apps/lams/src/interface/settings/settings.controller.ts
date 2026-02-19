import {
    Controller,
    Get,
    Patch,
    Post,
    Delete,
    Body,
    UseGuards,
    Param,
    ParseUUIDPipe,
    BadRequestException,
    Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SettingsBusinessService } from '../../business/settings-business/settings-business.service';
import {
    UpdateEmployeeDepartmentPermissionRequestDto,
    UpdateEmployeeDepartmentPermissionResponseDto,
    GetPermissionRelatedEmployeeListRequestDto,
    GetPermissionRelatedEmployeeListResponseDto,
    GetPermissionRelatedEmployeeListWithExtraInfoResponseDto,
    GetEmployeePermissionListRequestDto,
    GetEmployeePermissionListResponseDto,
} from './dto/employee-permission.dto';
import {
    GetDepartmentListForPermissionResponseDto,
    GetDepartmentPermissionListResponseDto,
} from './dto/department-permission.dto';
import { UpdateEmployeeExtraInfoRequestDto, UpdateEmployeeExtraInfoResponseDto } from './dto/employee-extra-info.dto';
import {
    GetHolidayListRequestDto,
    GetHolidayListResponseDto,
    CreateHolidayInfoRequestDto,
    CreateHolidayInfoResponseDto,
    UpdateHolidayInfoRequestDto,
    UpdateHolidayInfoResponseDto,
    DeleteHolidayInfoRequestDto,
    DeleteHolidayInfoResponseDto,
} from './dto/holiday-info.dto';
import {
    GetWorkTimeOverrideListRequestDto,
    GetWorkTimeOverrideListResponseDto,
    CreateWorkTimeOverrideRequestDto,
    CreateWorkTimeOverrideResponseDto,
    UpdateWorkTimeOverrideRequestDto,
    UpdateWorkTimeOverrideResponseDto,
    DeleteWorkTimeOverrideRequestDto,
    DeleteWorkTimeOverrideResponseDto,
} from './dto/work-time-override.dto';
import {
    GetAttendanceTypeListResponseDto,
    CreateAttendanceTypeRequestDto,
    CreateAttendanceTypeResponseDto,
    UpdateAttendanceTypeRequestDto,
    UpdateAttendanceTypeResponseDto,
    DeleteAttendanceTypeResponseDto,
} from './dto/attendance-type.dto';
import { IGetDepartmentListForPermissionResponse } from '../../context/settings-context/interfaces';
import {
    IGetPermissionRelatedEmployeeListResponse,
    IGetEmployeePermissionListResponse,
    IGetDepartmentPermissionListResponse,
} from '../../context/settings-context/interfaces';
import { IGetHolidayListResponse } from '../../context/settings-context/interfaces';
import { IGetWorkTimeOverrideListResponse } from '../../context/settings-context/interfaces';
import { IGetAttendanceTypeListResponse } from '../../context/settings-context/interfaces';
import { IUpdateEmployeeDepartmentPermissionResponse } from '../../context/settings-context/interfaces';
import { IUpdateEmployeeExtraInfoResponse } from '../../context/settings-context/interfaces';
import { ICreateHolidayInfoResponse } from '../../context/settings-context/interfaces';
import { IUpdateHolidayInfoResponse } from '../../context/settings-context/interfaces';
import { IDeleteHolidayInfoResponse } from '../../context/settings-context/interfaces';
import { ICreateWorkTimeOverrideResponse } from '../../context/settings-context/interfaces';
import { IUpdateWorkTimeOverrideResponse } from '../../context/settings-context/interfaces';
import { IDeleteWorkTimeOverrideResponse } from '../../context/settings-context/interfaces';
import { ICreateAttendanceTypeResponse } from '../../context/settings-context/interfaces';
import { IUpdateAttendanceTypeResponse } from '../../context/settings-context/interfaces';
import { IDeleteAttendanceTypeResponse } from '../../context/settings-context/interfaces';
import { User } from '../../../libs/decorators/user.decorator';

/**
 * 설정 관리 컨트롤러
 *
 * 부서에 대한 권한 관리 및 직원 설정 관리 API를 제공합니다.
 */
@ApiTags('4. 설정 관리')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsBusinessService: SettingsBusinessService) {}

    /**
     * 권한 관리용 부서 목록 조회
     *
     * 퇴사자 부서를 제외한 전체 부서 목록을 조회합니다.
     */
    @Get('permissions/departments')
    @ApiOperation({
        summary: '권한 관리용 부서 목록 조회',
        description: '퇴사자 부서를 제외한 전체 부서 목록을 조회합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '부서 목록 조회 성공',
        type: GetDepartmentListForPermissionResponseDto,
    })
    async getDepartmentListForPermission(): Promise<IGetDepartmentListForPermissionResponse> {
        return await this.settingsBusinessService.권한관련부서목록을조회한다({});
    }

    /**
     * 권한 관련 직원 목록 조회
     *
     * 모든 직원 목록을 조회하고, 각 직원별로 어느 부서에 권한을 가지고 있는지 정보를 반환합니다.
     * 직원명과 부서명으로 검색이 가능합니다.
     */
    @Get('permissions/employees')
    @ApiOperation({
        summary: '권한 관련 직원 목록 조회',
        description:
            '모든 직원 목록을 조회하고, 각 직원별로 어느 부서에 권한을 가지고 있는지 정보를 반환합니다. 직원명과 부서명으로 검색이 가능합니다.',
    })
    @ApiQuery({
        name: 'employeeName',
        description: '직원명 검색 (선택사항)',
        example: '홍길동',
        required: false,
    })
    @ApiQuery({
        name: 'departmentName',
        description: '부서명 검색 (선택사항)',
        example: '개발팀',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: '권한 관련 직원 목록 조회 성공',
        type: GetPermissionRelatedEmployeeListResponseDto,
    })
    async getPermissionRelatedEmployeeList(
        @Query() dto: GetPermissionRelatedEmployeeListRequestDto,
    ): Promise<IGetPermissionRelatedEmployeeListResponse> {
        return await this.settingsBusinessService.권한관련직원목록을조회한다({
            employeeName: dto.employeeName,
            departmentName: dto.departmentName,
        });
    }

    /**
     * 권한 관련 직원 목록 조회 (추가정보 포함)
     *
     * 직원별 권한 정보와 함께 추가정보(대시보드 요약 제외 여부 등)를 반환합니다.
     * 직원명과 부서명으로 검색이 가능합니다.
     */
    @Get('permissions/employees/with-extra-info')
    @ApiOperation({
        summary: '권한 관련 직원 목록 조회 (추가정보 포함)',
        description:
            '직원별 권한 정보와 함께 추가정보(대시보드 요약 제외 여부 등)를 반환합니다. 직원명과 부서명으로 검색이 가능합니다.',
    })
    @ApiQuery({
        name: 'employeeName',
        description: '직원명 검색 (선택사항)',
        example: '홍길동',
        required: false,
    })
    @ApiQuery({
        name: 'departmentName',
        description: '부서명 검색 (선택사항)',
        example: '개발팀',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: '권한 관련 직원 목록 조회 성공 (추가정보 포함)',
        type: GetPermissionRelatedEmployeeListWithExtraInfoResponseDto,
    })
    async getPermissionRelatedEmployeeListWithExtraInfo(
        @Query() dto: GetPermissionRelatedEmployeeListRequestDto,
    ): Promise<GetPermissionRelatedEmployeeListWithExtraInfoResponseDto> {
        const result = await this.settingsBusinessService.권한관련직원목록및추가정보를조회한다({
            employeeName: dto.employeeName,
            departmentName: dto.departmentName,
        });
        return {
            employees: result.employees.map(({ id, employeeNumber, employeeName, extraInfo }) => ({
                id,
                employeeNumber,
                employeeName,
                extraInfo: extraInfo ?? null,
            })),
            totalCount: result.totalCount,
        };
    }

    /**
     * 직원의 권한 목록 조회
     *
     * 특정 직원의 부서별 권한 정보를 조회합니다.
     */
    @Get('permissions/employees/:employeeId')
    @ApiOperation({
        summary: '직원의 권한 목록 조회',
        description: '특정 직원의 부서별 권한 정보를 조회합니다.',
    })
    @ApiParam({
        name: 'employeeId',
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: 200,
        description: '직원의 권한 목록 조회 성공',
        type: GetEmployeePermissionListResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: '직원을 찾을 수 없음',
    })
    async getEmployeePermissionList(
        @Param('employeeId', ParseUUIDPipe) employeeId: string,
    ): Promise<IGetEmployeePermissionListResponse> {
        return await this.settingsBusinessService.직원의권한목록을조회한다({
            employeeId,
        });
    }

    /**
     * 특정 부서별 직원 권한 목록 조회
     *
     * 특정 부서에 대한 권한을 가진 직원 목록과 권한 정보(보기/검토)를 조회합니다.
     */
    @Get('permissions/departments/:departmentId')
    @ApiOperation({
        summary: '특정 부서별 직원 권한 목록 조회',
        description: '특정 부서에 대한 권한을 가진 직원 목록과 권한 정보(보기/검토)를 조회합니다.',
    })
    @ApiParam({
        name: 'departmentId',
        description: '부서 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: 200,
        description: '부서별 직원 권한 목록 조회 성공',
        type: GetDepartmentPermissionListResponseDto,
    })
    @ApiResponse({
        status: 404,
        description: '부서를 찾을 수 없음',
    })
    async getDepartmentPermissionList(
        @Param('departmentId', ParseUUIDPipe) departmentId: string,
    ): Promise<IGetDepartmentPermissionListResponse> {
        return await this.settingsBusinessService.부서별직원권한목록을조회한다({
            departmentId,
        });
    }

    /**
     * 직원-부서 권한 변경
     *
     * 직원의 여러 부서에 대한 접근권한과 검토권한을 변경합니다.
     * 해당 직원의 모든 기존 권한을 삭제한 후 요청된 부서 권한들을 재생성합니다.
     */
    @Patch('permissions')
    @ApiOperation({
        summary: '직원-부서 권한 변경',
        description:
            '직원의 여러 부서에 대한 접근권한과 검토권한을 변경합니다. 해당 직원의 모든 기존 권한을 삭제한 후 요청된 부서 권한들을 재생성합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '권한 변경 성공',
        type: UpdateEmployeeDepartmentPermissionResponseDto,
    })
    async updateEmployeeDepartmentPermission(
        @Body() dto: UpdateEmployeeDepartmentPermissionRequestDto,
        @User('id') userId: string,
    ): Promise<IUpdateEmployeeDepartmentPermissionResponse> {
        return await this.settingsBusinessService.직원부서권한을변경한다({
            employeeId: dto.employeeId,
            departments: dto.departments.map((dept) => ({
                departmentId: dept.departmentId,
                hasAccessPermission: dept.hasAccessPermission,
                hasReviewPermission: dept.hasReviewPermission,
            })),
            performedBy: userId,
        });
    }

    /**
     * 직원 추가 정보 변경
     *
     * 직원의 대시보드 요약 표시 여부를 변경합니다.
     */
    @Patch('employee-extra-info')
    @ApiOperation({
        summary: '직원 추가 정보 변경',
        description: '직원의 대시보드 요약 표시 여부를 변경합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '직원 추가 정보 변경 성공',
        type: UpdateEmployeeExtraInfoResponseDto,
    })
    async updateEmployeeExtraInfo(
        @Body() dto: UpdateEmployeeExtraInfoRequestDto,
        @User('id') userId: string,
    ): Promise<IUpdateEmployeeExtraInfoResponse> {
        return await this.settingsBusinessService.직원추가정보를변경한다({
            employeeId: dto.employeeId,
            isExcludedFromSummary: dto.isExcludedFromSummary,
            performedBy: userId,
            year: dto.year,
            month: dto.month,
        });
    }

    /**
     * 휴일 목록 조회
     *
     * 전체 공휴일 목록을 조회합니다. 연도 파라미터를 제공하면 해당 연도의 휴일만 조회합니다.
     */
    @Get('holidays')
    @ApiOperation({
        summary: '휴일 목록 조회',
        description: '전체 공휴일 목록을 조회합니다. 연도 파라미터를 제공하면 해당 연도의 휴일만 조회합니다.',
    })
    @ApiQuery({
        name: 'year',
        description: '연도 (선택사항)',
        example: '2026',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: '휴일 목록 조회 성공',
        type: GetHolidayListResponseDto,
    })
    async getHolidayList(@Query() dto: GetHolidayListRequestDto): Promise<IGetHolidayListResponse> {
        return await this.settingsBusinessService.휴일목록을조회한다({ year: dto.year });
    }

    /**
     * 휴일 정보 생성
     *
     * 새로운 공휴일을 추가합니다.
     */
    @Post('holidays')
    @ApiOperation({
        summary: '휴일 정보 생성',
        description: '새로운 공휴일을 추가합니다.',
    })
    @ApiResponse({
        status: 201,
        description: '휴일 정보 생성 성공',
        type: CreateHolidayInfoResponseDto,
    })
    async createHolidayInfo(
        @Body() dto: CreateHolidayInfoRequestDto,
        @User('id') userId: string,
    ): Promise<ICreateHolidayInfoResponse> {
        return await this.settingsBusinessService.휴일정보를생성한다({
            holidayName: dto.holidayName,
            holidayDate: dto.holidayDate,
            performedBy: userId,
        });
    }

    /**
     * 휴일 정보 수정
     *
     * 기존 공휴일 정보를 수정합니다.
     */
    @Patch('holidays')
    @ApiOperation({
        summary: '휴일 정보 수정',
        description: '기존 공휴일 정보를 수정합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '휴일 정보 수정 성공',
        type: UpdateHolidayInfoResponseDto,
    })
    async updateHolidayInfo(
        @Body() dto: UpdateHolidayInfoRequestDto,
        @User('id') userId: string,
    ): Promise<IUpdateHolidayInfoResponse> {
        return await this.settingsBusinessService.휴일정보를수정한다({
            id: dto.id,
            holidayName: dto.holidayName,
            holidayDate: dto.holidayDate,
            performedBy: userId,
        });
    }

    /**
     * 휴일 정보 삭제
     *
     * 공휴일을 삭제합니다.
     */
    @Delete('holidays')
    @ApiOperation({
        summary: '휴일 정보 삭제',
        description: '공휴일을 삭제합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '휴일 정보 삭제 성공',
        type: DeleteHolidayInfoResponseDto,
    })
    async deleteHolidayInfo(
        @Body() dto: DeleteHolidayInfoRequestDto,
        @User('id') userId: string,
    ): Promise<IDeleteHolidayInfoResponse> {
        return await this.settingsBusinessService.휴일정보를삭제한다({
            id: dto.id,
            performedBy: userId,
        });
    }

    /**
     * 특별근태시간 목록 조회
     *
     * 전체 특별근태시간 목록을 조회합니다. 연도별로 필터링할 수 있습니다.
     */
    @Get('work-time-overrides')
    @ApiOperation({
        summary: '특별근태시간 목록 조회',
        description: '전체 특별근태시간 목록을 조회합니다. 연도별로 필터링할 수 있습니다.',
    })
    @ApiQuery({
        name: 'year',
        description: '연도 필터 (yyyy 형식, 생략 시 전체 조회)',
        example: '2026',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: '특별근태시간 목록 조회 성공',
        type: GetWorkTimeOverrideListResponseDto,
    })
    async getWorkTimeOverrideList(
        @Query() dto: GetWorkTimeOverrideListRequestDto,
    ): Promise<IGetWorkTimeOverrideListResponse> {
        return await this.settingsBusinessService.특별근태시간목록을조회한다({ year: dto.year });
    }

    /**
     * 특별근태시간 생성
     *
     * 특정 날짜의 근무시간을 커스터마이징합니다.
     */
    @Post('work-time-overrides')
    @ApiOperation({
        summary: '특별근태시간 생성',
        description: '특정 날짜의 근무시간을 커스터마이징합니다.',
    })
    @ApiResponse({
        status: 201,
        description: '특별근태시간 생성 성공',
        type: CreateWorkTimeOverrideResponseDto,
    })
    async createWorkTimeOverride(
        @Body() dto: CreateWorkTimeOverrideRequestDto,
        @User('id') userId: string,
    ): Promise<ICreateWorkTimeOverrideResponse> {
        return await this.settingsBusinessService.특별근태시간을생성한다({
            date: dto.date,
            startWorkTime: dto.startWorkTime,
            endWorkTime: dto.endWorkTime,
            reason: dto.reason,
            performedBy: userId,
        });
    }

    /**
     * 특별근태시간 수정
     *
     * 기존 특별근태시간 정보를 수정합니다.
     */
    @Patch('work-time-overrides')
    @ApiOperation({
        summary: '특별근태시간 수정',
        description: '기존 특별근태시간 정보를 수정합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '특별근태시간 수정 성공',
        type: UpdateWorkTimeOverrideResponseDto,
    })
    async updateWorkTimeOverride(
        @Body() dto: UpdateWorkTimeOverrideRequestDto,
        @User('id') userId: string,
    ): Promise<IUpdateWorkTimeOverrideResponse> {
        return await this.settingsBusinessService.특별근태시간을수정한다({
            id: dto.id,
            date: dto.date,
            startWorkTime: dto.startWorkTime,
            endWorkTime: dto.endWorkTime,
            reason: dto.reason,
            performedBy: userId,
        });
    }

    /**
     * 특별근태시간 삭제
     *
     * 특별근태시간을 삭제합니다.
     */
    @Delete('work-time-overrides')
    @ApiOperation({
        summary: '특별근태시간 삭제',
        description: '특별근태시간을 삭제합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '특별근태시간 삭제 성공',
        type: DeleteWorkTimeOverrideResponseDto,
    })
    async deleteWorkTimeOverride(
        @Body() dto: DeleteWorkTimeOverrideRequestDto,
        @User('id') userId: string,
    ): Promise<IDeleteWorkTimeOverrideResponse> {
        return await this.settingsBusinessService.특별근태시간을삭제한다({
            id: dto.id,
            performedBy: userId,
        });
    }

    /**
     * 근태유형 목록 조회
     *
     * 전체 근태유형 목록을 조회합니다.
     */
    @Get('attendance-types')
    @ApiOperation({
        summary: '근태유형 목록 조회',
        description: '전체 근태유형 목록을 조회합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '근태유형 목록 조회 성공',
        type: GetAttendanceTypeListResponseDto,
    })
    async getAttendanceTypeList(): Promise<IGetAttendanceTypeListResponse> {
        return await this.settingsBusinessService.근태유형목록을조회한다({});
    }

    /**
     * 근태유형 생성
     *
     * 새로운 근태유형을 추가합니다.
     */
    @Post('attendance-types')
    @ApiOperation({
        summary: '근태유형 생성',
        description: '새로운 근태유형을 추가합니다.',
    })
    @ApiResponse({
        status: 201,
        description: '근태유형 생성 성공',
        type: CreateAttendanceTypeResponseDto,
    })
    async createAttendanceType(
        @Body() dto: CreateAttendanceTypeRequestDto,
        @User('id') userId: string,
    ): Promise<ICreateAttendanceTypeResponse> {
        return await this.settingsBusinessService.근태유형을생성한다({
            title: dto.title,
            workTime: dto.workTime,
            isRecognizedWorkTime: dto.isRecognizedWorkTime,
            startWorkTime: dto.startWorkTime,
            endWorkTime: dto.endWorkTime,
            deductedAnnualLeave: dto.deductedAnnualLeave,
            code: dto.code,
            isActive: dto.isActive,
            performedBy: userId,
        });
    }

    /**
     * 근태유형 수정
     *
     * 기존 근태유형 정보를 수정합니다.
     */
    @Patch('attendance-types/:id')
    @ApiOperation({
        summary: '근태유형 수정',
        description: '기존 근태유형 정보를 수정합니다.',
    })
    @ApiParam({ name: 'id', description: '근태유형 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '근태유형 수정 성공',
        type: UpdateAttendanceTypeResponseDto,
    })
    async updateAttendanceType(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateAttendanceTypeRequestDto,
        @User('id') userId: string,
    ): Promise<IUpdateAttendanceTypeResponse> {
        return await this.settingsBusinessService.근태유형을수정한다({
            id,
            title: dto.title,
            workTime: dto.workTime,
            isRecognizedWorkTime: dto.isRecognizedWorkTime,
            startWorkTime: dto.startWorkTime,
            endWorkTime: dto.endWorkTime,
            deductedAnnualLeave: dto.deductedAnnualLeave,
            code: dto.code,
            isActive: dto.isActive,
            performedBy: userId,
        });
    }

    /**
     * 근태유형 삭제
     *
     * 근태유형을 삭제합니다.
     */
    @Delete('attendance-types/:id')
    @ApiOperation({
        summary: '근태유형 삭제',
        description: '근태유형을 삭제합니다.',
    })
    @ApiParam({ name: 'id', description: '근태유형 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({
        status: 200,
        description: '근태유형 삭제 성공',
        type: DeleteAttendanceTypeResponseDto,
    })
    async deleteAttendanceType(
        @Param('id', ParseUUIDPipe) id: string,
        @User('id') userId: string,
    ): Promise<IDeleteAttendanceTypeResponse> {
        return await this.settingsBusinessService.근태유형을삭제한다({
            id,
            performedBy: userId,
        });
    }
}
