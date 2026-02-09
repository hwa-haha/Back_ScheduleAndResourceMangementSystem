import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryRunner, Repository, DataSource, In } from 'typeorm';
import { EmployeeDepartmentPositionHistory } from './employee-department-position-history.entity';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { DomainDepartmentService } from '../department/department.service';

/**
 * 직원-부서-직책 이력 서비스
 *
 * 직원-부서-직책 이력 엔티티에 대한 CRUD 기능을 제공합니다.
 * 상위 로직에서 제공하는 트랜잭션(EntityManager)을 받아서 사용할 수 있습니다.
 */
@Injectable()
export class DomainEmployeeDepartmentPositionHistoryService {
    constructor(
        @InjectRepository(EmployeeDepartmentPositionHistory)
        private readonly repository: Repository<EmployeeDepartmentPositionHistory>,
        private readonly dataSource: DataSource,
        private readonly departmentService: DomainDepartmentService,
    ) {}

    /**
     * Repository를 가져온다 (트랜잭션 지원)
     */
    private getRepository(manager?: EntityManager): Repository<EmployeeDepartmentPositionHistory> {
        return manager ? manager.getRepository(EmployeeDepartmentPositionHistory) : this.repository;
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
     * 직원 발령 이력을 생성한다 (Setter 함수 활용)
     */
    async 직원발령이력을생성한다(
        params: {
            employeeId: string;
            departmentId: string;
            parentDepartmentId?: string;
            positionId: string;
            rankId?: string;
            isManager: boolean;
            effectiveStartDate: string;
            assignmentReason?: string;
            assignedBy?: string;
        },
        queryRunner?: QueryRunner,
    ): Promise<EmployeeDepartmentPositionHistory> {
        const newAssignment = new EmployeeDepartmentPositionHistory();

        // 기본 정보
        newAssignment.employeeId = params.employeeId;
        newAssignment.부서를설정한다(params.departmentId);
        newAssignment.상위부서를설정한다(params.parentDepartmentId);
        newAssignment.직책을설정한다(params.positionId);

        if (params.rankId) {
            newAssignment.직급을설정한다(params.rankId);
        }

        newAssignment.관리자권한을설정한다(params.isManager);

        // 유효 기간
        newAssignment.effectiveStartDate = params.effectiveStartDate;
        newAssignment.현재유효상태로설정한다();

        // 발령 메타데이터
        if (params.assignmentReason) {
            newAssignment.발령사유를설정한다(params.assignmentReason);
        }

        if (params.assignedBy) {
            newAssignment.발령자를설정한다(params.assignedBy);
        }

        return await this.save(newAssignment, { queryRunner });
    }

    /**
     * 직원 발령 이력의 종료일을 설정한다 (Setter 함수 활용)
     */
    async 이력을종료한다(
        history: EmployeeDepartmentPositionHistory,
        effectiveEndDate: string,
        queryRunner?: QueryRunner,
    ): Promise<EmployeeDepartmentPositionHistory> {
        // Setter 함수로 종료일 설정 (isCurrent도 함께 false로 변경)
        history.유효종료일을설정한다(effectiveEndDate);

        // 저장
        return await this.save(history, { queryRunner });
    }

    /**
     * 특정 시점의 직원 배치 정보를 조회한다
     */
    async findByEmployeeAtDate(
        employeeId: string,
        targetDate: string,
    ): Promise<EmployeeDepartmentPositionHistory | null> {
        return this.repository
            .createQueryBuilder('eh')
            .leftJoinAndSelect('eh.department', 'dept')
            .leftJoinAndSelect('eh.position', 'pos')
            .leftJoinAndSelect('eh.rank', 'rank')
            .where('eh.employeeId = :employeeId', { employeeId })
            .andWhere('eh.effectiveStartDate <= :targetDate', { targetDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :targetDate)', { targetDate })
            .getOne();
    }

    /**
     * 현재 유효한 직원 배치를 조회한다
     */
    async findCurrentByEmployeeId(employeeId: string): Promise<EmployeeDepartmentPositionHistory | null> {
        return this.repository
            .createQueryBuilder('eh')
            .leftJoinAndSelect('eh.department', 'dept')
            .leftJoinAndSelect('eh.position', 'pos')
            .leftJoinAndSelect('eh.rank', 'rank')
            .where('eh.employeeId = :employeeId', { employeeId })
            .andWhere('eh.isCurrent = :isCurrent', { isCurrent: true })
            .getOne();
    }

    /**
     * 직원의 모든 배치 이력을 조회한다
     */
    async findHistoryByEmployeeId(employeeId: string): Promise<EmployeeDepartmentPositionHistory[]> {
        return this.repository
            .createQueryBuilder('eh')
            .leftJoinAndSelect('eh.department', 'dept')
            .leftJoinAndSelect('eh.position', 'pos')
            .leftJoinAndSelect('eh.rank', 'rank')
            .where('eh.employeeId = :employeeId', { employeeId })
            .orderBy('eh.effectiveStartDate', 'DESC')
            .getMany();
    }

    /**
     * 특정 부서의 특정 시점 배치 목록을 조회한다
     */
    async findByDepartmentAtDate(
        departmentId: string,
        targetDate: string,
    ): Promise<EmployeeDepartmentPositionHistory[]> {
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
     * 특정 부서 및 모든 하위 부서의 특정 시점 배치 목록을 재귀적으로 조회한다
     *
     * 주의: 특정 시점의 부서 계층 구조를 기반으로 하위 부서를 찾습니다.
     * 현재 시점의 부서 구조가 아닌, 해당 시점에 실제로 존재했던 부서 계층 구조를 사용합니다.
     *
     * @param departmentId 부서 ID
     * @param targetDate 대상 날짜
     * @returns 배치 이력 목록 (하위 부서 포함)
     */
    async findByDepartmentWithChildrenAtDate(
        departmentId: string,
        targetDate: string,
    ): Promise<EmployeeDepartmentPositionHistory[]> {
        // 1. 해당 시점의 모든 배치 이력을 조회하여 부서 계층 구조 재구성
        const allHistories = await this.repository
            .createQueryBuilder('eh')
            .select('eh.departmentId', 'departmentId')
            .addSelect('eh.parentDepartmentId', 'parentDepartmentId')
            .where('eh.effectiveStartDate <= :targetDate', { targetDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :targetDate)', { targetDate })
            .distinct(true)
            .getRawMany();

        // 2. 부서 계층 구조 맵 생성 (parentDepartmentId -> [childDepartmentId, ...])
        const parentToChildrenMap = new Map<string, Set<string>>();
        const allDepartmentIds = new Set<string>();

        for (const history of allHistories) {
            const deptId = history.departmentId;
            const parentDeptId = history.parentDepartmentId;

            allDepartmentIds.add(deptId);

            if (parentDeptId) {
                if (!parentToChildrenMap.has(parentDeptId)) {
                    parentToChildrenMap.set(parentDeptId, new Set());
                }
                parentToChildrenMap.get(parentDeptId)!.add(deptId);
            }
        }

        // 3. 특정 부서의 하위 부서 ID 목록을 재귀적으로 조회 (해당 시점의 부서 구조 기반)
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
     * 특정 연월에 유효한 부서 정보 목록을 조회한다
     *
     * 해당 월의 범위(첫 날짜 ~ 마지막 날짜) 내에 유효한 배치 정보를 조회하여 부서 정보를 반환합니다.
     *
     * @param year 연도
     * @param month 월

     * @returns 부서 정보 목록 (id, departmentName 포함)
     */
    async 특정연월의부서정보목록을조회한다(
        year: string,
        month: string,
    ): Promise<Array<{ id: string; departmentName: string }>> {
        const repository = this.repository;

        // 해당 월의 시작일과 종료일 계산
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const monthStart = startOfMonth(new Date(yearNum, monthNum - 1, 1));
        const monthEnd = endOfMonth(new Date(yearNum, monthNum - 1, 1));
        const startDate = format(monthStart, 'yyyy-MM-dd');
        const endDate = format(monthEnd, 'yyyy-MM-dd');

        const results = await repository
            .createQueryBuilder('eh')
            .leftJoin('eh.department', 'dept')
            .select('eh.departmentId', 'id')
            .addSelect('dept.departmentName', 'departmentName')
            .distinct(true)
            .where('eh.effectiveStartDate <= :endDate', { endDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :startDate)', { startDate })
            .getRawMany();

        return results
            .map((r) => ({
                id: r.id,
                departmentName: r.departmentName || '',
            }))
            .filter((dept) => dept.id !== null && dept.id !== undefined);
    }

    /**
     * 특정 연월에 유효한 배치이력 목록을 조회한다
     *
     * 해당 월의 범위(첫 날짜 ~ 마지막 날짜) 내에 유효한 배치 정보를 조회하여 배치이력 엔티티를 반환합니다.
     * 퇴사한 직원의 배치이력은 제외합니다.
     *
     * @param year 연도
     * @param month 월
     *
     * @returns 배치이력 엔티티 목록 (department 관계 포함)
     */
    async 특정연월의배치이력목록을조회한다(year: string, month: string): Promise<EmployeeDepartmentPositionHistory[]> {
        const repository = this.repository;

        // 해당 월의 시작일과 종료일 계산
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const monthStart = startOfMonth(new Date(yearNum, monthNum - 1, 1));
        const monthEnd = endOfMonth(new Date(yearNum, monthNum - 1, 1));
        const startDate = format(monthStart, 'yyyy-MM-dd');
        const endDate = format(monthEnd, 'yyyy-MM-dd');

        return await repository
            .createQueryBuilder('eh')
            .leftJoinAndSelect('eh.department', 'dept')
            .where('eh.effectiveStartDate <= :endDate', { endDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :startDate)', { startDate })
            .getMany();
    }

    /**
     * 특정 연월에 유효한 전체 배치이력 목록을 조회한다 (직원·부서 관계 포함)
     *
     * 해당 월에 유효한 모든 배치 이력을 직원·부서 정보와 함께 반환합니다.
     * 시수 통계 등에서 부서 미지정 시 전체 직원 기준 조회에 사용합니다.
     *
     * @param year 연도
     * @param month 월
     * @returns 배치이력 엔티티 목록 (employee, department 관계 포함)
     */
    async 특정연월의전체배치이력목록을조회한다(
        year: string,
        month: string,
    ): Promise<EmployeeDepartmentPositionHistory[]> {
        const repository = this.repository;

        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const monthStart = startOfMonth(new Date(yearNum, monthNum - 1, 1));
        const monthEnd = endOfMonth(new Date(yearNum, monthNum - 1, 1));
        const startDate = format(monthStart, 'yyyy-MM-dd');
        const endDate = format(monthEnd, 'yyyy-MM-dd');

        return await repository
            .createQueryBuilder('eh')
            .leftJoinAndSelect('eh.department', 'dept')
            .leftJoinAndSelect('eh.employee', 'emp')
            .where('eh.effectiveStartDate <= :endDate', { endDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :startDate)', { startDate })
            .getMany();
    }

    /**
     * 특정 연월 및 부서에 유효한 배치이력 목록을 조회한다
     *
     * 해당 월의 범위(첫 날짜 ~ 마지막 날짜) 내에 유효한 배치 정보를 조회하여 배치이력 엔티티를 반환합니다.
     * 특정 부서에 속한 직원의 배치이력만 조회합니다.
     *
     * @param year 연도
     * @param month 월
     * @param departmentId 부서 ID
     *
     * @returns 배치이력 엔티티 목록 (department 관계 포함)
     */
    async 특정연월부서의배치이력목록을조회한다(
        year: string,
        month: string,
        departmentId: string,
    ): Promise<EmployeeDepartmentPositionHistory[]> {
        const repository = this.repository;

        // 해당 월의 시작일과 종료일 계산
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const monthStart = startOfMonth(new Date(yearNum, monthNum - 1, 1));
        const monthEnd = endOfMonth(new Date(yearNum, monthNum - 1, 1));
        const startDate = format(monthStart, 'yyyy-MM-dd');
        const endDate = format(monthEnd, 'yyyy-MM-dd');

        return await repository
            .createQueryBuilder('eh')
            .leftJoinAndSelect('eh.department', 'dept')
            .leftJoinAndSelect('eh.employee', 'emp')
            .leftJoinAndSelect('eh.position', 'pos')
            .leftJoinAndSelect('eh.rank', 'rank')
            .where('eh.departmentId = :departmentId', { departmentId })
            .andWhere('eh.effectiveStartDate <= :endDate', { endDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :startDate)', { startDate })
            .getMany();
    }

    /**
     * 특정 연월 및 부서와 모든 하위 부서에 유효한 배치이력 목록을 재귀적으로 조회한다
     *
     * 해당 월의 범위(첫 날짜 ~ 마지막 날짜) 내에 유효한 배치 정보를 조회하여 배치이력 엔티티를 반환합니다.
     * 특정 부서 및 모든 하위 부서에 속한 직원의 배치이력을 재귀적으로 조회합니다.
     *
     * 주의: 특정 연월의 부서 계층 구조를 기반으로 하위 부서를 찾습니다.
     * 현재 시점의 부서 구조가 아닌, 해당 연월에 실제로 존재했던 부서 계층 구조를 사용합니다.
     *
     * @param year 연도
     * @param month 월
     * @param departmentId 부서 ID
     *
     * @returns 배치이력 엔티티 목록 (department 관계 포함, 하위 부서 포함)
     */
    async 특정연월부서와하위부서의배치이력목록을조회한다(
        year: string,
        month: string,
        departmentId: string,
    ): Promise<EmployeeDepartmentPositionHistory[]> {
        const repository = this.repository;

        // 해당 월의 시작일과 종료일 계산
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const monthStart = startOfMonth(new Date(yearNum, monthNum - 1, 1));
        const monthEnd = endOfMonth(new Date(yearNum, monthNum - 1, 1));
        const startDate = format(monthStart, 'yyyy-MM-dd');
        const endDate = format(monthEnd, 'yyyy-MM-dd');

        // 1. 해당 연월의 모든 배치 이력을 조회하여 부서 계층 구조 재구성
        const allHistories = await repository
            .createQueryBuilder('eh')
            .select('eh.departmentId', 'departmentId')
            .addSelect('eh.parentDepartmentId', 'parentDepartmentId')
            .where('eh.effectiveStartDate <= :endDate', { endDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :startDate)', { startDate })
            .distinct(true)
            .getRawMany();

        // 2. 부서 계층 구조 맵 생성 (parentDepartmentId -> [childDepartmentId, ...])
        const parentToChildrenMap = new Map<string, Set<string>>();
        const allDepartmentIds = new Set<string>();

        for (const history of allHistories) {
            const deptId = history.departmentId;
            const parentDeptId = history.parentDepartmentId;

            allDepartmentIds.add(deptId);

            if (parentDeptId) {
                if (!parentToChildrenMap.has(parentDeptId)) {
                    parentToChildrenMap.set(parentDeptId, new Set());
                }
                parentToChildrenMap.get(parentDeptId)!.add(deptId);
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

    /**
     * 특정 부서 ID의 부서 정보를 조회한다
     *
     * @param departmentId 부서 ID
     * @param manager 트랜잭션 EntityManager (선택)
     * @returns 부서 정보 (id, departmentName 포함)
     */
    async 부서정보를조회한다(departmentId: string): Promise<{ id: string; departmentName: string } | null> {
        const repository = this.repository;

        const result = await repository
            .createQueryBuilder('eh')
            .leftJoinAndSelect('eh.department', 'dept')
            .select('eh.departmentId', 'id')
            .addSelect('dept.departmentName', 'departmentName')
            .where('eh.departmentId = :departmentId', { departmentId })
            .limit(1)
            .getRawOne();

        if (!result || !result.id) {
            return null;
        }

        return {
            id: result.id,
            departmentName: result.departmentName || '',
        };
    }
}
