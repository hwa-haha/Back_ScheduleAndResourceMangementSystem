import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import {
    EmployeeDepartmentPermissionHistoryDTO,
    EmployeeDepartmentPermissionHistoryAction,
} from './employee-department-permission-history.types';

/**
 * 직원-부서 권한 변경 이력 엔티티
 *
 * 직원-부서 권한의 생성/수정/삭제 이력을 기록하는 테이블
 */
@Entity('employee_department_permission_history')
@Index(['employee_id', 'department_id', 'changed_at'])
@Index(['action'])
export class EmployeeDepartmentPermissionHistory extends BaseEntity<EmployeeDepartmentPermissionHistoryDTO> {
    /**
     * 직원 ID
     */
    @Column({ name: 'employee_id', type: 'uuid', comment: '직원 ID' })
    employee_id: string;

    /**
     * 부서 ID
     */
    @Column({ name: 'department_id', type: 'uuid', comment: '부서 ID' })
    department_id: string;

    /**
     * 변경 액션 (CREATE | UPDATE | DELETE)
     */
    @Column({
        name: 'action',
        type: 'varchar',
        length: 20,
        comment: '변경 액션',
    })
    action: EmployeeDepartmentPermissionHistoryAction;

    /**
     * 변경 후 접근 권한 (CREATE/UPDATE 시 변경 후 값, DELETE 시 삭제 전 값)
     */
    @Column({
        name: 'has_access_permission',
        type: 'boolean',
        comment: '접근 권한 스냅샷',
    })
    has_access_permission: boolean;

    /**
     * 변경 후 검토 권한 (CREATE/UPDATE 시 변경 후 값, DELETE 시 삭제 전 값)
     */
    @Column({
        name: 'has_review_permission',
        type: 'boolean',
        comment: '검토 권한 스냅샷',
    })
    has_review_permission: boolean;

    /**
     * 변경 전 접근 권한 (UPDATE 시에만 의미 있음)
     */
    @Column({
        name: 'previous_has_access_permission',
        type: 'boolean',
        nullable: true,
        comment: '변경 전 접근 권한',
    })
    previous_has_access_permission: boolean | null;

    /**
     * 변경 전 검토 권한 (UPDATE 시에만 의미 있음)
     */
    @Column({
        name: 'previous_has_review_permission',
        type: 'boolean',
        nullable: true,
        comment: '변경 전 검토 권한',
    })
    previous_has_review_permission: boolean | null;

    /**
     * 변경 시각
     */
    @Column({
        name: 'changed_at',
        type: 'timestamp',
        comment: '변경 시각',
    })
    changed_at: Date;

    /**
     * 변경자 (사용자 UUID)
     */
    @Column({
        name: 'changed_by',
        type: 'uuid',
        nullable: true,
        comment: '변경자',
    })
    changed_by: string | null;

    /**
     * 직원-부서 권한 변경 이력을 생성한다
     */
    constructor(
        employee_id: string,
        department_id: string,
        action: EmployeeDepartmentPermissionHistoryAction,
        has_access_permission: boolean,
        has_review_permission: boolean,
        changed_at: Date,
        changed_by: string | null,
        previous_has_access_permission?: boolean | null,
        previous_has_review_permission?: boolean | null,
    ) {
        super();
        this.employee_id = employee_id;
        this.department_id = department_id;
        this.action = action;
        this.has_access_permission = has_access_permission;
        this.has_review_permission = has_review_permission;
        this.previous_has_access_permission = previous_has_access_permission ?? null;
        this.previous_has_review_permission = previous_has_review_permission ?? null;
        this.changed_at = changed_at;
        this.changed_by = changed_by;
    }

    /**
     * DTO로 변환한다
     */
    DTO변환한다(): EmployeeDepartmentPermissionHistoryDTO {
        return {
            id: this.id,
            employeeId: this.employee_id,
            departmentId: this.department_id,
            action: this.action,
            hasAccessPermission: this.has_access_permission,
            hasReviewPermission: this.has_review_permission,
            previousHasAccessPermission: this.previous_has_access_permission,
            previousHasReviewPermission: this.previous_has_review_permission,
            changedAt: this.changed_at,
            changedBy: this.changed_by,
            createdAt: this.created_at,
            updatedAt: this.updated_at,
            deletedAt: this.deleted_at,
            createdBy: this.created_by,
            updatedBy: this.updated_by,
            version: this.version,
        };
    }
}
