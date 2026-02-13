import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { GetAssignmentHistoryByYearMonthDepartmentQuery } from './get-assignment-history-by-year-month-department.query';
import { EmployeeDepartmentPositionHistory } from '@libs/modules/employee-department-position-history/employee-department-position-history.entity';
import { DepartmentHistory } from '@libs/modules/department-history/department-history.entity';
import { Department } from '@libs/modules/department/department.entity';

/**
 * 특정 연월·부서(및 하위 부서) 배치이력 조회 Query Handler
 *
 * 해당 월의 범위(첫 날짜 ~ 마지막 날짜) 내에 유효한 배치 정보를 조회하여 배치이력 엔티티를 반환합니다.
 * 특정 부서 및 모든 하위 부서에 속한 직원의 배치이력을 재귀적으로 조회합니다.
 *
 * 주의: 특정 연월의 부서 계층 구조를 기반으로 하위 부서를 찾습니다.
 * 현재 시점의 부서 구조가 아닌, 해당 연월에 실제로 존재했던 부서 계층 구조를 사용합니다.
 */
@QueryHandler(GetAssignmentHistoryByYearMonthDepartmentQuery)
export class GetAssignmentHistoryByYearMonthDepartmentHandler
    implements IQueryHandler<GetAssignmentHistoryByYearMonthDepartmentQuery, EmployeeDepartmentPositionHistory[]>
{
    private readonly logger = new Logger(GetAssignmentHistoryByYearMonthDepartmentHandler.name);

    constructor(
        @InjectRepository(EmployeeDepartmentPositionHistory)
        private readonly assignmentHistoryRepository: Repository<EmployeeDepartmentPositionHistory>,
        @InjectRepository(DepartmentHistory)
        private readonly departmentHistoryRepository: Repository<DepartmentHistory>,
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
    ) {}

    async execute(
        query: GetAssignmentHistoryByYearMonthDepartmentQuery,
    ): Promise<EmployeeDepartmentPositionHistory[]> {
        const { year, month, departmentId } = query.data;
        const repository = this.assignmentHistoryRepository;

        // 해당 월의 시작일과 종료일 계산
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const monthStart = startOfMonth(new Date(yearNum, monthNum - 1, 1));
        const monthEnd = endOfMonth(new Date(yearNum, monthNum - 1, 1));
        const startDate = format(monthStart, 'yyyy-MM-dd');
        const endDate = format(monthEnd, 'yyyy-MM-dd');

        this.logger.log(
            `특정 연월·부서 배치이력 조회: departmentId=${departmentId}, year=${year}, month=${month}`,
        );

        // 1. 해당 연월의 부서 구조: 부서 이력 + 배치 이력 조회 (Repository + where만 사용, 타 도메인 서비스 미의존)
        const [deptHistoryRows, assignmentHistoryRows] = await Promise.all([
            this.departmentHistoryRepository
                .createQueryBuilder('dh')
                .select('dh.departmentId', 'departmentId')
                .addSelect('dh.parentDepartmentId', 'parentDepartmentId')
                .where('dh.effectiveStartDate <= :endDate', { endDate })
                .andWhere('(dh.effectiveEndDate IS NULL OR dh.effectiveEndDate >= :startDate)', { startDate })
                .distinct(true)
                .getRawMany(),
            repository
                .createQueryBuilder('eh')
                .select('eh.departmentId', 'departmentId')
                .addSelect('eh.parentDepartmentId', 'parentDepartmentId')
                .where('eh.effectiveStartDate <= :endDate', { endDate })
                .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :startDate)', { startDate })
                .distinct(true)
                .getRawMany(),
        ]);

        // 2. 부서 계층 구조 맵 생성 (parentDepartmentId -> [childDepartmentId, ...])
        const parentToChildrenMap = new Map<string, Set<string>>();
        const departmentIdsFromHistory = new Set<string>();

        const addLink = (deptId: string, parentDeptId: string | null | undefined) => {
            departmentIdsFromHistory.add(deptId);
            if (parentDeptId) {
                if (!parentToChildrenMap.has(parentDeptId)) {
                    parentToChildrenMap.set(parentDeptId, new Set());
                }
                parentToChildrenMap.get(parentDeptId)!.add(deptId);
            }
        };

        for (const row of deptHistoryRows) {
            addLink(row.departmentId, row.parentDepartmentId ?? undefined);
        }
        for (const row of assignmentHistoryRows) {
            addLink(row.departmentId, row.parentDepartmentId);
        }

        // 2-1. 직원·부서이력 둘 다에 없는 중간 부서(부모로만 등장)는 departments-info 테이블 where로 상위 연결 보완
        const parentOnlyDeptIds = [...parentToChildrenMap.keys()].filter((id) => !departmentIdsFromHistory.has(id));
        if (parentOnlyDeptIds.length > 0) {
            const parents = await this.departmentRepository
                .createQueryBuilder('d')
                .select('d.id', 'id')
                .addSelect('d.parentDepartmentId', 'parentDepartmentId')
                .where('d.id IN (:...ids)', { ids: parentOnlyDeptIds })
                .andWhere('d.parentDepartmentId IS NOT NULL')
                .getRawMany();
            for (const p of parents) {
                if (!parentToChildrenMap.has(p.parentDepartmentId)) {
                    parentToChildrenMap.set(p.parentDepartmentId, new Set());
                }
                parentToChildrenMap.get(p.parentDepartmentId)!.add(p.id);
            }
        }

        // 3. 특정 부서의 하위 부서 ID 목록을 재귀적으로 조회 (해당 연월의 부서 구조 기반)
        const departmentIds: string[] = [departmentId];
        const findChildDepartments = (parentId: string): void => {
            const children = parentToChildrenMap.get(parentId);
            if (children) {
                for (const childId of children) {
                    if (!departmentIds.includes(childId)) {
                        departmentIds.push(childId);
                        findChildDepartments(childId);
                    }
                }
            }
        };

        findChildDepartments(departmentId);

        // 4. 모든 부서(본부서 + 하위 부서)의 배치 이력 조회
        return await repository
            .createQueryBuilder('eh')
            .leftJoinAndSelect('eh.department', 'dept')
            .leftJoinAndSelect('eh.employee', 'emp')
            .leftJoinAndSelect('eh.position', 'pos')
            .leftJoinAndSelect('eh.rank', 'rank')
            .where('eh.departmentId IN (:...departmentIds)', { departmentIds })
            .andWhere('eh.effectiveStartDate <= :endDate', { endDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :startDate)', { startDate })
            .getMany();
    }
}
