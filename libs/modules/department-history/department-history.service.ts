import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, QueryRunner, Repository, DataSource } from 'typeorm';
import { DepartmentHistory } from './department-history.entity';
import { DepartmentType } from '../department/department.entity';

/**
 * 부서 이력 서비스
 *
 * 부서 이력 엔티티에 대한 CRUD 기능을 제공합니다.
 * 상위 로직에서 제공하는 트랜잭션(EntityManager)을 받아서 사용할 수 있습니다.
 */
@Injectable()
export class DomainDepartmentHistoryService {
    constructor(
        @InjectRepository(DepartmentHistory)
        private readonly repository: Repository<DepartmentHistory>,
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Repository를 가져온다 (트랜잭션 지원)
     */
    private getRepository(manager?: EntityManager): Repository<DepartmentHistory> {
        return manager ? manager.getRepository(DepartmentHistory) : this.repository;
    }

    /**
     * 엔티티를 저장한다
     */
    async save(entity: DepartmentHistory, options?: { queryRunner?: QueryRunner }): Promise<DepartmentHistory> {
        const repository = options?.queryRunner
            ? options.queryRunner.manager.getRepository(DepartmentHistory)
            : this.repository;
        return await repository.save(entity);
    }

    /**
     * 부서 이력을 생성한다 (Setter 함수 활용)
     */
    async 부서이력을생성한다(
        params: {
            departmentId: string;
            departmentName: string;
            departmentCode: string;
            type: DepartmentType;
            parentDepartmentId?: string;
            order: number;
            isActive: boolean;
            isException: boolean;
            effectiveStartDate: string;
            changeReason?: string;
            changedBy?: string;
        },
        queryRunner?: QueryRunner,
    ): Promise<DepartmentHistory> {
        const newHistory = new DepartmentHistory();

        // 기본 정보
        newHistory.departmentId = params.departmentId;
        newHistory.부서명을설정한다(params.departmentName);
        newHistory.부서코드를설정한다(params.departmentCode);
        newHistory.유형을설정한다(params.type);

        if (params.parentDepartmentId !== undefined) {
            newHistory.상위부서를설정한다(params.parentDepartmentId);
        }

        newHistory.정렬순서를설정한다(params.order);
        newHistory.활성상태를설정한다(params.isActive);
        newHistory.예외처리를설정한다(params.isException);

        // 유효 기간
        newHistory.effectiveStartDate = params.effectiveStartDate;
        newHistory.현재유효상태로설정한다();

        // 변경 추적
        if (params.changeReason) {
            newHistory.변경사유를설정한다(params.changeReason);
        }
        newHistory.changedBy = params.changedBy;

        return await this.save(newHistory, { queryRunner });
    }

    /**
     * 부서 이력의 종료일을 설정한다 (Setter 함수 활용)
     */
    async 이력을종료한다(
        history: DepartmentHistory,
        effectiveEndDate: string,
        queryRunner?: QueryRunner,
    ): Promise<DepartmentHistory> {
        // Setter 함수로 종료일 설정 (isCurrent도 함께 false로 변경)
        history.유효종료일을설정한다(effectiveEndDate);

        // 저장
        return await this.save(history, { queryRunner });
    }

    /**
     * 부서 이력을 업데이트한다 (Setter 함수 활용)
     */
    async 이력을업데이트한다(
        history: DepartmentHistory,
        params: {
            departmentName?: string;
            departmentCode?: string;
            type?: DepartmentType;
            parentDepartmentId?: string;
            order?: number;
            isActive?: boolean;
            isException?: boolean;
            changeReason?: string;
            changedBy?: string;
        },
        queryRunner?: QueryRunner,
    ): Promise<DepartmentHistory> {
        if (params.departmentName) {
            history.부서명을설정한다(params.departmentName);
        }
        if (params.departmentCode) {
            history.부서코드를설정한다(params.departmentCode);
        }
        if (params.type) {
            history.유형을설정한다(params.type);
        }
        if (params.parentDepartmentId !== undefined) {
            history.상위부서를설정한다(params.parentDepartmentId);
        }
        if (params.order !== undefined) {
            history.정렬순서를설정한다(params.order);
        }
        if (params.isActive !== undefined) {
            history.활성상태를설정한다(params.isActive);
        }
        if (params.isException !== undefined) {
            history.예외처리를설정한다(params.isException);
        }
        if (params.changeReason !== undefined) {
            history.변경사유를설정한다(params.changeReason);
        }
        if (params.changedBy !== undefined) {
            history.changedBy = params.changedBy;
        }

        // TypeORM 변경 감지를 위해 relation을 제거하고 저장
        // relation이 로드되어 있으면 변경 감지가 제대로 작동하지 않을 수 있음
        delete (history as any).department;

        // 저장
        return await this.save(history, { queryRunner });
    }

    /**
     * 특정 시점에 유효한 부서 이력을 조회한다
     */
    async findByDateRange(
        departmentId: string,
        targetDate: string,
        manager?: EntityManager,
    ): Promise<DepartmentHistory | null> {
        const repository = this.getRepository(manager);
        return repository
            .createQueryBuilder('dh')
            .where('dh.departmentId = :departmentId', { departmentId })
            .andWhere('dh.effectiveStartDate <= :targetDate', { targetDate })
            .andWhere('(dh.effectiveEndDate IS NULL OR dh.effectiveEndDate > :targetDate)', { targetDate })
            .getOne();
    }

    /**
     * 현재 유효한 부서 이력을 조회한다
     */
    async findCurrentByDepartmentId(
        departmentId: string,
        manager?: EntityManager,
    ): Promise<DepartmentHistory | null> {
        const repository = this.getRepository(manager);
        return repository.findOne({
            where: { departmentId, isCurrent: true },
        });
    }

    /**
     * 부서의 모든 이력을 조회한다
     */
    async findHistoryByDepartmentId(
        departmentId: string,
        manager?: EntityManager,
    ): Promise<DepartmentHistory[]> {
        const repository = this.getRepository(manager);
        return repository.find({
            where: { departmentId },
            order: { effectiveStartDate: 'DESC' },
        });
    }

    /**
     * 현재 유효한 모든 부서 이력을 조회한다
     */
    async findAllCurrent(manager?: EntityManager): Promise<DepartmentHistory[]> {
        const repository = this.getRepository(manager);
        return repository.find({
            where: { isCurrent: true },
            order: { order: 'ASC' },
        });
    }

    /**
     * 특정 기간에 유효한 부서 구조(departmentId, parentDepartmentId) 목록을 조회한다
     * 해당 연월의 부서 계층 구성 시 사용한다.
     *
     * @param startDate 기간 시작일 (yyyy-MM-dd)
     * @param endDate 기간 종료일 (yyyy-MM-dd)
     * @param manager EntityManager (선택)
     */
    async findDepartmentStructureByDateRange(
        startDate: string,
        endDate: string,
        manager?: EntityManager,
    ): Promise<{ departmentId: string; parentDepartmentId: string | null }[]> {
        const repository = this.getRepository(manager);
        const rows = await repository
            .createQueryBuilder('dh')
            .select('dh.departmentId', 'departmentId')
            .addSelect('dh.parentDepartmentId', 'parentDepartmentId')
            .where('dh.effectiveStartDate <= :endDate', { endDate })
            .andWhere('(dh.effectiveEndDate IS NULL OR dh.effectiveEndDate >= :startDate)', { startDate })
            .distinct(true)
            .getRawMany();
        return rows.map((r) => ({
            departmentId: r.departmentId,
            parentDepartmentId: r.parentDepartmentId ?? null,
        }));
    }
}
