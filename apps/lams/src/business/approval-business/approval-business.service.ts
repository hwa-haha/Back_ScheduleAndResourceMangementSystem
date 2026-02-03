import { Injectable, Logger } from '@nestjs/common';
import { ApprovalContextService } from '../../context/approval-context/approval-context.service';
import {
    IGetReviewersByDepartmentQuery,
    IGetReviewersByDepartmentResponse,
    IUpdateSnapshotApprovalCommand,
    IUpdateSnapshotApprovalResponse,
    IGetSnapshotContentForApprovalQuery,
    IGetSnapshotContentForApprovalResponse,
} from '../../context/approval-context/interfaces';

/**
 * 결재 Business 서비스
 *
 * 결재 관련 API 비즈니스 로직을 오케스트레이션합니다.
 */
@Injectable()
export class ApprovalBusinessService {
    private readonly logger = new Logger(ApprovalBusinessService.name);

    constructor(private readonly approvalContextService: ApprovalContextService) {}

    /**
     * 결재 관련 부서별 권한자(검토 권한자)를 조회한다
     */
    async 결재관련부서별권한자를조회한다(
        query: IGetReviewersByDepartmentQuery,
    ): Promise<IGetReviewersByDepartmentResponse> {
        this.logger.log('결재 관련 부서별 권한자 조회');
        return await this.approvalContextService.결재관련부서별권한자를조회한다(query);
    }

    /**
     * 결재 관련 스냅샷의 approval 필드를 업데이트한다
     */
    async 결재스냅샷을업데이트한다(command: IUpdateSnapshotApprovalCommand): Promise<IUpdateSnapshotApprovalResponse> {
        this.logger.log(`결재 스냅샷 업데이트: snapshotId=${command.snapshotId}`);
        return await this.approvalContextService.결재스냅샷을업데이트한다(command);
    }

    /**
     * 결재시 스냅샷 내용을 조회한다 (토큰 직원이 검토할 수 있는 부서별 스냅샷 데이터)
     */
    async 결재시스냅샷내용을조회한다(
        query: IGetSnapshotContentForApprovalQuery,
    ): Promise<IGetSnapshotContentForApprovalResponse> {
        this.logger.log(`결재시 스냅샷 내용 조회: snapshotId=${query.snapshotId}, employeeId=${query.employeeId}`);
        return await this.approvalContextService.결재시스냅샷내용을조회한다(query);
    }
}
