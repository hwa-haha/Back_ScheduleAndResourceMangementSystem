import { Entity, Column, ManyToOne, JoinColumn, OneToMany, AfterLoad, BeforeInsert } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { BaseEntity } from '@libs/database/base/base.entity';
import { DataSnapshotChild } from '../data-snapshot-child/data-snapshot-child.entity';
import { Department } from '@libs/modules/department/department.entity';
import { DataSnapshotInfoDTO, SnapshotType, ApprovalStatus } from './data-snapshot-info.types';

/**
 * 데이터 스냅샷 정보 엔티티
 */
@Entity('data_snapshot_info')
export class DataSnapshotInfo extends BaseEntity<DataSnapshotInfoDTO> {
    // BaseEntity에서 id, created_at, updated_at, deleted_at, created_by, updated_by, version 제공

    @Column({
        name: 'snapshot_name',
        comment: '스냅샷명',
    })
    snapshot_name: string;

    @Column({
        name: 'description',
        default: '',
        comment: '설명',
    })
    description: string;

    @Column({
        name: 'snapshot_type',
        type: 'text',
        comment: '스냅샷 타입',
    })
    snapshot_type: SnapshotType;

    @Column({
        name: 'yyyy',
        comment: '연도',
    })
    yyyy: string;

    @Column({
        name: 'mm',
        comment: '월',
    })
    mm: string;

    @Column({ name: 'department_id', type: 'uuid', nullable: true })
    department_id: string | null;

    @Column({
        name: 'snapshot_version',
        type: 'varchar',
        length: 1,
        nullable: true,
        comment: '스냅샷 버전 (A-Z)',
    })
    snapshot_version: string | null;

    @Column({
        name: 'approval_document_id',
        type: 'uuid',
        nullable: true,
        comment: '결재 문서 ID',
    })
    approval_document_id: string | null;

    @Column({
        name: 'submitted_at',
        type: 'timestamp',
        nullable: true,
        comment: '제출 시간',
    })
    submitted_at: Date | null;

    @Column({
        name: 'approver_name',
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '결재자 이름',
    })
    approver_name: string | null;

    @Column({
        name: 'approval_status',
        type: 'varchar',
        length: 10,
        default: ApprovalStatus.NOT_SUBMITTED,
        nullable: true,
        comment: '결재 상태 (미제출, 제출됨)',
    })
    approval_status: ApprovalStatus | null;

    @Column({
        name: 'is_current',
        type: 'boolean',
        default: false,
        comment: '현재 스냅샷 여부',
    })
    is_current: boolean;

    @OneToMany(() => DataSnapshotChild, (child) => child.parentSnapshot, {
        cascade: ['insert', 'update', 'remove'],
    })
    dataSnapshotChildInfoList: DataSnapshotChild[];

    @ManyToOne(() => Department)
    @JoinColumn({ name: 'department_id' })
    department: Department;

    /**
     * 데이터 스냅샷 정보 불변성 검증
     */
    private validateInvariants(): void {
        this.validateRequiredData();
        this.validateDataFormat();
        this.validateLogicalConsistency();
    }

    /**
     * 필수 데이터 검증
     */
    private validateRequiredData(): void {
        // TypeORM 메타데이터 검증 단계에서는 검증을 건너뜀
        if (!this.snapshot_name || !this.snapshot_type || !this.yyyy || !this.mm || !this.department_id) {
            return;
        }

        if (this.snapshot_name.trim().length === 0) {
            throw new BadRequestException('스냅샷명은 필수입니다.');
        }

        if (this.yyyy.trim().length === 0) {
            throw new BadRequestException('연도는 필수입니다.');
        }

        if (this.mm.trim().length === 0) {
            throw new BadRequestException('월은 필수입니다.');
        }

        this.validateUuidFormat(this.department_id, 'department_id');
    }

    /**
     * 데이터 형식 검증
     */
    private validateDataFormat(): void {
        // 스냅샷 버전 검증 (A-Z만 허용)
        if (this.snapshot_version !== null && this.snapshot_version !== undefined) {
            if (!/^[A-Z]$/.test(this.snapshot_version)) {
                throw new BadRequestException('스냅샷 버전은 A-Z 사이의 단일 문자만 허용됩니다.');
            }
        }

        // 결재 문서 ID UUID 형식 검증
        if (this.approval_document_id !== null && this.approval_document_id !== undefined) {
            this.validateUuidFormat(this.approval_document_id, 'approval_document_id');
        }

        // 결재자 이름 검증
        if (this.approver_name !== null && this.approver_name !== undefined) {
            if (this.approver_name.trim().length === 0) {
                throw new BadRequestException('결재자 이름은 빈 문자열일 수 없습니다.');
            }
        }
    }

    /**
     * 논리적 일관성 검증
     */
    private validateLogicalConsistency(): void {
        // 추가적인 논리적 검증이 필요한 경우 여기에 구현
    }

    /**
     * 데이터 스냅샷 정보를 생성한다
     */
    constructor(
        snapshot_name: string,
        snapshot_type: SnapshotType,
        yyyy: string,
        mm: string,
        department_id: string,
        description: string = '',
        snapshot_version: string | null = null,
        approval_document_id: string | null = null,
        submitted_at: Date | null = null,
        approver_name: string | null = null,
        approval_status: ApprovalStatus | null = null,
        is_current: boolean = false,
    ) {
        super();
        this.snapshot_name = snapshot_name;
        this.snapshot_type = snapshot_type;
        this.yyyy = yyyy;
        this.mm = mm;
        this.department_id = department_id;
        this.description = description;
        this.snapshot_version = snapshot_version;
        this.approval_document_id = approval_document_id;
        this.submitted_at = submitted_at;
        this.approver_name = approver_name;
        this.approval_status = approval_status;
        this.is_current = is_current;
        this.validateInvariants();
    }

    /**
     * 데이터 스냅샷 정보를 업데이트한다
     */
    업데이트한다(
        snapshot_name?: string,
        description?: string,
        snapshot_version?: string | null,
        approval_document_id?: string | null,
        submitted_at?: Date | null,
        approver_name?: string | null,
        approval_status?: ApprovalStatus | null,
        is_current?: boolean,
    ): void {
        if (snapshot_name !== undefined) {
            this.snapshot_name = snapshot_name;
        }
        if (description !== undefined) {
            this.description = description;
        }
        if (snapshot_version !== undefined) {
            this.snapshot_version = snapshot_version;
        }
        if (approval_document_id !== undefined) {
            this.approval_document_id = approval_document_id;
        }
        if (submitted_at !== undefined) {
            this.submitted_at = submitted_at;
        }
        if (approver_name !== undefined) {
            this.approver_name = approver_name;
        }
        if (approval_status !== undefined) {
            this.approval_status = approval_status;
        }
        if (is_current !== undefined) {
            this.is_current = is_current;
        }
        this.validateInvariants();
    }

    /**
     * DTO로 변환한다
     */
    DTO변환한다(): DataSnapshotInfoDTO {
        return {
            id: this.id,
            snapshotName: this.snapshot_name,
            description: this.description,
            snapshotType: this.snapshot_type,
            yyyy: this.yyyy,
            mm: this.mm,
            departmentId: this.department_id,
            snapshotVersion: this.snapshot_version || undefined,
            approvalDocumentId: this.approval_document_id || undefined,
            submittedAt: this.submitted_at || undefined,
            approverName: this.approver_name || undefined,
            approvalStatus: this.approval_status || undefined,
            isCurrent: this.is_current,
            createdAt: this.created_at,
            updatedAt: this.updated_at,
            deletedAt: this.deleted_at,
            createdBy: this.created_by,
            updatedBy: this.updated_by,
            version: this.version,
            children: this.dataSnapshotChildInfoList
                ? this.dataSnapshotChildInfoList.map((child) => child.DTO변환한다())
                : undefined,
        };
    }

    /**
     * AfterLoad 훅: 데이터 로드 후 처리
     */
    @AfterLoad()
    로드후처리한다(): void {
        // createdAt을 한국 시간으로 포맷팅
        if (this.created_at) {
            (this as any).createdAt = new Date(this.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        }

        // 자식 스냅샷 목록을 직원명으로 정렬
        if (this.dataSnapshotChildInfoList) {
            this.dataSnapshotChildInfoList.sort((a, b) => a.employee_name.localeCompare(b.employee_name, 'ko'));
        }
    }
}
