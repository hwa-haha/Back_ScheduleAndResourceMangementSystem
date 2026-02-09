import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetEmployeesForWorkHoursStatisticsQuery } from './get-employees-for-work-hours-statistics.query';
import {
    IGetEmployeesForWorkHoursStatisticsResponse,
    IEmployeeInfoForWorkHoursStatistics,
} from '../../../interfaces/response/get-employees-for-work-hours-statistics-response.interface';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';
import { EmployeeStatus } from '@libs/modules/employee/employee.entity';

/**
 * 시수 통계 대상 직원 결정 Query Handler
 *
 * 부서 ID가 있으면 해당 부서(및 하위) 부서원, 없으면 해당 연월 전체 직원을 구한 뒤
 * 직원명·부서명 검색 및 직원 ID 필터를 적용합니다.
 */
@QueryHandler(GetEmployeesForWorkHoursStatisticsQuery)
export class GetEmployeesForWorkHoursStatisticsHandler implements IQueryHandler<
    GetEmployeesForWorkHoursStatisticsQuery,
    IGetEmployeesForWorkHoursStatisticsResponse
> {
    private readonly logger = new Logger(GetEmployeesForWorkHoursStatisticsHandler.name);

    constructor(
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

        const employeeInfoMap = new Map<
            string,
            { employeeName: string; employeeNumber: string; departmentName: string }
        >();

        if (departmentIds?.length) {
            for (const departmentId of departmentIds) {
                const histories =
                    await this.employeeDepartmentPositionHistoryService.특정연월부서와하위부서의배치이력목록을조회한다(
                        year,
                        monthStr,
                        departmentId,
                    );
                for (const h of histories) {
                    if (employeeInfoMap.has(h.employeeId)) continue;
                    const emp = h.employee as { name?: string; employeeNumber?: string } | undefined;
                    const dept = h.department as { departmentName?: string } | undefined;
                    employeeInfoMap.set(h.employeeId, {
                        employeeName: emp?.name ?? '',
                        employeeNumber: emp?.employeeNumber ?? '',
                        departmentName: dept?.departmentName ?? '',
                    });
                }
            }
        } else {
            const histories = await this.employeeDepartmentPositionHistoryService.특정연월의전체배치이력목록을조회한다(
                year,
                monthStr,
            );
            for (const h of histories) {
                if (employeeInfoMap.has(h.employeeId)) continue;
                const emp = h.employee as { name?: string; employeeNumber?: string } | undefined;
                const dept = h.department as { departmentName?: string } | undefined;
                if (h.department.departmentName !== '퇴사자') {
                    employeeInfoMap.set(h.employeeId, {
                        employeeName: emp?.name ?? '',
                        employeeNumber: emp?.employeeNumber ?? '',
                        departmentName: dept?.departmentName ?? '',
                    });
                }
            }
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
