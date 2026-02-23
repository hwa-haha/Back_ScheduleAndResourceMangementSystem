import { Injectable, Logger } from '@nestjs/common';
import { AttendanceIssueContextService } from '../../context/attendance-issue-context/attendance-issue-context.service';
import { DataSnapshotContextService } from '../../context/data-snapshot-context/data-snapshot-context.service';
import type { IGetAttendanceIssuesQuery } from '../../context/attendance-issue-context/interfaces/query/get-attendance-issues-query.interface';
import type { IGetAttendanceIssuesResponse } from '../../context/attendance-issue-context/interfaces/response/get-attendance-issues-response.interface';
import type {
    IGetSnapshotListResponse,
    ICheckEmployeeSnapshotExistsResponse,
} from '../../context/data-snapshot-context/interfaces';
import { AttendanceIssueStatus } from '../../domain/attendance-issue/attendance-issue.types';
import type {
    GetAttendanceIssuesToReviewRequestDto,
} from '../../interface/user/dto/get-attendance-issues-to-review.dto';
import type { GetConfirmedMonthlyReportRequestDto } from '../../interface/user/dto/get-confirmed-monthly-report.dto';
import { DashboardContextService } from '../../context/dashboard-context/dashboard-context.service';
import { IGetEmployeeAttendanceDetailResponse } from '../../context/dashboard-context/interfaces/response/get-employee-attendance-detail-response.interface';

/**
 * 업무관리시스템 유저용 Business 서비스
 *
 * - 확인할 근태 이슈 목록 (상태 request 고정, User 데코레이터로 본인 이슈만)
 * - 전월 나의 근태현황보고서(스냅샷) 확정 정보 (User 데코레이터로 본인 기준)
 *
 * attendance-issue-context, data-snapshot-context 를 그대로 사용합니다.
 */
@Injectable()
export class UserBusinessService {
    private readonly logger = new Logger(UserBusinessService.name);

    constructor(
        private readonly attendanceIssueContextService: AttendanceIssueContextService,
        private readonly dashboardContextService: DashboardContextService,
    ) {}

    /**
     * 로그인한 유저가 확인해야 할 근태 이슈 목록을 조회한다
     * attendance-issue-context 근태이슈목록을조회한다를 그대로 반환한다 (employeeId=userId, status=request 고정).
     * year/month 지정 시 해당 월의 startDate~endDate로 필터한다.
     */
    async 확인할근태이슈목록을조회한다(
        userId: string,
        query?: GetAttendanceIssuesToReviewRequestDto,
    ): Promise<IGetAttendanceIssuesResponse> {
        const params: IGetAttendanceIssuesQuery = {
            employeeId: userId,
            status: AttendanceIssueStatus.REQUEST,
        };
        if (query?.year && query?.month) {
            const y = query.year;
            const m = query.month;
            const lastDay = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
            params.startDate = `${y}-${m}-01`;
            params.endDate = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
        }
        this.logger.log(`확인할 근태 이슈 목록 조회: userId=${userId}, status=request, params=${JSON.stringify(params)}`);
        return await this.attendanceIssueContextService.근태이슈목록을조회한다(params);
    }

    /**
     * 전월 나의 근태현황보고서(스냅샷) 확정 여부 및 정보를 조회한다
     * year/month 미지정 시 직전달 기준. data-snapshot-context 스냅샷목록·해당직원해당연월스냅샷존재여부 결과를 그대로 반환한다
     */
    async 확정된전월근태보고서를조회한다(
        userId: string,
        query?: GetConfirmedMonthlyReportRequestDto,
    ): Promise<IGetEmployeeAttendanceDetailResponse> {
        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const year = query?.year ?? String(prevMonth.getFullYear());
        const month = query?.month ?? String(prevMonth.getMonth() + 1).padStart(2, '0');
        return await this.dashboardContextService.연도월별직원근태상세를조회한다({ employeeId: userId, year, month });
    }
}
