import { Injectable, Logger } from '@nestjs/common';
import { AttendanceIssueContextService } from '../../context/attendance-issue-context/attendance-issue-context.service';
import { AttendanceDataContextService } from '../../context/attendance-data-context/attendance-data-context.service';
import {
    IGetAttendanceIssuesQuery,
    IGetAttendanceIssuesResponse,
    IGetAttendanceIssueQuery,
    IGetAttendanceIssueResponse,
    IGetAttendanceIssuesByDepartmentQuery,
    IGetAttendanceIssuesByDepartmentResponse,
    IUpdateAttendanceIssueDescriptionCommand,
    IUpdateAttendanceIssueDescriptionResponse,
    IUpdateAttendanceIssueCorrectionCommand,
    IUpdateAttendanceIssueCorrectionResponse,
    IApplyAttendanceIssueCommand,
    IApplyAttendanceIssueResponse,
    IRejectAttendanceIssueCommand,
    IRejectAttendanceIssueResponse,
    IReRequestAttendanceIssueCommand,
    IReRequestAttendanceIssueResponse,
    IRequestAttendanceIssueCommand,
    IRequestAttendanceIssueResponse,
    IRequestAttendanceIssuesByYearMonthResponse,
    IRequestAttendanceIssuesCommand,
    IRequestAttendanceIssuesResponse,
    IReRequestAttendanceIssuesCommand,
    IReRequestAttendanceIssuesResponse,
} from '../../context/attendance-issue-context/interfaces';
import { AttendanceIssueStatus } from '../../domain/attendance-issue/attendance-issue.types';

/**
 * 근태 이슈 비즈니스 서비스
 *
 * 근태 이슈 관련 비즈니스 로직을 오케스트레이션합니다.
 */
@Injectable()
export class AttendanceIssueBusinessService {
    private readonly logger = new Logger(AttendanceIssueBusinessService.name);

    constructor(
        private readonly attendanceIssueContextService: AttendanceIssueContextService,
        private readonly attendanceDataContextService: AttendanceDataContextService,
    ) {}

    /**
     * 근태 이슈 목록을 조회한다
     */
    async 근태이슈목록을조회한다(params: {
        employeeId?: string;
        startDate?: string;
        endDate?: string;
        status?: AttendanceIssueStatus;
    }): Promise<IGetAttendanceIssuesResponse> {
        this.logger.log(`근태 이슈 목록 조회: ${JSON.stringify(params)}`);
        return await this.attendanceIssueContextService.근태이슈목록을조회한다(params);
    }

    /**
     * 연월/부서별 근태 이슈를 조회한다
     *
     * 해당 연월과 부서에 소속되었던 직원들의 근태 이슈를 조회하고 직원별로 그룹핑합니다.
     */
    async 연월부서별근태이슈를조회한다(
        query: IGetAttendanceIssuesByDepartmentQuery,
    ): Promise<IGetAttendanceIssuesByDepartmentResponse> {
        this.logger.log(
            `연월/부서별 근태 이슈 조회: year=${query.year}, month=${query.month}, departmentId=${query.departmentId}`,
        );
        return await this.attendanceIssueContextService.연월부서별근태이슈를조회한다(query);
    }

    /**
     * 근태 이슈를 조회한다
     */
    async 근태이슈를조회한다(id: string): Promise<IGetAttendanceIssueResponse> {
        this.logger.log(`근태 이슈 조회: id=${id}`);
        return await this.attendanceIssueContextService.근태이슈를조회한다({ id });
    }

    /**
     * 근태 이슈 사유를 수정한다 (직원용)
     */
    async 근태이슈사유를수정한다(
        id: string,
        description: string,
        userId: string,
    ): Promise<IUpdateAttendanceIssueDescriptionResponse> {
        this.logger.log(`근태 이슈 사유 수정: id=${id}`);
        return await this.attendanceIssueContextService.근태이슈사유를수정한다({
            id,
            description,
            userId,
        });
    }

    /**
     * 근태 이슈 수정 정보를 설정한다 (관리자용)
     */
    async 근태이슈수정정보를설정한다(
        id: string,
        data: {
            correctedEnterTime?: string;
            correctedLeaveTime?: string;
            correctedAttendanceTypeIds?: string[];
        },
        userId: string,
    ): Promise<IUpdateAttendanceIssueCorrectionResponse> {
        this.logger.log(`근태 이슈 수정 정보 설정: id=${id}`);
        return await this.attendanceIssueContextService.근태이슈수정정보를설정한다({
            id,
            ...data,
            userId,
        });
    }

    /**
     * 근태 이슈를 반영한다 (관리자용)
     * 확인자(confirmed_by)는 userId로 설정된다.
     */
    async 근태이슈를반영한다(
        id: string,
        data: {
            correctedEnterTime?: string;
            correctedLeaveTime?: string;
            correctedAttendanceTypeIds?: string[];
        },
        userId: string,
    ): Promise<IApplyAttendanceIssueResponse> {
        this.logger.log(`근태 이슈 반영: id=${id}`);

        // 2. 수정 정보가 요청에 포함된 경우 이슈 업데이트
        if (data.correctedEnterTime || data.correctedLeaveTime || data.correctedAttendanceTypeIds) {
            await this.attendanceIssueContextService.근태이슈수정정보를설정한다({
                id,
                correctedEnterTime: data.correctedEnterTime,
                correctedLeaveTime: data.correctedLeaveTime,
                correctedAttendanceTypeIds: data.correctedAttendanceTypeIds,
                userId,
            });
        }

        // 3. 업데이트된 이슈 정보 조회 (수정 정보 반영 확인)
        const updatedIssueResponse = await this.attendanceIssueContextService.근태이슈를조회한다({ id });
        const updatedIssue = updatedIssueResponse.issue;

        // 4. 일간 요약 수정 (수정 정보가 있는 경우)
        if (updatedIssue.dailyEventSummaryId) {
            await this.attendanceDataContextService.일간요약을수정한다({
                dailySummaryId: updatedIssue.dailyEventSummaryId,
                enter: updatedIssue.correctedEnterTime || undefined,
                leave: updatedIssue.correctedLeaveTime || undefined,
                attendanceTypeIds: updatedIssue.correctedAttendanceTypeIds || undefined,
                note: '근태 이슈 반영',
                performedBy: userId,
            });
        }

        // 5. 이슈 상태를 반영으로 변경
        return await this.attendanceIssueContextService.근태이슈를반영한다({
            id,
            confirmedBy: userId,
            userId,
        });
    }

    /**
     * 근태 이슈를 미반영 처리한다 (관리자용)
     */
    async 근태이슈를미반영처리한다(
        id: string,
        rejectionReason: string,
        userId: string,
    ): Promise<IRejectAttendanceIssueResponse> {
        this.logger.log(`근태 이슈 미반영 처리: id=${id}`);
        return await this.attendanceIssueContextService.근태이슈를미반영처리한다({
            id,
            rejectionReason,
            userId,
        });
    }

    /**
     * 근태 이슈를 재요청한다 (직원용)
     */
    async 근태이슈를재요청한다(id: string, userId: string): Promise<IReRequestAttendanceIssueResponse> {
        this.logger.log(`근태 이슈 재요청: id=${id}`);
        return await this.attendanceIssueContextService.근태이슈를재요청한다({
            id,
            userId,
        });
    }

    /**
     * 근태 이슈를 요청한다 (직원용) - PENDING → REQUEST, 단건
     */
    async 근태이슈를요청한다(id: string, userId: string): Promise<IRequestAttendanceIssueResponse> {
        this.logger.log(`근태 이슈 요청: id=${id}`);
        return await this.attendanceIssueContextService.근태이슈를요청한다({
            id,
            userId,
        });
    }

    /**
     * 근태 이슈들을 요청한다 (직원용) - PENDING → REQUEST, 복수 ID 벌크
     */
    async 근태이슈들을요청한다(ids: string[], userId: string): Promise<IRequestAttendanceIssuesResponse> {
        this.logger.log(`근태 이슈 요청(벌크): ids=${ids.join(', ')}`);
        return await this.attendanceIssueContextService.근태이슈들을요청한다({
            ids,
            userId,
        });
    }

    /**
     * 해당 연월의 이슈를 상태별로 일괄 처리한다.
     * - pending → 요청(request), request → 미동작, not_applied → 재요청(re-request), applied → 미동작
     * issueIds가 있으면 해당 이슈만 대상(해당 연월 내인 것만), 없으면 해당 연월 전체 이슈 대상.
     */
    async 연월별이슈를상태별일괄처리한다(
        year: string,
        month: string,
        userId: string,
        issueIds?: string[],
    ): Promise<IRequestAttendanceIssuesByYearMonthResponse> {
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

        let issues: Awaited<IGetAttendanceIssuesResponse>['issues'];
        if (issueIds?.length) {
            const result = await this.attendanceIssueContextService.근태이슈목록을조회한다({
                issueIds,
                startDate,
                endDate,
            });
            issues = result.issues;
        } else {
            const result = await this.attendanceIssueContextService.근태이슈목록을조회한다({
                startDate,
                endDate,
            });
            issues = result.issues;
        }

        const pendingIds = issues.filter((i) => i.status === AttendanceIssueStatus.PENDING).map((i) => i.id);
        const notAppliedIds = issues
            .filter((i) => i.status === AttendanceIssueStatus.NOT_APPLIED)
            .map((i) => i.id);

        const allUpdatedIssues: Awaited<IRequestAttendanceIssuesByYearMonthResponse>['issues'] = [];
        let requestedCount = 0;
        let reRequestedCount = 0;

        if (pendingIds.length > 0) {
            const res = await this.attendanceIssueContextService.근태이슈들을요청한다({
                ids: pendingIds,
                userId,
            });
            allUpdatedIssues.push(...res.issues);
            requestedCount = res.requestedCount;
        }
        if (notAppliedIds.length > 0) {
            const res = await this.attendanceIssueContextService.근태이슈들을재요청한다({
                ids: notAppliedIds,
                userId,
            });
            allUpdatedIssues.push(...res.issues);
            reRequestedCount = res.reRequestedCount;
        }

        this.logger.log(
            `연월별 이슈 상태별 일괄 처리: year=${year}, month=${month}, 요청=${requestedCount}건, 재요청=${reRequestedCount}건`,
        );

        return {
            issues: allUpdatedIssues,
            requestedCount,
            reRequestedCount,
        };
    }

    /**
     * 근태 이슈들을 재요청한다 (직원용) - 복수 ID
     */
    async 근태이슈들을재요청한다(ids: string[], userId: string): Promise<IReRequestAttendanceIssuesResponse> {
        this.logger.log(`근태 이슈 재요청: ids=${ids.join(', ')}`);
        return await this.attendanceIssueContextService.근태이슈들을재요청한다({
            ids,
            userId,
        });
    }
}
