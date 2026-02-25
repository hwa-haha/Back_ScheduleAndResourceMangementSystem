import { Injectable, Logger } from '@nestjs/common';
import { AttendanceIssueContextService } from '../../context/attendance-issue-context/attendance-issue-context.service';
import { DataSnapshotContextService } from '../../context/data-snapshot-context/data-snapshot-context.service';
import type { IGetAttendanceIssuesQuery } from '../../context/attendance-issue-context/interfaces/query/get-attendance-issues-query.interface';
import type { IGetAttendanceIssuesResponse } from '../../context/attendance-issue-context/interfaces/response/get-attendance-issues-response.interface';
import { AttendanceIssueStatus } from '../../domain/attendance-issue/attendance-issue.types';
import type { GetAttendanceIssuesToReviewRequestDto } from '../../interface/user/dto/get-attendance-issues-to-review.dto';
import type { GetConfirmedMonthlyReportRequestDto } from '../../interface/user/dto/get-confirmed-monthly-report.dto';
import type { GetLatestSubmittedSnapshotRequestDto } from '../../interface/user/dto/get-latest-submitted-snapshot.dto';
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
        private readonly dataSnapshotContextService: DataSnapshotContextService,
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
        this.logger.log(
            `확인할 근태 이슈 목록 조회: userId=${userId}, status=request, params=${JSON.stringify(params)}`,
        );
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

    /**
     * 스냅샷 목록 조회 후 submitted_at이 있는 것 중 가장 최신 스냅샷의 id, submittedAt을 반환한다.
     * 해당 유저(직원)의 child 스냅샷 데이터가 있을 때만 응답하며, 없으면 null을 반환한다.
     * year/month 미지정 시 전월 기준으로 조회한다.
     */
    async 제출된가장최신스냅샷정보를조회한다(
        userId: string,
        query?: GetLatestSubmittedSnapshotRequestDto,
    ): Promise<{ id: string; submittedAt: Date } | null> {
        const returnData = { id: null, submittedAt: null };
        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const year = query?.year ?? String(prevMonth.getFullYear());
        const month = query?.month ?? String(prevMonth.getMonth() + 1).padStart(2, '0');

        this.logger.log(`제출된 가장 최신 스냅샷 조회: userId=${userId}, year=${year}, month=${month}`);

        const result = await this.dataSnapshotContextService.스냅샷목록을조회한다({ year, month });
        const withSubmitted = (result.snapshots ?? []).filter(
            (s): s is typeof s & { submittedAt: Date } => s.submittedAt != null,
        );
        if (withSubmitted.length === 0) return returnData;

        const sorted = [...withSubmitted].sort(
            (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
        );
        const latest = sorted[0];
        // 해당 스냅샷에 이 직원의 child가 있는지 확인
        const snapshotDetail = await this.dataSnapshotContextService.스냅샷을ID로조회한다({
            snapshotId: latest.id,
        });
        const hasChildForEmployee = snapshotDetail.snapshot.children?.some((c) => c.employeeId === userId) ?? false;
        if (!hasChildForEmployee) {
            this.logger.log(
                `제출된 가장 최신 스냅샷: 해당 스냅샷에 직원 child 없음 snapshotId=${latest.id}, userId=${userId}`,
            );
            return returnData;
        }
        returnData.id = latest.id;
        returnData.submittedAt = latest.submittedAt;
        return returnData;
    }

    /**
     * 연도·월을 받아 해당 연월에 제출된 스냅샷을 조회한 뒤, 연월별로 최신 스냅샷만 필터링하여
     * 각 스냅샷의 연월(yyyy, mm)과 제출일(submittedAt)을 반환한다.
     */
    async 연월별제출된최신스냅샷목록을조회한다(
        year: string,
        month: string,
    ): Promise<Array<{ id: string; yyyy: string; mm: string; submittedAt: Date }>> {
        const monthStr = month.padStart(2, '0');
        this.logger.log(`연월별 제출된 최신 스냅샷 목록 조회: year=${year}, month=${monthStr}`);

        const result = await this.dataSnapshotContextService.스냅샷을제출연월로목록조회한다({ year, month: monthStr });
        const withSubmitted = (result.snapshots ?? []).filter(
            (s): s is typeof s & { submittedAt: Date } => s.submittedAt != null,
        );
        if (withSubmitted.length === 0) return [];

        const byYearMonth = new Map<string, { id: string; yyyy: string; mm: string; submittedAt: Date }>();
        for (const s of withSubmitted) {
            const key = `${s.yyyy}-${s.mm}`;
            const existing = byYearMonth.get(key);
            const submittedAt = s.submittedAt instanceof Date ? s.submittedAt : new Date(s.submittedAt);
            if (
                !existing ||
                submittedAt.getTime() > (existing.submittedAt instanceof Date ? existing.submittedAt : new Date(existing.submittedAt)).getTime()
            ) {
                byYearMonth.set(key, {
                    id: s.id,
                    yyyy: s.yyyy,
                    mm: s.mm,
                    submittedAt,
                });
            }
        }
        return Array.from(byYearMonth.values());
    }
}
