import { QueryHandler, IQueryHandler, QueryBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetEmployeesForWorkHoursStatisticsQuery } from './get-employees-for-work-hours-statistics.query';
import {
    IGetEmployeesForWorkHoursStatisticsResponse,
    IEmployeeInfoForWorkHoursStatistics,
} from '../../../interfaces/response/get-employees-for-work-hours-statistics-response.interface';
import { GetAssignmentHistoryByYearMonthDepartmentQuery } from '../../../../organization-management-context';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';
import { EmployeeDepartmentPositionHistory } from '@libs/modules/employee-department-position-history/employee-department-position-history.entity';

/**
 * 시수 통계 대상 직원 결정 Query Handler
 *
 * 부서가 있으면 QueryBus로 부서별 배치이력 조회 핸들러를 호출하고, 없으면 도메인 서비스로 전체 배치이력을 조회한 뒤
 * 직원명·부서명 검색 및 직원 ID 필터를 적용합니다.
 */
@QueryHandler(GetEmployeesForWorkHoursStatisticsQuery)
export class GetEmployeesForWorkHoursStatisticsHandler implements IQueryHandler<
    GetEmployeesForWorkHoursStatisticsQuery,
    IGetEmployeesForWorkHoursStatisticsResponse
> {
    private readonly logger = new Logger(GetEmployeesForWorkHoursStatisticsHandler.name);

    constructor(
        private readonly queryBus: QueryBus,
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
    ) {}

    async execute(
        query: GetEmployeesForWorkHoursStatisticsQuery,
    ): Promise<IGetEmployeesForWorkHoursStatisticsResponse> {
        const {
            year,
            month,
            departmentIds,
            employeeNameSearch,
            departmentNameSearch,
            employeeIds: filterEmployeeIds,
        } = query.data;
        const monthStr = month.padStart(2, '0');

        let assignmentHistories: EmployeeDepartmentPositionHistory[];
        if (departmentIds?.length) {
            const all: EmployeeDepartmentPositionHistory[] = [];
            for (const departmentId of departmentIds) {
                const histories = await this.queryBus.execute(
                    new GetAssignmentHistoryByYearMonthDepartmentQuery({
                        year,
                        month: monthStr,
                        departmentId,
                    }),
                );
                for (const h of histories) {
                    if (!all.some((x) => x.employeeId === h.employeeId && x.departmentId === h.departmentId))
                        all.push(h);
                }
            }
            assignmentHistories = all;
        } else {
            assignmentHistories =
                await this.employeeDepartmentPositionHistoryService.특정연월의전체배치이력목록을조회한다(
                    year,
                    monthStr,
                );
        }

        const employeeInfoMap = new Map<
            string,
            { employeeName: string; employeeNumber: string; departmentName: string }
        >();

        for (const h of assignmentHistories) {
            if (employeeInfoMap.has(h.employeeId)) continue;
            const dept = h.department as { departmentName?: string } | undefined;
            if (dept?.departmentName === '퇴사자') continue;
            const emp = h.employee as { name?: string; employeeNumber?: string } | undefined;
            employeeInfoMap.set(h.employeeId, {
                employeeName: emp?.name ?? '',
                employeeNumber: emp?.employeeNumber ?? '',
                departmentName: dept?.departmentName ?? '',
            });
        }

        let targetEmployeeIds = Array.from(employeeInfoMap.keys());

        if (employeeNameSearch?.trim()) {
            const search = employeeNameSearch.trim().toLowerCase();
            targetEmployeeIds = targetEmployeeIds.filter((id) => {
                const info = employeeInfoMap.get(id)!;
                return info.employeeName.toLowerCase().includes(search);
            });
        }
        if (departmentNameSearch?.trim()) {
            const search = departmentNameSearch.trim().toLowerCase();
            targetEmployeeIds = targetEmployeeIds.filter((id) => {
                const info = employeeInfoMap.get(id)!;
                return info.departmentName.toLowerCase().includes(search);
            });
        }
        if (filterEmployeeIds?.length) {
            const set = new Set(filterEmployeeIds);
            targetEmployeeIds = targetEmployeeIds.filter((id) => set.has(id));
        }

        const items: IEmployeeInfoForWorkHoursStatistics[] = targetEmployeeIds.map((employeeId) => {
            const info = employeeInfoMap.get(employeeId)!;
            return {
                employeeId,
                employeeName: info.employeeName,
                employeeNumber: info.employeeNumber,
                departmentName: info.departmentName,
            };
        });

        this.logger.log(
            `시수 통계 대상 직원 결정: year=${year}, month=${monthStr}, departmentIds=${departmentIds?.length ?? 0}, 결과=${targetEmployeeIds.length}명`,
        );

        return { employeeIds: targetEmployeeIds, items };
    }
}
