import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceIssue } from '../../../../../domain/attendance-issue/attendance-issue.entity';
import { AttendanceIssueStatus } from '../../../../../domain/attendance-issue/attendance-issue.types';
import { GetAttendanceIssuesToReviewQuery } from './get-attendance-issues-to-review.query';
import { IGetAttendanceIssuesResponse } from '../../../interfaces';

/**
 * 확인할 근태 이슈 목록 조회 Handler
 *
 * 도메인 서비스 없이 Repository로 직접 조회한다.
 * 조건: employee_id, status=request, deleted_at IS NULL, (선택) date 범위
 */
@QueryHandler(GetAttendanceIssuesToReviewQuery)
export class GetAttendanceIssuesToReviewHandler implements IQueryHandler<
    GetAttendanceIssuesToReviewQuery,
    IGetAttendanceIssuesResponse
> {
    constructor(
        @InjectRepository(AttendanceIssue)
        private readonly repository: Repository<AttendanceIssue>,
    ) {}

    async execute(query: GetAttendanceIssuesToReviewQuery): Promise<IGetAttendanceIssuesResponse> {
        const { employeeId, startDate, endDate } = query.query;

        const qb = this.repository
            .createQueryBuilder('issue')
            .where('issue.employee_id = :employeeId', { employeeId })
            .andWhere('issue.status = :status', { status: AttendanceIssueStatus.REQUEST })
            .andWhere('issue.deleted_at IS NULL');

        if (startDate) {
            qb.andWhere('issue.updated_at >= :startDate', { startDate });
        }
        if (endDate) {
            qb.andWhere('issue.updated_at <= :endDate', { endDate });
        }

        qb.orderBy('issue.date', 'DESC');

        const issues = await qb.getMany();
        const dtos = issues.map((issue) => issue.DTO변환한다());

        return {
            issues: dtos,
            total: dtos.length,
        };
    }
}
