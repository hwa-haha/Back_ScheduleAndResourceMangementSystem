import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { EmployeeDepartmentPermission } from './employee-department-permission.entity';
import {
    CreateEmployeeDepartmentPermissionData,
    UpdateEmployeeDepartmentPermissionData,
    EmployeeDepartmentPermissionDTO,
} from './employee-department-permission.types';

/**
 * 직원-부서 권한 서비스
 *
 * 직원-부서 권한 엔티티에 대한 CRUD 기능을 제공합니다.
 * 상위 로직에서 제공하는 트랜잭션(EntityManager)을 받아서 사용할 수 있습니다.
 */
@Injectable()
export class DomainEmployeeDepartmentPermissionService {
    constructor(
        @InjectRepository(EmployeeDepartmentPermission)
        private readonly repository: Repository<EmployeeDepartmentPermission>,
    ) {}

    /**
     * Repository를 가져온다 (트랜잭션 지원)
     */
    private getRepository(manager?: EntityManager): Repository<EmployeeDepartmentPermission> {
        return manager ? manager.getRepository(EmployeeDepartmentPermission) : this.repository;
    }

    /**
     * 직원-부서 권한을 생성한다
     */
    async 생성한다(
        data: CreateEmployeeDepartmentPermissionData,
        manager?: EntityManager,
    ): Promise<EmployeeDepartmentPermissionDTO> {
        const repository = this.getRepository(manager);

        const permission = new EmployeeDepartmentPermission(
            data.employeeId,
            data.departmentId,
            data.hasAccessPermission,
            data.hasReviewPermission,
        );

        const saved = await repository.save(permission);
        return saved.DTO변환한다();
    }

    /**
     * ID로 직원-부서 권한을 조회한다
     */
    async ID로조회한다(id: string): Promise<EmployeeDepartmentPermissionDTO> {
        const permission = await this.repository.findOne({
            where: { id },
            relations: ['employee', 'department'],
        });
        if (!permission) {
            throw new NotFoundException(`직원-부서 권한을 찾을 수 없습니다. (id: ${id})`);
        }
        return permission.DTO변환한다();
    }

    /**
     * 직원 ID와 부서 ID로 권한을 조회한다
     */
    async 직원과부서로조회한다(
        employeeId: string,
        departmentId: string,
        manager?: EntityManager,
    ): Promise<EmployeeDepartmentPermissionDTO | null> {
        const repository = this.getRepository(manager);
        const permission = await repository.findOne({
            where: { employee_id: employeeId, department_id: departmentId, deleted_at: IsNull() },
            relations: ['employee', 'department'],
        });
        return permission ? permission.DTO변환한다() : null;
    }

    /**
     * 직원 ID로 권한 목록을 조회한다
     */
    async 직원으로목록조회한다(
        employeeId: string,
        manager?: EntityManager,
    ): Promise<EmployeeDepartmentPermissionDTO[]> {
        const repository = this.getRepository(manager);
        const permissions = await repository.find({
            where: { employee_id: employeeId, deleted_at: IsNull() },
            relations: ['employee', 'department'],
            order: {
                created_at: 'DESC',
            },
        });
        return permissions.map((permission) => permission.DTO변환한다());
    }

    /**
     * 부서 ID로 권한 목록을 조회한다
     */
    async 부서로목록조회한다(departmentId: string): Promise<EmployeeDepartmentPermissionDTO[]> {
        const permissions = await this.repository.find({
            where: { department_id: departmentId, deleted_at: IsNull() },
            relations: ['employee', 'department'],
            order: {
                created_at: 'DESC',
            },
        });
        return permissions.map((permission) => permission.DTO변환한다());
    }

    /**
     * 접근 권한이 있는 직원 목록을 조회한다
     */
    async 접근권한이있는직원목록조회한다(departmentId: string): Promise<EmployeeDepartmentPermissionDTO[]> {
        const permissions = await this.repository.find({
            where: { department_id: departmentId, has_access_permission: true, deleted_at: IsNull() },
            relations: ['employee', 'department'],
            order: {
                created_at: 'DESC',
            },
        });
        return permissions.map((permission) => permission.DTO변환한다());
    }

    /**
     * 검토 권한이 있는 직원 목록을 조회한다
     */
    async 검토권한이있는직원목록조회한다(departmentId: string): Promise<EmployeeDepartmentPermissionDTO[]> {
        const permissions = await this.repository.find({
            where: { department_id: departmentId, has_review_permission: true, deleted_at: IsNull() },
            relations: ['employee', 'department'],
            order: {
                created_at: 'DESC',
            },
        });
        return permissions.map((permission) => permission.DTO변환한다());
    }

    /**
     * 검토 권한이 있는 전체 목록을 조회한다 (부서별 그룹핑용)
     *
     * has_review_permission = true 인 모든 권한을 직원·부서 정보와 함께 반환합니다.
     */
    async 검토권한목록전체조회한다(
        manager?: EntityManager,
    ): Promise<
        Array<{
            departmentId: string;
            departmentName: string;
            employeeId: string;
            employeeName: string;
            employeeNumber: string;
        }>
    > {
        const repository = this.getRepository(manager);
        const permissions = await repository.find({
            where: { has_review_permission: true, deleted_at: IsNull() },
            relations: ['employee', 'department'],
            order: { department_id: 'ASC', created_at: 'DESC' },
        });
        return permissions.map((p) => {
            const emp = p.employee as { name?: string; employeeNumber?: string } | undefined;
            const dept = p.department as { departmentName?: string } | undefined;
            return {
                departmentId: p.department_id,
                departmentName: dept?.departmentName ?? '',
                employeeId: p.employee_id,
                employeeName: emp?.name ?? '',
                employeeNumber: emp?.employeeNumber ?? '',
            };
        });
    }

    /**
     * 직원-부서 권한을 수정한다
     */
    async 수정한다(
        id: string,
        data: UpdateEmployeeDepartmentPermissionData,
        userId: string,
        manager?: EntityManager,
    ): Promise<EmployeeDepartmentPermissionDTO> {
        const repository = this.getRepository(manager);
        const permission = await repository.findOne({ where: { id } });
        if (!permission) {
            throw new NotFoundException(`직원-부서 권한을 찾을 수 없습니다. (id: ${id})`);
        }

        permission.업데이트한다(data.hasAccessPermission, data.hasReviewPermission);

        // 수정자 정보 설정
        permission.수정자설정한다(userId);
        permission.메타데이터업데이트한다(userId);

        const saved = await repository.save(permission);
        return saved.DTO변환한다();
    }

    /**
     * 직원-부서 권한을 삭제한다 (Soft Delete)
     */
    async 삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        const permission = await repository.findOne({ where: { id } });
        if (!permission) {
            throw new NotFoundException(`직원-부서 권한을 찾을 수 없습니다. (id: ${id})`);
        }
        // Soft Delete: deleted_at 필드를 설정
        permission.deleted_at = new Date();
        // 삭제자 정보 설정
        permission.수정자설정한다(userId);
        permission.메타데이터업데이트한다(userId);
        await repository.save(permission);
    }

    /**
     * 직원-부서 권한을 완전히 삭제한다 (Hard Delete)
     */
    async 완전삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        // Soft Delete된 데이터도 조회할 수 있도록 withDeleted 옵션 사용
        const permission = await repository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!permission) {
            throw new NotFoundException(`직원-부서 권한을 찾을 수 없습니다. (id: ${id})`);
        }
        // Hard Delete: 데이터베이스에서 완전히 삭제
        await repository.remove(permission);
    }

    /**
     * 직원 ID로 모든 권한을 일괄 삭제한다 (Hard Delete)
     */
    async 직원으로일괄삭제한다(employeeId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        // Hard Delete: 직원 ID로 일괄 삭제
        await repository.delete({ employee_id: employeeId });
    }
}
