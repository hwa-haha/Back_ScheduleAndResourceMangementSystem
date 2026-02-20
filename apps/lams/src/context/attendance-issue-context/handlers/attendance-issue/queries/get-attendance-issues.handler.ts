import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAttendanceIssuesQuery } from './get-attendance-issues.query';
import { IGetAttendanceIssuesResponse } from '../../../interfaces';
import { DomainAttendanceIssueService } from '../../../../../domain/attendance-issue/attendance-issue.service';

/**
 * 근태 이슈 목록 조회 Handler
 */
@QueryHandler(GetAttendanceIssuesQuery)
export class GetAttendanceIssuesHandler implements IQueryHandler<
    GetAttendanceIssuesQuery,
    IGetAttendanceIssuesResponse
> {
    constructor(private readonly attendanceIssueService: DomainAttendanceIssueService) {}

    async execute(query: GetAttendanceIssuesQuery): Promise<IGetAttendanceIssuesResponse> {
        const { query: params } = query;

        let issues = [];

        if (params.issueIds?.length) {
            issues = await this.attendanceIssueService.ID목록으로조회한다(params.issueIds);
            if (params.startDate && params.endDate) {
                issues = issues.filter(
                    (i) => i.date >= params.startDate! && i.date <= params.endDate!,
                );
            }
            if (params.status) {
                issues = issues.filter((issue) => issue.status === params.status);
            }
        } else if (params.employeeId) {
            issues = await this.attendanceIssueService.직원ID로조회한다(params.employeeId);
        } else if (params.startDate && params.endDate) {
            issues = await this.attendanceIssueService.날짜범위로조회한다(params.startDate, params.endDate);
        } else if (params.status) {
            issues = await this.attendanceIssueService.상태별목록조회한다(params.status);
        } else {
            // 모든 조건이 없으면 요청 상태만 조회
            issues = await this.attendanceIssueService.요청중목록조회한다();
        }

        // 상태 필터링 (날짜 범위나 직원 ID로 조회한 경우, issueIds가 아닐 때)
        if (
            params.status &&
            !params.issueIds?.length &&
            (params.employeeId || (params.startDate && params.endDate))
        ) {
            issues = issues.filter((issue) => issue.status === params.status);
        }

        return {
            issues,
            total: issues.length,
        };
    }
}
