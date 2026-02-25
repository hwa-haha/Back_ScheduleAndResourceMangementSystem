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
import {
    GetMonthlySubmittedSnapshotsRequestDto,
    MonthlySubmittedSnapshotItemDto,
} from './dto/get-monthly-submitted-snapshots.dto';
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
     * 월별 근태현황 보고서 존재 여부
     *
     * 지정 연·월에 제출된 보고서(스냅샷)가 있고, 로그인한 유저의 child 스냅샷이 있을 때 id, submittedAt 반환. 없으면 null.
     */
    @Get('monthly-report-existence')
    @ApiOperation({
        summary: '월별 근태현황 보고서 존재 여부',
        description:
            '지정 연·월에 나의 근태현황 보고서가 존재하는지 확인합니다. 존재하면 스냅샷 id와 제출일(submittedAt)을 반환하고, 없으면 null. 연·월 미지정 시 전월 기준.',
    })
    @ApiQuery({ name: 'year', description: '연도 (미지정 시 전월)', example: '2026', required: false })
    @ApiQuery({ name: 'month', description: '월 01~12 (미지정 시 전월)', example: '01', required: false })
    @ApiResponse({
        status: 200,
        description: '보고서 존재 시 id, submittedAt / 없으면 null',
        type: GetLatestSubmittedSnapshotResponseDto,
    })
    async getMonthlyReportExistence(
        @User('id') userId: string,
        @Query() query: GetLatestSubmittedSnapshotRequestDto,
    ): Promise<GetLatestSubmittedSnapshotResponseDto | null> {
        if (!userId) {
            throw new BadRequestException('직원 정보를 찾을 수 없습니다.');
        }
        return await this.userBusinessService.제출된가장최신스냅샷정보를조회한다(userId, query);
    }

    /**
     * 연월별 제출된 최신 스냅샷 목록
     *
     * 지정 연·월에 제출된 스냅샷을 조회한 뒤, 연월별로 최신 스냅샷만 필터링하여 연월(yyyy, mm)과 제출일을 반환한다.
     */
    @Get('monthly-submitted-snapshots')
    @ApiOperation({
        summary: '연월별 제출된 최신 스냅샷 목록',
        description:
            '지정 연·월에 제출된 스냅샷을 조회하고, 연월별로 최신 스냅샷만 필터링하여 각 스냅샷의 연월(yyyy, mm)과 제출일(submittedAt)을 반환합니다.',
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월 (01~12)', example: '02', required: true })
    @ApiResponse({
        status: 200,
        description: '조회 성공 (연월별 최신 스냅샷 목록, 없으면 빈 배열)',
        type: [MonthlySubmittedSnapshotItemDto],
    })
    async getMonthlySubmittedSnapshots(
        @Query() query: GetMonthlySubmittedSnapshotsRequestDto,
    ): Promise<MonthlySubmittedSnapshotItemDto[]> {
        return await this.userBusinessService.연월별제출된최신스냅샷목록을조회한다(query.year, query.month);
    }
}
