import { Injectable } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import { GetReviewersByDepartmentQuery } from './handlers/queries/get-reviewers-by-department.query';
import { GetSnapshotContentForApprovalQuery } from './handlers/queries/get-snapshot-content-for-approval.query';
import { UpdateSnapshotApprovalCommand } from './handlers/commands/update-snapshot-approval.command';
import {
    IGetReviewersByDepartmentQuery,
    IGetReviewersByDepartmentResponse,
    IGetSnapshotContentForApprovalQuery,
    IGetSnapshotContentForApprovalResponse,
    IUpdateSnapshotApprovalCommand,
    IUpdateSnapshotApprovalResponse,
} from './interfaces';

/**
 * 결재 Context 서비스
 *
 * 결재 관련 부서별 권한자 조회, 스냅샷 결재 필드 업데이트, 결재시 스냅샷 내용 보기를 제공합니다.
 */
@Injectable()
export class ApprovalContextService {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * 결재 관련 부서별 권한자(검토 권한자)를 조회한다
     */
    async 결재관련부서별권한자를조회한다(
        query: IGetReviewersByDepartmentQuery,
    ): Promise<IGetReviewersByDepartmentResponse> {
        return await this.queryBus.execute(new GetReviewersByDepartmentQuery(query));
    }

    /**
     * 결재 관련 스냅샷의 approval 필드를 업데이트한다
     */
    async 결재스냅샷을업데이트한다(command: IUpdateSnapshotApprovalCommand): Promise<IUpdateSnapshotApprovalResponse> {
        return await this.commandBus.execute(new UpdateSnapshotApprovalCommand(command));
    }

    /**
     * 결재시 스냅샷 내용을 조회한다 (토큰 직원이 검토할 수 있는 부서별 스냅샷 데이터)
     */
    async 결재시스냅샷내용을조회한다(
        query: IGetSnapshotContentForApprovalQuery,
    ): Promise<IGetSnapshotContentForApprovalResponse> {
        return await this.queryBus.execute(new GetSnapshotContentForApprovalQuery(query));
    }
}
