import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, DataSource } from 'typeorm';
import { Department } from './department.entity';

/**
 * 부서 서비스
 *
 * 부서 엔티티에 대한 CRUD 기능을 제공합니다.
 * 상위 로직에서 제공하는 트랜잭션(EntityManager)을 받아서 사용할 수 있습니다.
 */
@Injectable()
export class DomainDepartmentService {
    constructor(
        @InjectRepository(Department)
        private readonly repository: Repository<Department>,
        private readonly dataSource: DataSource,
    ) {}

    /**
     * Repository를 가져온다 (트랜잭션 지원)
     */
    private getRepository(manager?: EntityManager): Repository<Department> {
        return manager ? manager.getRepository(Department) : this.repository;
    }

    /**
     * 엔티티를 저장한다
     */
    async save(entity: Department, options?: { queryRunner?: any }): Promise<Department> {
        const repository = options?.queryRunner
            ? options.queryRunner.manager.getRepository(Department)
            : this.repository;
        return await repository.save(entity);
    }

    /**
     * 모든 엔티티를 조회한다
     */
    async findAll(manager?: EntityManager): Promise<Department[]> {
        const repository = this.getRepository(manager);
        return await repository.find();
    }

    /**
     * 퇴사자 부서를 제외한 전체 부서 목록을 order 기준 오름차순으로 조회한다
     */
    async 퇴사자를제외한전체부서목록을조회한다(manager?: EntityManager): Promise<Department[]> {
        const repository = this.getRepository(manager);
        return await repository
            .createQueryBuilder('dept')
            .where('dept.departmentName != :excludedDepartmentName', { excludedDepartmentName: '퇴사자' })
            .andWhere('dept.isActive = :isActive', { isActive: true })
            .orderBy('dept.order', 'ASC')
            .getMany();
    }

    /**
     * ID로 엔티티를 조회한다
     */
    async findOne(id: string, manager?: EntityManager): Promise<Department | null> {
        const repository = this.getRepository(manager);
        return await repository.findOne({ where: { id } });
    }

    /**
     * 특정 부서의 모든 하위 부서 ID를 재귀적으로 조회한다
     *
     * @param parentDepartmentId 상위 부서 ID
     * @param manager 트랜잭션 EntityManager (선택)
     * @returns 하위 부서 ID 목록 (자기 자신 포함)
     */
    async 하위부서ID목록을재귀적으로조회한다(parentDepartmentId: string, manager?: EntityManager): Promise<string[]> {
        const repository = this.getRepository(manager);
        const departmentIds: string[] = [parentDepartmentId];

        // 재귀적으로 하위 부서 조회
        const findChildDepartments = async (parentId: string): Promise<void> => {
            const childDepartments = await repository.find({
                where: { parentDepartmentId: parentId },
            });

            for (const child of childDepartments) {
                if (!departmentIds.includes(child.id)) {
                    departmentIds.push(child.id);
                    // 재귀적으로 하위 부서의 하위 부서도 조회
                    await findChildDepartments(child.id);
                }
            }
        };

        await findChildDepartments(parentDepartmentId);

        return departmentIds;
    }
}
