import { Controller, Get, Query, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '../../../libs/decorators/user.decorator';
import { OrganizationManagementBusinessService } from '../../business/organization-management-business/organization-management-business.service';
import {
    GetDepartmentListRequestDto,
    GetDepartmentListResponseDto,
    GetDepartmentListWithEmployeesResponseDto,
} from './dto/get-department-list.dto';
import { IGetDepartmentListResponse } from '../../context/organization-management-context/interfaces/response/get-department-list-response.interface';
import { IGetDepartmentListWithEmployeesResponse } from '../../context/organization-management-context/interfaces/response/get-department-list-with-employees-response.interface';

/**
 * 조직 관리 컨트롤러
 *
 * 조직 관리 관련 API를 제공합니다.
 */
@ApiTags('조직 관리')
@ApiBearerAuth()
@Controller('organization-management')
export class OrganizationManagementController {
    constructor(private readonly organizationManagementBusinessService: OrganizationManagementBusinessService) {}

    /**
     * 부서 목록 조회
     *
     * 요청받은 연월을 기준으로 해당 월에 유효했던 조직도 상태를 반환합니다.
     * 계층구조와 1차원 배열 두 가지 형태로 제공합니다.
     */
    @Get('departments')
    @ApiOperation({
        summary: '부서 목록 조회',
        description:
            '요청받은 연월을 기준으로 해당 월에 유효했던 조직도 상태를 반환합니다. 계층구조와 1차원 배열 두 가지 형태로 제공합니다.',
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '부서 목록 조회 성공',
        type: GetDepartmentListResponseDto,
    })
    async getDepartmentList(@Query() dto: GetDepartmentListRequestDto): Promise<IGetDepartmentListResponse> {
        if (!dto.year || !dto.month) {
            throw new BadRequestException('연도와 월은 필수입니다.');
        }

        const result = await this.organizationManagementBusinessService.부서목록을조회한다({
            year: dto.year,
            month: dto.month,
        });

        return result;
    }

    /**
     * 접근 권한 기반 부서 목록 조회
     *
     * 로그인한 직원의 employee_department_permission 접근 권한(has_access_permission)이 있는 부서와
     * 그 하위 부서만 반환합니다. 권한이 없으면 빈 목록을 반환합니다.
     */
    @Get('departments/by-access-permission')
    @ApiOperation({
        summary: '접근 권한 기반 부서 목록 조회',
        description:
            '로그인한 직원의 접근 권한(has_access_permission)이 있는 부서와 그 하위 부서만 반환합니다. 연월 기준 조직도 형태로 계층·평탄 목록을 제공합니다.',
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '접근 권한 기반 부서 목록 조회 성공',
        type: GetDepartmentListResponseDto,
    })
    async getDepartmentListByAccessPermission(
        @Query() dto: GetDepartmentListRequestDto,
        @User('id') employeeId: string,
    ): Promise<IGetDepartmentListResponse> {
        if (!dto.year || !dto.month) {
            throw new BadRequestException('연도와 월은 필수입니다.');
        }
        if (!employeeId) {
            throw new UnauthorizedException('로그인이 필요합니다.');
        }

        return await this.organizationManagementBusinessService.부서목록을조회한다({
            year: dto.year,
            month: dto.month,
            employeeId,
        });
    }

    /**
     * 부서 목록 + 부서별 소속 직원 조회 (시점 기준)
     *
     * 요청 연월을 기준으로 해당 시점에 유효했던 부서 목록과 각 부서별 소속 직원 정보를 반환합니다.
     */
    @Get('departments/with-employees')
    @ApiOperation({
        summary: '부서 목록 + 부서별 직원 조회',
        description:
            '요청 연월을 기준으로 해당 시점에 유효했던 부서 목록과 각 부서별 소속 직원 정보를 반환합니다. 계층구조와 1차원 배열 모두 부서별 직원 목록을 포함합니다.',
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '부서 목록 + 부서별 직원 조회 성공',
        type: GetDepartmentListWithEmployeesResponseDto,
    })
    async getDepartmentListWithEmployees(
        @Query() dto: GetDepartmentListRequestDto,
    ): Promise<IGetDepartmentListWithEmployeesResponse> {
        if (!dto.year || !dto.month) {
            throw new BadRequestException('연도와 월은 필수입니다.');
        }

        return await this.organizationManagementBusinessService.부서목록및부서별직원목록을조회한다({
            year: dto.year,
            month: dto.month,
        });
    }
}
