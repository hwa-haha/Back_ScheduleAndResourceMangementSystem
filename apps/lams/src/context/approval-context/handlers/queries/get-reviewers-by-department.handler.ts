import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetReviewersByDepartmentQuery } from './get-reviewers-by-department.query';
import {
    IGetReviewersByDepartmentResponse,
    IDepartmentReviewers,
    IReviewerInfo,
} from '../../interfaces/response/get-reviewers-by-department-response.interface';
import { DomainEmployeeDepartmentPermissionService } from '../../../../domain/employee-department-permission/employee-department-permission.service';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';

/**
 * 결재 관련 부서별 권한자(검토 권한자) 조회 Query Handler
 *
 * 권한 테이블에서 has_review_permission = true 인 직원들을 부서별로 그룹핑하여 반환합니다.
 */
@QueryHandler(GetReviewersByDepartmentQuery)
export class GetReviewersByDepartmentHandler implements IQueryHandler<
    GetReviewersByDepartmentQuery,
    IGetReviewersByDepartmentResponse
> {
    private readonly logger = new Logger(GetReviewersByDepartmentHandler.name);

    constructor(
        private readonly employeeDepartmentPermissionService: DomainEmployeeDepartmentPermissionService,
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
    ) {}

    async execute(query: GetReviewersByDepartmentQuery): Promise<IGetReviewersByDepartmentResponse> {
        this.logger.log('결재 관련 부서별 권한자 조회 시작');

        const rows = await this.employeeDepartmentPermissionService.검토권한목록전체조회한다();

        const byDepartment = new Map<string, IReviewerInfo[]>();
        const departmentNames = new Map<string, string>();

        // 직원 ID 목록 수집
        const employeeIds = [...new Set(rows.map((row) => row.employeeId))];

        // 모든 직원의 현재 배치 정보를 배치로 조회 (부서, 직책 정보)
        const employeeHistoriesMap = new Map<string, { departmentId?: string; departmentName?: string; positionId?: string; positionTitle?: string }>();
        
        if (employeeIds.length > 0) {
            // 현재 유효한 모든 배치 정보를 조회한 후 필터링
            const allCurrentHistories = await this.employeeDepartmentPositionHistoryService.findAllCurrent();
            const employeeIdsSet = new Set(employeeIds);
            
            for (const history of allCurrentHistories) {
                if (employeeIdsSet.has(history.employeeId)) {
                    employeeHistoriesMap.set(history.employeeId, {
                        departmentId: history.departmentId,
                        departmentName: history.department?.departmentName,
                        positionId: history.positionId,
                        positionTitle: history.position?.positionTitle,
                    });
                }
            }
        }

        for (const row of rows) {
            departmentNames.set(row.departmentId, row.departmentName);
            if (!byDepartment.has(row.departmentId)) {
                byDepartment.set(row.departmentId, []);
            }
            const list = byDepartment.get(row.departmentId)!;
            if (!list.some((r) => r.employeeId === row.employeeId)) {
                const history = employeeHistoriesMap.get(row.employeeId);
                list.push({
                    employeeId: row.employeeId,
                    employeeName: row.employeeName,
                    employeeNumber: row.employeeNumber,
                    departmentId: history?.departmentId,
                    departmentName: history?.departmentName,
                    positionId: history?.positionId,
                    positionTitle: history?.positionTitle,
                });
            }
        }

        const departments: IDepartmentReviewers[] = Array.from(byDepartment.entries()).map(
            ([departmentId, reviewers]) => ({
                departmentId,
                departmentName: departmentNames.get(departmentId) ?? '',
                reviewers,
            }),
        );

        this.logger.log(`결재 관련 부서별 권한자 조회 완료: departments=${departments.length}`);

        return { departments };
    }
}
