import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetDepartmentListQuery } from './get-department-list.query';
import {
    IGetDepartmentListResponse,
    IDepartmentNode,
    IDepartmentInfo,
} from '../../../interfaces/response/get-department-list-response.interface';
import { DomainDepartmentService } from '@libs/modules/department/department.service';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';
import { Department } from '@libs/modules/department/department.entity';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { DomainEmployeeDepartmentPermissionService } from '../../../../../domain/employee-department-permission/employee-department-permission.service';

/**
 * 부서 목록 조회 Query Handler
 *
 * 요청받은 연월을 기준으로 해당 월에 유효했던 조직도 상태를 반환합니다.
 * 계층구조와, 계층구조를 DFS 순회하여 평탄화한 1차원 배열을 제공합니다.
 */
@QueryHandler(GetDepartmentListQuery)
export class GetDepartmentListHandler implements IQueryHandler<GetDepartmentListQuery, IGetDepartmentListResponse> {
    private readonly logger = new Logger(GetDepartmentListHandler.name);

    constructor(
        private readonly departmentService: DomainDepartmentService,
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
        private readonly dataSource: DataSource,
        private readonly employeeDepartmentPermissionService: DomainEmployeeDepartmentPermissionService,
    ) {}

    async execute(query: GetDepartmentListQuery): Promise<IGetDepartmentListResponse> {
        const { year, month } = query.data;

        this.logger.log(`부서 목록 조회 시작: year=${year}, month=${month}`);

        // 날짜 범위 계산
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const monthStart = startOfMonth(new Date(yearNum, monthNum - 1, 1));
        const monthEnd = endOfMonth(new Date(yearNum, monthNum - 1, 1));
        const endDate = format(monthEnd, 'yyyy-MM-dd');

        // 1. 해당 연월에 유효한 배치이력 목록 조회
        const employeeHistories = await this.employeeDepartmentPositionHistoryService.특정연월의배치이력목록을조회한다(
            year,
            month,
        );

        if (employeeHistories.length === 0) {
            this.logger.warn(`해당 연월에 유효한 배치이력이 없습니다. year=${year}, month=${month}`);
            return {
                hierarchy: [],
                flatList: [],
                totalDepartments: 0,
                totalEmployees: 0,
            };
        }

        // 2. 배치이력에서 부서 ID와 부모 부서 ID 추출 및 직원 수 계산
        const departmentEmployeeCountMap = new Map<string, number>();
        const allRequiredDepartmentIds = new Set<string>();

        for (const history of employeeHistories) {
            if (history.departmentId) {
                // 배치이력에 저장된 부서 ID 추가
                allRequiredDepartmentIds.add(history.departmentId);

                // 배치이력에 저장된 부모 부서 ID 추가 (해당 시점의 조직 구조)
                if (history.parentDepartmentId) {
                    allRequiredDepartmentIds.add(history.parentDepartmentId);
                }

                // 직원 수 계산
                const currentCount = departmentEmployeeCountMap.get(history.departmentId) || 0;
                departmentEmployeeCountMap.set(history.departmentId, currentCount + 1);
            }
        }
        // 3. 필요한 모든 부서들의 상세 정보 조회 (퇴사자 부서 제외)
        const allDepartments = await this.dataSource.manager
            .createQueryBuilder(Department, 'dept')
            .where('dept.id IN (:...ids)', { ids: Array.from(allRequiredDepartmentIds) })
            .andWhere('dept.departmentName != :excludedDepartmentName', { excludedDepartmentName: '퇴사자' })
            .orderBy('dept.order', 'ASC')
            .getMany();
        // 부서 ID로 부서 정보를 빠르게 조회하기 위한 맵 생성
        const departmentMapById = new Map<string, Department>();
        for (const dept of allDepartments) {
            departmentMapById.set(dept.id, dept);
        }

        // 4. 배치이력에 저장된 부모-자식 관계를 기준으로 부서 관계 맵 생성
        // 배치이력의 parentDepartmentId가 해당 시점의 조직 구조를 나타냄
        const departmentParentMap = new Map<string, string | null>();
        for (const history of employeeHistories) {
            if (history.departmentId) {
                // 배치이력에 저장된 부모 부서 ID를 사용 (해당 시점의 조직 구조)
                const parentId = history.parentDepartmentId || null;
                // 같은 부서에 여러 배치이력이 있을 수 있으므로, 첫 번째로 설정된 부모 관계를 사용
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
            for (const dept of supplementary) {
                fetchedDeptIds.add(dept.id);
                allDepartments.push(dept);
                departmentParentMap.set(dept.id, dept.parentDepartmentId ?? null);
            }
            parentOnlyDeptIds = [...departmentParentMap.values()].filter(
                (id): id is string => id != null && !fetchedDeptIds.has(id),
            );
        }

        // 4-2. 배치이력에 한 번도 등장하지 않은 부서(해당 월 직원 미배치)는 Department 마스터의 parentDepartmentId로 부모 보완
        for (const dept of allDepartments) {
            if (!departmentParentMap.has(dept.id)) {
                departmentParentMap.set(dept.id, dept.parentDepartmentId ?? null);
            }
        }

        // 부서별 직원 수 설정 (배치이력에 없는 상위 부서는 0)
        for (const dept of allDepartments) {
            if (!departmentEmployeeCountMap.has(dept.id)) {
                departmentEmployeeCountMap.set(dept.id, 0);
            }
        }

        // 5. 계층구조 생성 (배치이력의 부모-자식 관계 사용)
        const departmentNodeMap = new Map<string, IDepartmentNode>();
        const rootDepartments: IDepartmentNode[] = [];

        // 모든 부서를 노드로 변환
        for (const dept of allDepartments) {
            const parentId = departmentParentMap.get(dept.id) || null;
            const node: IDepartmentNode = {
                id: dept.id,
                departmentCode: dept.departmentCode,
                departmentName: dept.departmentName,
                parentDepartmentId: parentId,
                type: dept.type,
                order: dept.order,
                employeeCount: departmentEmployeeCountMap.get(dept.id) || 0,
                children: [],
            };
            departmentNodeMap.set(dept.id, node);
        }

        // 배치이력의 부모-자식 관계를 기준으로 계층구조 설정
        for (const dept of allDepartments) {
            const node = departmentNodeMap.get(dept.id)!;
            const parentId = departmentParentMap.get(dept.id);

            if (parentId && departmentNodeMap.has(parentId)) {
                const parent = departmentNodeMap.get(parentId)!;
                parent.children.push(node);
            } else {
                rootDepartments.push(node);
            }
        }

        // 계층 내 정렬: 루트와 각 노드의 자식들을 order 기준으로 정렬
        rootDepartments.sort((a, b) => a.order - b.order);
        for (const node of departmentNodeMap.values()) {
            node.children.sort((a, b) => a.order - b.order);
        }
        // 6. 계층구조를 DFS 순회하여 flat 배열 생성 (부모 → 자식 순서 유지)
        let flatList = this.계층을평탄화한다(rootDepartments);
        let hierarchy = rootDepartments;
        let totalDepartments = allDepartments.length;
        let totalEmployees = Array.from(departmentEmployeeCountMap.values()).reduce((sum, count) => sum + count, 0);

        // 7. employeeId가 있으면 접근 권한이 있는 부서 + 하위 부서만 필터링
        const employeeId = query.data.employeeId;
        if (employeeId) {
            const permissions = await this.employeeDepartmentPermissionService.직원으로목록조회한다(employeeId);
            const allowedRootDepartmentIds = permissions
                .filter((p) => p.hasAccessPermission)
                .map((p) => p.departmentId);
            if (allowedRootDepartmentIds.length === 0) {
                return {
                    hierarchy: [],
                    flatList: [],
                    totalDepartments: 0,
                    totalEmployees: 0,
                };
            }
            const filterHelper = this.접근권한기준으로부서목록을필터링한다(flatList);
            hierarchy = filterHelper.filterHierarchy(hierarchy, allowedRootDepartmentIds);
            flatList = filterHelper.filterFlatList(flatList, allowedRootDepartmentIds);
            totalDepartments = flatList.length;
            totalEmployees = flatList.reduce((sum, d) => sum + d.employeeCount, 0);
        }

        this.logger.log(
            `부서 목록 조회 완료: totalDepartments=${totalDepartments}, totalEmployees=${totalEmployees}`,
        );

        return {
            hierarchy,
            flatList,
            totalDepartments,
            totalEmployees,
        };
    }

    /**
     * 접근 권한 기준으로 부서 목록을 필터링하기 위한 헬퍼를 반환한다.
     * 허용된 부서 ID(접근 권한이 있는 부서)와 그 하위 부서만 포함한다.
     */
    private 접근권한기준으로부서목록을필터링한다(flatList: IDepartmentInfo[]): {
        filterHierarchy: (nodes: IDepartmentNode[], allowedRootDepartmentIds: string[]) => IDepartmentNode[];
        filterFlatList: (list: IDepartmentInfo[], allowedRootDepartmentIds: string[]) => IDepartmentInfo[];
    } {
        // parentId -> 자식 id 목록 (flatList 기준)
        const parentToChildrenIds = new Map<string, string[]>();
        for (const d of flatList) {
            const parentId = d.parentDepartmentId ?? '';
            if (!parentToChildrenIds.has(parentId)) {
                parentToChildrenIds.set(parentId, []);
            }
            parentToChildrenIds.get(parentId)!.push(d.id);
        }
        const collectAllowedIds = (allowedRootIds: string[]): Set<string> => {
            const allowedSet = new Set<string>();
            const queue = [...allowedRootIds];
            while (queue.length > 0) {
                const id = queue.shift()!;
                if (allowedSet.has(id)) continue;
                allowedSet.add(id);
                const children = parentToChildrenIds.get(id) ?? [];
                queue.push(...children);
            }
            return allowedSet;
        };
        return {
            filterHierarchy: (nodes: IDepartmentNode[], allowedRootDepartmentIds: string[]) => {
                const allowedSet = collectAllowedIds(allowedRootDepartmentIds);
                // 권한 부서가 루트가 아닐 수 있으므로, 비허용 노드는 건너뛰고 그 자식들만 재귀 필터
                const filterNodes = (nodeList: IDepartmentNode[]): IDepartmentNode[] => {
                    const result: IDepartmentNode[] = [];
                    for (const node of nodeList) {
                        if (!allowedSet.has(node.id)) {
                            result.push(...filterNodes(node.children));
                        } else {
                            result.push({
                                ...node,
                                children: filterNodes(node.children),
                            });
                        }
                    }
                    return result;
                };
                return filterNodes(nodes);
            },
            filterFlatList: (list: IDepartmentInfo[], allowedRootDepartmentIds: string[]) => {
                const allowedSet = collectAllowedIds(allowedRootDepartmentIds);
                return list.filter((d) => allowedSet.has(d.id));
            },
        };
    }

    /**
     * 계층구조 트리를 DFS 순회하여 1차원 배열로 평탄화한다.
     * 부모 → 자식 순서와 order 정렬이 유지된 채로 반환한다.
     */
    private 계층을평탄화한다(nodes: IDepartmentNode[]): IDepartmentInfo[] {
        const result: IDepartmentInfo[] = [];
        const visit = (node: IDepartmentNode) => {
            result.push({
                id: node.id,
                departmentCode: node.departmentCode,
                departmentName: node.departmentName,
                parentDepartmentId: node.parentDepartmentId,
                type: node.type,
                order: node.order,
                employeeCount: node.employeeCount,
            });
            for (const child of node.children) {
                visit(child);
            }
        };
        for (const node of nodes) {
            visit(node);
        }
        return result;
    }
}
