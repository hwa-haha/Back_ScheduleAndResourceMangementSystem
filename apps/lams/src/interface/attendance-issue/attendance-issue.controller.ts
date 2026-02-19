import {
    Controller,
    Get,
    Post,
    Query,
    Param,
    Patch,
    Body,
    BadRequestException,
    ParseUUIDPipe,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { User } from '../../../libs/decorators/user.decorator';
import { AttendanceIssueBusinessService } from '../../business/attendance-issue-business/attendance-issue-business.service';
import {
    GetAttendanceIssuesRequestDto,
    GetAttendanceIssuesResponseDto,
    AttendanceIssueResponseDto,
    UpdateAttendanceIssueDescriptionRequestDto,
    ApplyAttendanceIssueRequestDto,
    RejectAttendanceIssueRequestDto,
    RequestAttendanceIssueRequestDto,
    RequestAttendanceIssueResponseDto,
    ReRequestAttendanceIssuesRequestDto,
    ReRequestAttendanceIssuesResponseDto,
} from './dto/attendance-issue.dto';
import {
    GetAttendanceIssuesByDepartmentRequestDto,
    GetAttendanceIssuesByDepartmentResponseDto,
} from './dto/get-attendance-issues-by-department.dto';
import { IGetAttendanceIssuesByDepartmentResponse } from '../../context/attendance-issue-context/interfaces/response/get-attendance-issues-by-department-response.interface';
import { AttendanceIssueStatus } from '../../domain/attendance-issue/attendance-issue.types';

/**
 * 근태 이슈 컨트롤러
 *
 * 근태 이슈 관련 API를 제공합니다.
 * - 직원: 사유 작성, 재요청
 * - 관리자: 이슈 조회, 반영/미반영 처리
 */
@ApiTags('3. 근태 이슈')
@ApiBearerAuth()
@Controller('attendance-issues')
export class AttendanceIssueController {
    constructor(private readonly attendanceIssueBusinessService: AttendanceIssueBusinessService) {}

    /**
     * 근태 이슈 목록 조회 (관리자용)
     */
    @Get()
    @ApiOperation({
        summary: '근태 이슈 목록 조회',
        description: '근태 이슈 목록을 조회합니다. 직원ID, 날짜 범위, 상태로 필터링할 수 있습니다.',
    })
    @ApiQuery({ name: 'employeeId', description: '직원 ID', required: false })
    @ApiQuery({ name: 'startDate', description: '시작 날짜 (yyyy-MM-dd)', required: false })
    @ApiQuery({ name: 'endDate', description: '종료 날짜 (yyyy-MM-dd)', required: false })
    @ApiQuery({ name: 'status', description: '상태', enum: AttendanceIssueStatus, required: false })
    async getAttendanceIssues(@Query() query: GetAttendanceIssuesRequestDto): Promise<GetAttendanceIssuesResponseDto> {
        const result = await this.attendanceIssueBusinessService.근태이슈목록을조회한다({
            employeeId: query.employeeId,
            startDate: query.startDate,
            endDate: query.endDate,
            status: query.status,
        });

        return result;
    }

    /**
     * 연월/부서별 근태 이슈 조회
     *
     * 해당 연월과 부서에 소속되었던 직원들의 근태 이슈를 조회하고 직원별로 그룹핑합니다.
     */
    @Get('by-department')
    @ApiOperation({
        summary: '연월/부서별 근태 이슈 조회',
        description:
            '해당 연월과 부서에 소속되었던 직원들의 근태 이슈를 조회하고 직원별로 그룹핑하여 반환합니다.',
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월', example: '01', required: true })
    @ApiQuery({
        name: 'departmentId',
        description: '부서 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true,
    })
    @ApiResponse({
        status: 200,
        description: '연월/부서별 근태 이슈 조회 성공',
        type: GetAttendanceIssuesByDepartmentResponseDto,
    })
    async getAttendanceIssuesByDepartment(
        @Query() dto: GetAttendanceIssuesByDepartmentRequestDto,
    ): Promise<IGetAttendanceIssuesByDepartmentResponse> {
        if (!dto.year || !dto.month || !dto.departmentId) {
            throw new BadRequestException('연도, 월, 부서ID는 필수입니다.');
        }

        const result = await this.attendanceIssueBusinessService.연월부서별근태이슈를조회한다({
            year: dto.year,
            month: dto.month,
            departmentId: dto.departmentId,
        });

        return result;
    }

    /**
     * 근태 이슈 요청 (직원용) - PENDING → REQUEST, 복수 ID
     */
    @Post('request')
    @ApiOperation({
        summary: '근태 이슈 요청 - 직원용',
        description:
            '대기(pending) 상태의 근태 이슈를 요청(request) 상태로 변경합니다. 여러 이슈 ID를 한 번에 보낼 수 있습니다.',
    })
    @ApiResponse({
        status: 200,
        description: '근태 이슈 요청 성공',
        type: RequestAttendanceIssueResponseDto,
    })
    async requestAttendanceIssues(
        @Body() dto: RequestAttendanceIssueRequestDto,
        @User('id') userId: string,
    ): Promise<RequestAttendanceIssueResponseDto> {
        if (!userId) {
            throw new BadRequestException('직원 정보를 찾을 수 없습니다.');
        }

        const result = await this.attendanceIssueBusinessService.근태이슈를요청한다(dto.ids, userId);
        return {
            issues: result.issues,
            requestedCount: result.requestedCount,
        };
    }

    /**
     * 근태 이슈 재요청 (직원용) - 복수 ID
     */
    @Post('re-request')
    @ApiOperation({
        summary: '근태 이슈 재요청 - 직원용 (복수 ID)',
        description:
            '미반영/대기 처리된 근태 이슈를 재요청합니다. 여러 이슈 ID를 한 번에 보낼 수 있습니다. 이미 반영된 이슈는 제외됩니다.',
    })
    @ApiResponse({
        status: 200,
        description: '근태 이슈 재요청 성공',
        type: ReRequestAttendanceIssuesResponseDto,
    })
    async reRequestAttendanceIssues(
        @Body() dto: ReRequestAttendanceIssuesRequestDto,
        @User('id') userId: string,
    ): Promise<ReRequestAttendanceIssuesResponseDto> {
        if (!userId) {
            throw new BadRequestException('직원 정보를 찾을 수 없습니다.');
        }

        const result = await this.attendanceIssueBusinessService.근태이슈들을재요청한다(dto.ids, userId);
        return {
            issues: result.issues,
            reRequestedCount: result.reRequestedCount,
        };
    }

    /**
     * 근태 이슈 상세 조회
     */
    @Get(':id')
    @ApiOperation({
        summary: '근태 이슈 상세 조회',
        description: '근태 이슈 상세 정보를 조회합니다.',
    })
    @ApiParam({ name: 'id', description: '근태 이슈 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    async getAttendanceIssue(@Param('id', ParseUUIDPipe) id: string): Promise<AttendanceIssueResponseDto> {
        const result = await this.attendanceIssueBusinessService.근태이슈를조회한다(id);
        return result.issue;
    }

    /**
     * 근태 이슈 사유 수정 (직원용)
     */
    @Patch(':id/description')
    @ApiOperation({
        summary: '근태 이슈 사유 수정 - 직원용',
        description: '근태 이슈의 사유를 작성합니다. 사유를 작성하면 상태가 미반영으로 변경됩니다.',
    })
    @ApiParam({ name: 'id', description: '근태 이슈 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    async updateAttendanceIssueDescription(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateAttendanceIssueDescriptionRequestDto,
        @User('id') userId: string,
    ): Promise<AttendanceIssueResponseDto> {
        if (!userId) {
            throw new BadRequestException('직원 정보를 찾을 수 없습니다.');
        }

        const result = await this.attendanceIssueBusinessService.근태이슈사유를수정한다(id, dto.description, userId);
        return result.issue;
    }

    /**
     * 근태 이슈 요청 (직원용) - 단일 ID, PENDING → REQUEST
     */
    @Patch(':id/request')
    @ApiOperation({
        summary: '근태 이슈 요청 - 직원용 (단일 ID)',
        description: '대기(pending) 상태의 근태 이슈 하나를 요청(request) 상태로 변경합니다.',
    })
    @ApiParam({ name: 'id', description: '근태 이슈 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    async requestAttendanceIssue(
        @Param('id', ParseUUIDPipe) id: string,
        @User('id') userId: string,
    ): Promise<AttendanceIssueResponseDto> {
        if (!userId) {
            throw new BadRequestException('직원 정보를 찾을 수 없습니다.');
        }

        const result = await this.attendanceIssueBusinessService.근태이슈를요청한다([id], userId);
        return result.issues[0];
    }

    /**
     * 근태 이슈 반영 (관리자용)
     */
    @Patch(':id/apply')
    @ApiOperation({
        summary: '근태 이슈 반영 - 관리자용',
        description: `근태 이슈를 반영합니다. 
수정 정보를 함께 전달할 수 있으며, 반영 시 일간 요약에 수정 정보가 반영됩니다.
한번 반영된 이슈는 더 이상 수정할 수 없습니다.`,
    })
    @ApiParam({ name: 'id', description: '근태 이슈 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    async applyAttendanceIssue(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: ApplyAttendanceIssueRequestDto,
        @User('id') userId: string,
    ): Promise<AttendanceIssueResponseDto> {
        if (!userId) {
            throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
        }

        const result = await this.attendanceIssueBusinessService.근태이슈를반영한다(
            id,
            {
                correctedEnterTime: dto.correctedEnterTime,
                correctedLeaveTime: dto.correctedLeaveTime,
                correctedAttendanceTypeIds: dto.correctedAttendanceTypeIds,
            },
            userId,
        );
        return result.issue;
    }

    /**
     * 근태 이슈 재요청 (직원용)
     */
    @Patch(':id/re-request')
    @ApiOperation({
        summary: '근태 이슈 재요청 - 직원용',
        description: '미반영 처리된 근태 이슈를 재요청합니다. 이슈 상태가 요청 상태로 변경됩니다.',
    })
    @ApiParam({ name: 'id', description: '근태 이슈 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    async reRequest(
        @Param('id', ParseUUIDPipe) id: string,
        @User('id') userId: string,
    ): Promise<AttendanceIssueResponseDto> {
        if (!userId) {
            throw new BadRequestException('직원 정보를 찾을 수 없습니다.');
        }

        const result = await this.attendanceIssueBusinessService.근태이슈를재요청한다(id, userId);
        return result.issue;
    }
}
