import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationManagementBusinessService } from '../../business/organization-management-business/organization-management-business.service';
import { GetDepartmentListRequestDto, GetDepartmentListResponseDto } from './dto/get-department-list.dto';
import { IGetDepartmentListResponse } from '../../context/organization-management-context/interfaces/response/get-department-list-response.interface';

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
}
