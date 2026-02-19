import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, DataSource } from 'typeorm';
import { EmployeeDepartmentPositionHistory } from './employee-department-position-history.entity';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Department } from '../department/department.entity';
import { DepartmentHistory } from '../department-history/department-history.entity';

/**
 * 직원-부서-직책 이력 서비스
 *
 * 직원-부서-직책 이력 엔티티에 대한 CRUD 기능을 제공합니다.
 * 상위 로직에서 제공하는 트랜잭션(EntityManager)을 받아서 사용할 수 있습니다.
 * 부서 계층 조회는 Repository + QueryBuilder(where)만 사용하여 도메인 순수성을 유지합니다.
 *
 * [함수별 사용처]
 * - save: migration.service
 * - findByDepartmentAtDate: get-snapshot-list-with-department-children (includeChildren 미사용), get-monthly-summaries (includeChildren: true)
 * - findAllCurrent: get-reviewers-by-department.handler
 * - 특정연월의배치이력목록을조회한다: save-company-monthly-snapshot, get-department-list (department만), get-employees-for-work-hours-statistics, get-department-list-with-employees (includeEmployee: true)
 */
@Injectable()
export class DomainEmployeeDepartmentPositionHistoryService {
    constructor(
        @InjectRepository(EmployeeDepartmentPositionHistory)
        private readonly repository: Repository<EmployeeDepartmentPositionHistory>,
        @InjectRepository(DepartmentHistory)
        private readonly departmentHistoryRepository: Repository<DepartmentHistory>,
        @InjectRepository(Department)
        private readonly departmentRepository: Repository<Department>,
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Repository를 가져온다 (트랜잭션 지원)
     */
    private getRepository(manager?: EntityManager): Repository<EmployeeDepartmentPositionHistory> {
        return manager ? manager.getRepository(EmployeeDepartmentPositionHistory) : this.repository;
    }

    /**
     * 특정 연월의 시작일·종료일을 반환한다 (연월 기준 조회 공통)
     */
    private getMonthDateRange(year: string, month: string): { startDate: string; endDate: string } {
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        const monthStart = startOfMonth(new Date(yearNum, monthNum - 1, 1));
        const monthEnd = endOfMonth(new Date(yearNum, monthNum - 1, 1));
        return {
            startDate: format(monthStart, 'yyyy-MM-dd'),
            endDate: format(monthEnd, 'yyyy-MM-dd'),
        };
    }

    /**
     * 엔티티를 저장한다
     */
    async save(
        entity: EmployeeDepartmentPositionHistory,
        options?: { queryRunner?: any },
    ): Promise<EmployeeDepartmentPositionHistory> {
        const repository = options?.queryRunner
            ? options.queryRunner.manager.getRepository(EmployeeDepartmentPositionHistory)
            : this.repository;
        return await repository.save(entity);
    }

    /**
     * 특정 부서의 특정 시점 배치 목록을 조회한다
     *
     * @param departmentId 부서 ID
     * @param targetDate 대상 날짜 (yyyy-MM-dd)
     * @param options.includeChildren true이면 해당 부서 및 모든 하위 부서의 배치를 재귀 조회 (해당 시점 부서 계층 기준)
     */
    async findByDepartmentAtDate(
        departmentId: string,
        targetDate: string,
        options?: { includeChildren?: boolean },
    ): Promise<EmployeeDepartmentPositionHistory[]> {
        if (options?.includeChildren) {
            return this.findByDepartmentWithChildrenAtDateInternal(departmentId, targetDate);
        }

        return this.repository
            .createQueryBuilder('eh')
            .leftJoinAndSelect('eh.employee', 'emp')
            .leftJoinAndSelect('eh.position', 'pos')
            .leftJoinAndSelect('eh.rank', 'rank')
            .where('eh.departmentId = :departmentId', { departmentId })
            .andWhere('eh.effectiveStartDate <= :targetDate', { targetDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :targetDate)', { targetDate })
            .getMany();
    }

    /**
     * 특정 부서 및 모든 하위 부서의 특정 시점 배치 목록을 재귀적으로 조회 (내부 구현)
     */
    private async findByDepartmentWithChildrenAtDateInternal(
        departmentId: string,
        targetDate: string,
    ): Promise<EmployeeDepartmentPositionHistory[]> {
        const allHistories = await this.repository
            .createQueryBuilder('eh')
            .select('eh.departmentId', 'departmentId')
            .addSelect('eh.parentDepartmentId', 'parentDepartmentId')
            .where('eh.effectiveStartDate <= :targetDate', { targetDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :targetDate)', { targetDate })
            .distinct(true)
            .getRawMany();
        const parentToChildrenMap = new Map<string, Set<string>>();
        for (const history of allHistories) {
            const deptId = history.departmentId;
            const parentDeptId = history.parentDepartmentId;
            if (parentDeptId) {
                if (!parentToChildrenMap.has(parentDeptId)) {
                    parentToChildrenMap.set(parentDeptId, new Set());
                }
                parentToChildrenMap.get(parentDeptId)!.add(deptId);
            }
        }

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

        return this.repository
            .createQueryBuilder('eh')
            .leftJoinAndSelect('eh.employee', 'emp')
            .leftJoinAndSelect('eh.position', 'pos')
            .leftJoinAndSelect('eh.rank', 'rank')
            .where('eh.departmentId IN (:...departmentIds)', { departmentIds })
            .andWhere('eh.effectiveStartDate <= :targetDate', { targetDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :targetDate)', { targetDate })
            .getMany();
    }

    /**
     * 현재 유효한 모든 직원 배치를 조회한다
     */
    async findAllCurrent(): Promise<EmployeeDepartmentPositionHistory[]> {
        return this.repository
            .createQueryBuilder('eh')
            .leftJoinAndSelect('eh.employee', 'emp')
            .leftJoinAndSelect('eh.department', 'dept')
            .leftJoinAndSelect('eh.position', 'pos')
            .leftJoinAndSelect('eh.rank', 'rank')
            .where('eh.isCurrent = :isCurrent', { isCurrent: true })
            .getMany();
    }

    /**
     * 특정 연월에 유효한 배치이력 목록을 조회한다
     *
     * 해당 월의 범위(첫 날짜 ~ 마지막 날짜) 내에 유효한 배치 정보를 조회하여 배치이력 엔티티를 반환합니다.
     *
     * @param year 연도
     * @param month 월
     * @param options.includeEmployee true이면 employee 관계까지 로드 (직원 정보 필요 시 사용)
     */
    async 특정연월의배치이력목록을조회한다(
        year: string,
        month: string,
        options?: { includeEmployee?: boolean },
    ): Promise<EmployeeDepartmentPositionHistory[]> {
        const { startDate, endDate } = this.getMonthDateRange(year, month);

        const qb = this.repository
            .createQueryBuilder('eh')
            .leftJoinAndSelect('eh.department', 'dept')
            .where('eh.effectiveStartDate <= :endDate', { endDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :startDate)', { startDate });

        if (options?.includeEmployee) {
            qb.leftJoinAndSelect('eh.employee', 'emp');
        }

        return qb.getMany();
    }
}
