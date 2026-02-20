import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetEmployeeDepartmentPositionHistoryListQuery } from './get-employee-department-position-history-list.query';
import { EmployeeDepartmentPositionHistory } from '@libs/modules/employee-department-position-history/employee-department-position-history.entity';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';
import { Department } from '@libs/modules/department/department.entity';

/**
 * 연월별 직원배치이력 목록 조회 Handler
 *
 * get-department-list.handler와 동일한 방식으로 해당 연월의 부서 계층을 구성한 뒤,
 * 연월에 유효한 배치이력 목록을 반환합니다.
 * departmentId가 주어지면 해당 부서와 그 하위 부서에 속한 배치이력만 반환합니다.
 */
@QueryHandler(GetEmployeeDepartmentPositionHistoryListQuery)
export class GetEmployeeDepartmentPositionHistoryListHandler implements IQueryHandler<
    GetEmployeeDepartmentPositionHistoryListQuery,
    EmployeeDepartmentPositionHistory[]
> {
    private readonly logger = new Logger(GetEmployeeDepartmentPositionHistoryListHandler.name);

    constructor(
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(query: GetEmployeeDepartmentPositionHistoryListQuery): Promise<EmployeeDepartmentPositionHistory[]> {
        const { year, month, departmentId } = query.data;

        this.logger.log(
            `연월별 직원배치이력 목록 조회: year=${year}, month=${month}, departmentId=${departmentId ?? '전체'}`,
        );

        // 1. 해당 연월에 유효한 배치이력 목록 조회
        let employeeHistories = await this.employeeDepartmentPositionHistoryService.특정연월의배치이력목록을조회한다(
            year,
            month,
        );

        if (employeeHistories.length === 0) {
            this.logger.warn(`해당 연월에 유효한 배치이력이 없습니다. year=${year}, month=${month}`);
            return [];
        }

        // 2. 배치이력에서 부서 ID·부모 부서 ID 추출
        const allRequiredDepartmentIds = new Set<string>();
        for (const history of employeeHistories) {
            if (history.departmentId) {
                allRequiredDepartmentIds.add(history.departmentId);
                if (history.parentDepartmentId) {
                    allRequiredDepartmentIds.add(history.parentDepartmentId);
                }
            }
        }

        // 3. 필요한 부서 상세 조회 (퇴사자 부서 제외)
        const allDepartments = await this.dataSource.manager
            .createQueryBuilder(Department, 'dept')
            .where('dept.id IN (:...ids)', { ids: Array.from(allRequiredDepartmentIds) })
            .andWhere('dept.departmentName != :excludedDepartmentName', { excludedDepartmentName: '퇴사자' })
            .getMany();

        // 4. 배치이력에 저장된 부모-자식 관계를 기준으로 부서 관계 맵 생성
        const departmentParentMap = new Map<string, string | null>();
        for (const history of employeeHistories) {
            if (history.departmentId) {
                const parentId = history.parentDepartmentId || null;
                if (!departmentParentMap.has(history.departmentId)) {
                    departmentParentMap.set(history.departmentId, parentId);
                }
            }
        }

        // 4-1. 배치이력에는 없고 부모로만 등장하는 중간 부서는 Department 테이블로 상위 연결 보완
        const fetchedDeptIds = new Set(allDepartments.map((d) => d.id));
        let parentOnlyDeptIds = [...departmentParentMap.values()].filter(
            (id): id is string => id != null && !fetchedDeptIds.has(id),
        );
        while (parentOnlyDeptIds.length > 0) {
            const supplementary = await this.dataSource.manager
                .createQueryBuilder(Department, 'd')
                .where('d.id IN (:...ids)', { ids: parentOnlyDeptIds })
                .andWhere('d.departmentName != :excludedDepartmentName', { excludedDepartmentName: '퇴사자' })
                .getMany();
            if (supplementary.length === 0) {
                break; // 퇴사자 등 조회되지 않는 부서만 남은 경우 루프 종료
            }
            for (const dept of supplementary) {
                fetchedDeptIds.add(dept.id);
                allDepartments.push(dept);
                departmentParentMap.set(dept.id, dept.parentDepartmentId ?? null);
            }
            parentOnlyDeptIds = [...departmentParentMap.values()].filter(
                (id): id is string => id != null && !fetchedDeptIds.has(id),
            );
        }

        // 4-2. 배치이력에 한 번도 등장하지 않은 부서는 Department 마스터의 parentDepartmentId로 부모 보완
        for (const dept of allDepartments) {
            if (!departmentParentMap.has(dept.id)) {
                departmentParentMap.set(dept.id, dept.parentDepartmentId ?? null);
            }
        }

        // 5. departmentId가 있으면 해당 부서 + 하위 부서 ID 집합 구한 뒤 배치이력 필터
        if (departmentId) {
            const parentToChildrenMap = new Map<string, string[]>();
            for (const [deptId, parentId] of departmentParentMap) {
                const key = parentId ?? '';
                if (!parentToChildrenMap.has(key)) {
                    parentToChildrenMap.set(key, []);
                }
                parentToChildrenMap.get(key)!.push(deptId);
            }
            const allowedDepartmentIds = new Set<string>();
            const queue = [departmentId];
            while (queue.length > 0) {
                const id = queue.shift()!;
                if (allowedDepartmentIds.has(id)) continue;
                allowedDepartmentIds.add(id);
                const children = parentToChildrenMap.get(id) ?? [];
                queue.push(...children);
            }
            employeeHistories = employeeHistories.filter(
                (h) => h.departmentId && allowedDepartmentIds.has(h.departmentId),
            );
        }

        this.logger.log(`연월별 직원배치이력 목록 조회 완료: ${employeeHistories.length}건`);

        return employeeHistories;
    }
}
