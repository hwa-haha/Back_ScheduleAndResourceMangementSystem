import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { User } from '../../../libs/decorators/user.decorator';
import { UserBusinessService } from '../../business/user-business/user-business.service';
import type { IGetAttendanceIssuesResponse } from '../../context/attendance-issue-context/interfaces/response/get-attendance-issues-response.interface';
import {
    GetAttendanceIssuesToReviewRequestDto,
    GetAttendanceIssuesToReviewResponseDto,
} from './dto/get-attendance-issues-to-review.dto';
import {
    GetConfirmedMonthlyReportRequestDto,
    GetConfirmedMonthlyReportResponseDto,
} from './dto/get-confirmed-monthly-report.dto';
import {
    GetLatestSubmittedSnapshotRequestDto,
    GetLatestSubmittedSnapshotResponseDto,
} from './dto/get-latest-submitted-snapshot.dto';
import { IGetEmployeeAttendanceDetailResponse } from '../../context/dashboard-context/interfaces/response/get-employee-attendance-detail-response.interface';

/**
 * 업무관리시스템 유저용 API 컨트롤러
 *
 * - 근태관리에서 이슈가 생성되어 유저가 확인해야 하는 정보
 * - 전월 나의 근태현황보고서(스냅샷) 확정 시 확인할 수 있는 정보
 */
@ApiTags('업무관리시스템 유저')
@ApiBearerAuth()
@Controller('user')
export class UserController {
    constructor(private readonly userBusinessService: UserBusinessService) {}

    /**
     * 확인할 근태 이슈 목록 (나의 이슈 중 요청(request) 상태만 조회)
     *
     * 기존 근태 이슈 목록 조회와 동일하나, employeeId는 User 데코레이터로 고정하고 status는 request로 고정합니다.
     * 연·월 쿼리 지정 시 해당 월 구간으로 필터합니다.
     */
    @Get('attendance-issues-to-review')
    @ApiOperation({
        summary: '확인할 근태 이슈 목록',
        description:
            '근태관리에서 생성된 이슈 중 로그인한 유저가 확인해야 하는 목록을 반환합니다. (상태=request 고정). 연·월 선택 시 해당 월만 조회합니다.',
    })
    @ApiQuery({ name: 'year', description: '연도 (선택)', example: '2026', required: false })
    @ApiQuery({ name: 'month', description: '월 01~12 (선택)', example: '02', required: false })
    @ApiResponse({
        status: 200,
        description: '조회 성공',
        type: GetAttendanceIssuesToReviewResponseDto,
    })
    async getAttendanceIssuesToReview(
        @User('id') userId: string,
        @Query() query: GetAttendanceIssuesToReviewRequestDto,
    ): Promise<IGetAttendanceIssuesResponse> {
        if (!userId) {
            throw new BadRequestException('직원 정보를 찾을 수 없습니다.');
        }
        return await this.userBusinessService.확인할근태이슈목록을조회한다(userId, query);
    }

    /**
     * 전월 나의 근태현황보고서(스냅샷) 확정 정보
     *
     * 연도·월은 쿼리로 지정 가능하며 미지정 시 전월 기준. 직원은 User 데코레이터로 본인 기준 조회.
     */
    @Get('confirmed-monthly-report')
    @ApiOperation({
        summary: '전월 근태현황보고서 확정 정보',
        description:
            '전월(또는 지정 연·월)의 나의 근태현황보고서(스냅샷)가 확정(결재 제출 등)되었을 때 확인할 수 있는 정보를 반환합니다.',
    })
    @ApiQuery({
        name: 'year',
        description: '연도 (미지정 시 전월 기준)',
        example: '2026',
        required: false,
    })
    @ApiQuery({
        name: 'month',
        description: '월 01~12 (미지정 시 전월 기준)',
        example: '01',
        required: false,
    })
    @ApiResponse({
        status: 200,
        description: '조회 성공',
        type: GetConfirmedMonthlyReportResponseDto,
    })
    async getConfirmedMonthlyReport(
        @User('id') userId: string,
        @Query() query: GetConfirmedMonthlyReportRequestDto,
    ): Promise<IGetEmployeeAttendanceDetailResponse> {
        if (!userId) {
            throw new BadRequestException('직원 정보를 찾을 수 없습니다.');
        }
        return await this.userBusinessService.확정된전월근태보고서를조회한다(userId, query);
    }

    /**
     * 제출된 가장 최신 스냅샷 정보 (id, submittedAt)
     *
     * 지정 연·월의 스냅샷 목록 중 submitted_at이 있는 것 중 가장 최신 항목을 반환합니다.
     * 로그인한 유저에게 해당 연·월의 child 스냅샷 데이터가 있을 때만 응답하며, 없으면 null. 미지정 시 전월 기준.
     */
    @Get('latest-submitted-snapshot')
    @ApiOperation({
        summary: '제출된 가장 최신 스냅샷 정보',
        description:
            '지정 연·월의 제출된 가장 최신 스냅샷의 id, submittedAt을 반환합니다. 로그인한 유저의 해당 연·월 child 스냅샷이 있을 때만 반환하며, 없으면 null. 연·월 미지정 시 전월 기준.',
    })
    @ApiQuery({ name: 'year', description: '연도 (미지정 시 전월)', example: '2026', required: false })
    @ApiQuery({ name: 'month', description: '월 01~12 (미지정 시 전월)', example: '01', required: false })
    @ApiResponse({
        status: 200,
        description: '조회 성공 (제출된 스냅샷 없거나 해당 유저 child 스냅샷 없으면 null)',
        type: GetLatestSubmittedSnapshotResponseDto,
    })
    async getLatestSubmittedSnapshot(
        @User('id') userId: string,
        @Query() query: GetLatestSubmittedSnapshotRequestDto,
    ): Promise<GetLatestSubmittedSnapshotResponseDto | null> {
        if (!userId) {
            throw new BadRequestException('직원 정보를 찾을 수 없습니다.');
        }
        return await this.userBusinessService.제출된가장최신스냅샷정보를조회한다(userId, query);
    }
}
