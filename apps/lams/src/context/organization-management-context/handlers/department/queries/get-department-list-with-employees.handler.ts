import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetDepartmentListWithEmployeesQuery } from './get-department-list-with-employees.query';
import {
    IGetDepartmentListWithEmployeesResponse,
    IDepartmentNodeWithEmployees,
    IDepartmentInfoWithEmployees,
    IEmployeeInDepartment,
} from '../../../interfaces/response/get-department-list-with-employees-response.interface';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';
import { Department } from '@libs/modules/department/department.entity';

/**
 * 부서 목록 + 부서별 직원 조회 Query Handler
 *
 * 요청 연월을 기준으로 해당 시점에 유효했던 부서 목록과 부서별 소속 직원 정보를 반환합니다.
 */
@QueryHandler(GetDepartmentListWithEmployeesQuery)
export class GetDepartmentListWithEmployeesHandler implements IQueryHandler<
    GetDepartmentListWithEmployeesQuery,
    IGetDepartmentListWithEmployeesResponse
> {
    private readonly logger = new Logger(GetDepartmentListWithEmployeesHandler.name);

    constructor(
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(query: GetDepartmentListWithEmployeesQuery): Promise<IGetDepartmentListWithEmployeesResponse> {
        const { year, month } = query.data;
        const monthStr = month.padStart(2, '0');

        this.logger.log(`부서 목록+부서별 직원 조회: year=${year}, month=${monthStr}`);

        const employeeHistories =
            await this.employeeDepartmentPositionHistoryService.특정연월의배치이력목록을조회한다(year, monthStr, {
                includeEmployee: true,
            });

        if (employeeHistories.length === 0) {
            this.logger.warn(`해당 연월에 유효한 배치이력이 없습니다. year=${year}, month=${monthStr}`);
            return {
                hierarchy: [],
                flatList: [],
                totalDepartments: 0,
                totalEmployees: 0,
            };
        }

        const allRequiredDepartmentIds = new Set<string>();
        const departmentParentMap = new Map<string, string | null>();
        const departmentEmployeeCountMap = new Map<string, number>();
        const departmentEmployeesMap = new Map<string, Map<string, IEmployeeInDepartment>>();

        for (const h of employeeHistories) {
            if (!h.departmentId) continue;

            allRequiredDepartmentIds.add(h.departmentId);
            if (h.parentDepartmentId) allRequiredDepartmentIds.add(h.parentDepartmentId);

            if (!departmentParentMap.has(h.departmentId)) {
                departmentParentMap.set(h.departmentId, h.parentDepartmentId ?? null);
            }

            departmentEmployeeCountMap.set(h.departmentId, (departmentEmployeeCountMap.get(h.departmentId) ?? 0) + 1);

            const emp = h.employee as { id?: string; name?: string; employeeNumber?: string } | undefined;
            if (emp?.id) {
                let byDept = departmentEmployeesMap.get(h.departmentId);
                if (!byDept) {
                    byDept = new Map<string, IEmployeeInDepartment>();
                    departmentEmployeesMap.set(h.departmentId, byDept);
                }
                if (!byDept.has(emp.id)) {
                    byDept.set(emp.id, {
                        employeeId: emp.id,
                        name: emp.name ?? '',
                        employeeNumber: emp.employeeNumber ?? '',
                    });
                }
            }
        }

        const allDepartments = await this.dataSource.manager
            .createQueryBuilder(Department, 'dept')
            .where('dept.id IN (:...ids)', { ids: Array.from(allRequiredDepartmentIds) })
            .andWhere('dept.departmentName != :excludedDepartmentName', { excludedDepartmentName: '퇴사자' })
            .orderBy('dept.order', 'ASC')
            .getMany();

        for (const dept of allDepartments) {
            if (!departmentEmployeeCountMap.has(dept.id)) departmentEmployeeCountMap.set(dept.id, 0);
        }

        const flatList: IDepartmentInfoWithEmployees[] = allDepartments.map((dept) => {
            const employees = Array.from(departmentEmployeesMap.get(dept.id)?.values() ?? []);
            return {
                id: dept.id,
                departmentCode: dept.departmentCode,
                departmentName: dept.departmentName,
                parentDepartmentId: departmentParentMap.get(dept.id) ?? null,
                type: dept.type,
                order: dept.order,
                employeeCount: departmentEmployeeCountMap.get(dept.id) ?? 0,
                employees,
            };
        });

        const nodeMap = new Map<string, IDepartmentNodeWithEmployees>();
        const rootNodes: IDepartmentNodeWithEmployees[] = [];

        for (const dept of allDepartments) {
            const employees = Array.from(departmentEmployeesMap.get(dept.id)?.values() ?? []);
            const node: IDepartmentNodeWithEmployees = {
                id: dept.id,
                departmentCode: dept.departmentCode,
                departmentName: dept.departmentName,
                parentDepartmentId: departmentParentMap.get(dept.id) ?? null,
                type: dept.type,
                order: dept.order,
                employeeCount: departmentEmployeeCountMap.get(dept.id) ?? 0,
                employees,
                children: [],
            };
            nodeMap.set(dept.id, node);
        }

        for (const dept of allDepartments) {
            const node = nodeMap.get(dept.id)!;
            const parentId = departmentParentMap.get(dept.id);
            if (parentId && nodeMap.has(parentId)) {
                nodeMap.get(parentId)!.children.push(node);
                nodeMap.get(parentId)!.children.sort((a, b) => a.order - b.order);
            } else {
                rootNodes.push(node);
            }
        }
        rootNodes.sort((a, b) => a.order - b.order);

        const totalEmployees = Array.from(departmentEmployeeCountMap.values()).reduce((sum, count) => sum + count, 0);

        this.logger.log(
            `부서 목록+부서별 직원 조회 완료: totalDepartments=${allDepartments.length}, totalEmployees=${totalEmployees}`,
        );

        return {
            hierarchy: rootNodes,
            flatList,
            totalDepartments: allDepartments.length,
            totalEmployees,
        };
    }
}
