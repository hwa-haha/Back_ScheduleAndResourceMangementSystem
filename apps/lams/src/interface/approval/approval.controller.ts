import { Controller, Get, Patch, Body, Param, Query, BadRequestException, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { User } from '../../../libs/decorators/user.decorator';
import { ApprovalBusinessService } from '../../business/approval-business/approval-business.service';
import { GetReviewersByDepartmentResponseDto } from './dto/get-reviewers-by-department.dto';
import { IGetReviewersByDepartmentResponse } from '../../context/approval-context/interfaces/response/get-reviewers-by-department-response.interface';
import {
    UpdateSnapshotApprovalRequestDto,
    UpdateSnapshotApprovalResponseDto,
} from './dto/update-snapshot-approval.dto';
import { IUpdateSnapshotApprovalResponse } from '../../context/approval-context/interfaces/response/update-snapshot-approval-response.interface';
import { GetSnapshotContentForApprovalResponseDto } from './dto/get-snapshot-content-for-approval.dto';
import { IGetSnapshotContentForApprovalResponse } from '../../context/approval-context/interfaces/response/get-snapshot-content-for-approval-response.interface';

/**
 * 결재 컨트롤러
 *
 * 결재 관련 부서별 권한자 조회, 스냅샷 결재 필드 업데이트, 결재시 스냅샷 내용 보기 API를 제공합니다.
 */
@ApiTags('결재')
@ApiBearerAuth()
@Controller('approval')
export class ApprovalController {
    constructor(private readonly approvalBusinessService: ApprovalBusinessService) {}

    /**
     * 결재 관련 부서별 권한자 조회
     *
     * 권한 테이블에서 검토(review) 권한이 있는 직원들을 부서별로 그룹핑하여 반환합니다.
     */
    @Get('reviewers-by-department')
    @ApiOperation({
        summary: '결재 관련 부서별 권한자 조회',
        description:
            '권한 테이블(employee_department_permission)에서 has_review_permission = true 인 직원들을 부서별로 그룹핑하여 반환합니다.',
    })
    @ApiResponse({
        status: 200,
        description: '부서별 권한자 조회 성공',
        type: GetReviewersByDepartmentResponseDto,
    })
    async getReviewersByDepartment(): Promise<IGetReviewersByDepartmentResponse> {
        return await this.approvalBusinessService.결재관련부서별권한자를조회한다({});
    }

    /**
     * 결재 관련 스냅샷 업데이트
     *
     * data_snapshot_info 의 approval_document_id, submitted_at, approver_name, approval_status 네 가지 필드를 업데이트합니다.
     */
    @Patch('snapshots/:snapshotId/approval')
    @ApiOperation({
        summary: '결재 관련 스냅샷 업데이트',
        description:
            '스냅샷 ID에 대해 결재 문서 ID, 제출 시간, 결재자 이름, 결재 상태(미제출/제출됨) 필드를 업데이트합니다.',
    })
    @ApiParam({
        name: 'snapshotId',
        description: '스냅샷 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiResponse({
        status: 200,
        description: '스냅샷 결재 필드 업데이트 성공',
        type: UpdateSnapshotApprovalResponseDto,
    })
    async updateSnapshotApproval(
        @Param('snapshotId', ParseUUIDPipe) snapshotId: string,
        @Body() dto: UpdateSnapshotApprovalRequestDto,
        @User('id') performedBy: string,
    ): Promise<IUpdateSnapshotApprovalResponse> {
        if (!performedBy) {
            throw new BadRequestException('사용자 정보가 필요합니다.');
        }

        return await this.approvalBusinessService.결재스냅샷을업데이트한다({
            snapshotId,
            approvalDocumentId: dto.approvalDocumentId,
            submittedAt: dto.submittedAt,
            approverName: dto.approverName,
            performedBy,
        });
    }

    /**
     * 결재시 스냅샷 내용 보기
     *
     * 결재 시스템에서 링크 클릭 시 표시할 데이터. 스냅샷 ID로 스냅샷을 조회하고,
     * 토큰의 직원 ID가 검토 권한이 있는 부서들에 대해서만 해당 연·월에 소속된 직원들의 스냅샷 child 데이터를 부서별로 반환합니다.
     */
    @Get('snapshots/:snapshotId/content')
    @ApiOperation({
        summary: '결재시 스냅샷 내용 보기',
        description:
            '스냅샷 ID로 스냅샷을 조회하고, 토큰의 직원이 검토 권한이 있는 부서들에 대한 스냅샷 child 데이터를 부서별로 반환합니다. 연도·월은 쿼리로 전달합니다.',
    })
    @ApiParam({
        name: 'snapshotId',
        description: '스냅샷 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @ApiQuery({ name: 'year', description: '연도', example: '2026', required: true })
    @ApiQuery({ name: 'month', description: '월 (01-12)', example: '01', required: true })
    @ApiResponse({
        status: 200,
        description: '결재시 스냅샷 내용 조회 성공',
        type: GetSnapshotContentForApprovalResponseDto,
    })
    async getSnapshotContentForApproval(
        @Param('snapshotId', ParseUUIDPipe) snapshotId: string,
        @User('id') employeeId: string,
        @Query('year') year: string,
        @Query('month') month: string,
    ): Promise<IGetSnapshotContentForApprovalResponse> {
        if (!employeeId) {
            throw new BadRequestException('토큰을 통한 직원 정보가 필요합니다.');
        }
        if (!year || !month) {
            throw new BadRequestException('연도와 월은 필수입니다.');
        }

        const monthStr = typeof month === 'string' && month.length === 1 ? month.padStart(2, '0') : month;

        return await this.approvalBusinessService.결재시스냅샷내용을조회한다({
            snapshotId,
            employeeId,
            year,
            month: monthStr,
        });
    }
}
