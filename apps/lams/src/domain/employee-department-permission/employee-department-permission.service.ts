import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, Repository } from 'typeorm';
import { EmployeeDepartmentPermission } from './employee-department-permission.entity';
import { EmployeeDepartmentPermissionHistory } from './employee-department-permission-history.entity';
import {
    CreateEmployeeDepartmentPermissionData,
    UpdateEmployeeDepartmentPermissionData,
    EmployeeDepartmentPermissionDTO,
} from './employee-department-permission.types';

/**
 * 직원-부서 권한 서비스
 *
 * 직원-부서 권한 엔티티에 대한 CRUD 기능을 제공합니다.
 * CUD 및 일괄 삭제 시 변경 이력을 자동으로 기록합니다.
 * 상위 로직에서 제공하는 트랜잭션(EntityManager)을 받아서 사용할 수 있습니다.
 */
@Injectable()
export class DomainEmployeeDepartmentPermissionService {
    constructor(
        @InjectRepository(EmployeeDepartmentPermission)
        private readonly repository: Repository<EmployeeDepartmentPermission>,
        @InjectRepository(EmployeeDepartmentPermissionHistory)
        private readonly historyRepository: Repository<EmployeeDepartmentPermissionHistory>,
    ) {}

    /**
     * Repository를 가져온다 (트랜잭션 지원)
     */
    private getRepository(manager?: EntityManager): Repository<EmployeeDepartmentPermission> {
        return manager ? manager.getRepository(EmployeeDepartmentPermission) : this.repository;
    }

    /**
     * 이력 Repository를 가져온다 (트랜잭션 지원)
     */
    private getHistoryRepository(manager?: EntityManager): Repository<EmployeeDepartmentPermissionHistory> {
        return manager ? manager.getRepository(EmployeeDepartmentPermissionHistory) : this.historyRepository;
    }

    /**
     * 권한 변경 이력을 저장한다
     */
    private async 이력을저장한다(
        employeeId: string,
        departmentId: string,
        action: 'CREATE' | 'UPDATE' | 'DELETE',
        hasAccessPermission: boolean,
        hasReviewPermission: boolean,
        changedBy: string | null,
        manager?: EntityManager,
        previousHasAccessPermission?: boolean | null,
        previousHasReviewPermission?: boolean | null,
    ): Promise<void> {
        const historyRepo = this.getHistoryRepository(manager);
        const now = new Date();
        const history = new EmployeeDepartmentPermissionHistory(
            employeeId,
            departmentId,
            action,
            hasAccessPermission,
            hasReviewPermission,
            now,
            changedBy ?? null,
            previousHasAccessPermission ?? null,
            previousHasReviewPermission ?? null,
        );
        await historyRepo.save(history);
    }

    /**
     * 직원-부서 권한을 생성한다
     * @param performedBy 이력 기록용 변경자 (선택)
     */
    async 생성한다(
        data: CreateEmployeeDepartmentPermissionData,
        manager?: EntityManager,
        performedBy?: string,
    ): Promise<EmployeeDepartmentPermissionDTO> {
        const repository = this.getRepository(manager);

        const permission = new EmployeeDepartmentPermission(
            data.employeeId,
            data.departmentId,
            data.hasAccessPermission,
            data.hasReviewPermission,
        );

        const saved = await repository.save(permission);

        await this.이력을저장한다(
            saved.employee_id,
            saved.department_id,
            'CREATE',
            saved.has_access_permission,
            saved.has_review_permission,
            performedBy ?? saved.created_by ?? null,
            manager,
        );

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
     * 부서 ID 목록에 해당하는 권한 전체를 직원 정보와 함께 조회한다 (미삭제만)
     */
    async 부서ID목록으로권한목록조회한다(
        departmentIds: string[],
        manager?: EntityManager,
    ): Promise<EmployeeDepartmentPermission[]> {
        if (departmentIds.length === 0) {
            return [];
        }
        const repository = this.getRepository(manager);
        return await repository.find({
            where: { department_id: In(departmentIds), deleted_at: IsNull() },
            relations: ['employee'],
            order: { created_at: 'DESC' },
        });
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
    async 검토권한목록전체조회한다(manager?: EntityManager): Promise<
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

        const prevAccess = permission.has_access_permission;
        const prevReview = permission.has_review_permission;

        permission.업데이트한다(data.hasAccessPermission, data.hasReviewPermission);

        // 수정자 정보 설정
        permission.수정자설정한다(userId);
        permission.메타데이터업데이트한다(userId);

        const saved = await repository.save(permission);

        await this.이력을저장한다(
            saved.employee_id,
            saved.department_id,
            'UPDATE',
            saved.has_access_permission,
            saved.has_review_permission,
            userId,
            manager,
            prevAccess,
            prevReview,
        );

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

        await this.이력을저장한다(
            permission.employee_id,
            permission.department_id,
            'DELETE',
            permission.has_access_permission,
            permission.has_review_permission,
            userId,
            manager,
        );

        // Soft Delete: deleted_at 필드를 설정
        permission.deleted_at = new Date();
        permission.수정자설정한다(userId);
        permission.메타데이터업데이트한다(userId);
        await repository.save(permission);
    }

    /**
     * 직원-부서 권한을 완전히 삭제한다 (Hard Delete)
     */
    async 완전삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        const permission = await repository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!permission) {
            throw new NotFoundException(`직원-부서 권한을 찾을 수 없습니다. (id: ${id})`);
        }

        await this.이력을저장한다(
            permission.employee_id,
            permission.department_id,
            'DELETE',
            permission.has_access_permission,
            permission.has_review_permission,
            userId ?? permission.created_by ?? null,
            manager,
        );
    }

    /**
     * 직원 ID로 모든 권한을 일괄 삭제한다 (Hard Delete)
     * @param performedBy 이력 기록용 변경자 (선택)
     */
    async 직원으로일괄삭제한다(employeeId: string, manager?: EntityManager, performedBy?: string): Promise<void> {
        const repository = this.getRepository(manager);
        const list = await repository.find({
            where: { employee_id: employeeId },
            withDeleted: true,
        });
        const changedBy = performedBy ?? null;
        for (const p of list) {
            await this.이력을저장한다(
                p.employee_id,
                p.department_id,
                'DELETE',
                p.has_access_permission,
                p.has_review_permission,
                changedBy,
                manager,
            );
        }
        await repository.delete({ employee_id: employeeId });
    }

    /**
     * 부서 ID로 모든 권한을 일괄 삭제한다 (Hard Delete)
     * @param performedBy 이력 기록용 변경자 (선택)
     */
    async 부서로일괄삭제한다(departmentId: string, manager?: EntityManager, performedBy?: string): Promise<void> {
        const repository = this.getRepository(manager);
        const list = await repository.find({
            where: { department_id: departmentId },
            withDeleted: true,
        });
        const changedBy = performedBy ?? null;
        for (const p of list) {
            await this.이력을저장한다(
                p.employee_id,
                p.department_id,
                'DELETE',
                p.has_access_permission,
                p.has_review_permission,
                changedBy,
                manager,
            );
        }
        await repository.delete({ department_id: departmentId });
    }
}
