import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, EntityManager, IsNull, Repository } from 'typeorm';
import { DataSnapshotInfo } from './data-snapshot-info.entity';
import {
    CreateDataSnapshotInfoData,
    UpdateDataSnapshotInfoData,
    SnapshotType,
    DataSnapshotInfoDTO,
} from './data-snapshot-info.types';

/**
 * 데이터 스냅샷 정보 서비스
 *
 * 데이터 스냅샷 정보 엔티티에 대한 CRUD 기능을 제공합니다.
 * 상위 로직에서 제공하는 트랜잭션(EntityManager)을 받아서 사용할 수 있습니다.
 */
@Injectable()
export class DomainDataSnapshotInfoService {
    constructor(
        @InjectRepository(DataSnapshotInfo)
        private readonly repository: Repository<DataSnapshotInfo>,
    ) {}

    /**
     * Repository를 가져온다 (트랜잭션 지원)
     */
    private getRepository(manager?: EntityManager): Repository<DataSnapshotInfo> {
        return manager ? manager.getRepository(DataSnapshotInfo) : this.repository;
    }

    /**
     * 데이터 스냅샷 정보를 생성한다
     */
    async 생성한다(data: CreateDataSnapshotInfoData, manager?: EntityManager): Promise<DataSnapshotInfoDTO> {
        const repository = this.getRepository(manager);

        const snapshot = new DataSnapshotInfo(
            data.snapshotName,
            data.snapshotType,
            data.yyyy,
            data.mm,
            data.departmentId,
            data.description || '',
            data.snapshotVersion || null,
            data.approvalDocumentId || null,
            data.submittedAt || null,
            data.approverName || null,
            data.approvalStatus || null,
        );

        const saved = await repository.save(snapshot);
        return saved.DTO변환한다();
    }

    /**
     * ID로 데이터 스냅샷 정보를 조회한다
     */
    async ID로조회한다(id: string): Promise<DataSnapshotInfoDTO> {
        const snapshot = await this.repository.findOne({
            where: { id },
            relations: ['dataSnapshotChildInfoList', 'department'],
        });
        if (!snapshot) {
            throw new NotFoundException(`데이터 스냅샷 정보를 찾을 수 없습니다. (id: ${id})`);
        }
        return snapshot.DTO변환한다();
    }

    /**
     * 모든 스냅샷 목록을 조회한다 (children 포함)
     */
    async 자식포함목록조회한다(): Promise<DataSnapshotInfoDTO[]> {
        const snapshots = await this.repository.find({
            where: { deleted_at: IsNull() },
            relations: ['dataSnapshotChildInfoList'],
            order: {
                created_at: 'DESC',
            },
        });
        return snapshots.map((snapshot) => snapshot.DTO변환한다());
    }

    /**
     * 특정 스냅샷을 조회한다 (children 포함)
     */
    async 자식포함조회한다(id: string): Promise<DataSnapshotInfoDTO | null> {
        const snapshot = await this.repository.findOne({
            where: { id, deleted_at: IsNull() },
            relations: ['dataSnapshotChildInfoList'],
        });
        return snapshot ? snapshot.DTO변환한다() : null;
    }

    /**
     * 특정 연월의 스냅샷 목록을 조회한다 (children 포함)
     */
    async 연월로목록조회한다(yyyy: string, mm: string): Promise<DataSnapshotInfoDTO[]> {
        const snapshots = await this.repository.find({
            where: { yyyy, mm, deleted_at: IsNull() },
            relations: ['dataSnapshotChildInfoList'],
            order: {
                created_at: 'DESC',
            },
        });
        return snapshots.map((snapshot) => snapshot.DTO변환한다());
    }

    /**
     * 특정 타입의 스냅샷 목록을 조회한다 (children 포함)
     */
    async 타입으로목록조회한다(snapshotType: SnapshotType): Promise<DataSnapshotInfoDTO[]> {
        const snapshots = await this.repository.find({
            where: { snapshot_type: snapshotType, deleted_at: IsNull() },
            relations: ['dataSnapshotChildInfoList'],
            order: {
                created_at: 'DESC',
            },
        });
        return snapshots.map((snapshot) => snapshot.DTO변환한다());
    }

    /**
     * 제출일(submitted_at) 기준 연·월로 스냅샷 목록을 조회한다
     * 해당 연월에 제출된 스냅샷만 반환한다.
     */
    async 제출연월로목록조회한다(year: string, month: string): Promise<DataSnapshotInfoDTO[]> {
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month.padStart(2, '0'), 10);
        const start = new Date(yearNum, monthNum - 1, 1);
        const end = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

        const snapshots = await this.repository.find({
            where: {
                submitted_at: Between(start, end),
                deleted_at: IsNull(),
            },
            relations: ['dataSnapshotChildInfoList'],
            order: {
                submitted_at: 'DESC',
            },
        });
        return snapshots.map((snapshot) => snapshot.DTO변환한다());
    }

    /**
     * 특정 연월 및 타입의 스냅샷 목록을 조회한다
     */
    async 연월과타입으로목록조회한다(
        yyyy: string,
        mm: string,
        snapshotType: SnapshotType,
    ): Promise<DataSnapshotInfoDTO[]> {
        const snapshots = await this.repository.find({
            where: { yyyy, mm, snapshot_type: snapshotType, deleted_at: IsNull() },
            relations: ['dataSnapshotChildInfoList'],
            order: {
                created_at: 'DESC',
            },
        });
        return snapshots.map((snapshot) => snapshot.DTO변환한다());
    }

    /**
     * 특정 연월/타입 스냅샷 목록을 조회한다 (자식 직원 필터)
     *
     * 자식 데이터는 employee_id 목록에 포함된 항목만 반환한다.
     */
    async 연월과타입으로목록조회_자식직원필터한다(
        yyyy: string,
        mm: string,
        snapshotType: SnapshotType,
        employeeIds: string[],
    ): Promise<DataSnapshotInfoDTO[]> {
        if (!employeeIds || employeeIds.length === 0) {
            const snapshots = await this.repository.find({
                where: { yyyy, mm, snapshot_type: snapshotType, deleted_at: IsNull() },
                order: {
                    created_at: 'DESC',
                },
            });
            return snapshots.map((snapshot) => ({
                ...snapshot.DTO변환한다(),
                children: [],
            }));
        }

        const snapshots = await this.repository
            .createQueryBuilder('snapshot')
            .leftJoinAndSelect(
                'snapshot.dataSnapshotChildInfoList',
                'child',
                'child.employee_id IN (:...employeeIds)',
                { employeeIds },
            )
            .where('snapshot.yyyy = :yyyy', { yyyy })
            .andWhere('snapshot.mm = :mm', { mm })
            .andWhere('snapshot.snapshot_type = :snapshotType', { snapshotType })
            .andWhere('snapshot.deleted_at IS NULL')
            .orderBy('snapshot.created_at', 'DESC')
            .getMany();
        return snapshots.map((snapshot) => snapshot.DTO변환한다());
    }

    /**
     * 연도, 월, 부서별 스냅샷 목록을 조회한다 (버전 관리용)
     */
    async 연월부서별목록조회한다(
        yyyy: string,
        mm: string,
        departmentId: string,
        snapshotType: SnapshotType,
        manager?: EntityManager,
    ): Promise<DataSnapshotInfoDTO[]> {
        const repository = this.getRepository(manager);
        const snapshots = await repository.find({
            where: { yyyy, mm, department_id: departmentId, snapshot_type: snapshotType, deleted_at: IsNull() },
            order: {
                snapshot_version: 'ASC',
            },
        });
        return snapshots.map((snapshot) => snapshot.DTO변환한다());
    }

    /**
     * 데이터 스냅샷 정보를 수정한다
     */
    async 수정한다(
        id: string,
        data: UpdateDataSnapshotInfoData,
        userId: string,
        manager?: EntityManager,
    ): Promise<DataSnapshotInfoDTO> {
        const repository = this.getRepository(manager);
        const snapshot = await repository.findOne({ where: { id } });
        if (!snapshot) {
            throw new NotFoundException(`데이터 스냅샷 정보를 찾을 수 없습니다. (id: ${id})`);
        }

        snapshot.업데이트한다(
            data.snapshotName,
            data.description,
            data.snapshotVersion !== undefined ? data.snapshotVersion : undefined,
            data.approvalDocumentId !== undefined ? data.approvalDocumentId : undefined,
            data.submittedAt !== undefined ? data.submittedAt : undefined,
            data.approverName !== undefined ? data.approverName : undefined,
            data.approvalStatus !== undefined ? data.approvalStatus : undefined,
            data.isCurrent !== undefined ? data.isCurrent : undefined,
        );

        // 수정자 정보 설정
        snapshot.수정자설정한다(userId);
        snapshot.메타데이터업데이트한다(userId);

        const saved = await repository.save(snapshot);
        return saved.DTO변환한다();
    }

    /**
     * 데이터 스냅샷 정보를 삭제한다 (Soft Delete)
     */
    async 삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        const snapshot = await repository.findOne({ where: { id } });
        if (!snapshot) {
            throw new NotFoundException(`데이터 스냅샷 정보를 찾을 수 없습니다. (id: ${id})`);
        }
        // Soft Delete: deleted_at 필드를 설정
        snapshot.deleted_at = new Date();
        // 삭제자 정보 설정
        snapshot.수정자설정한다(userId);
        snapshot.메타데이터업데이트한다(userId);
        await repository.save(snapshot);
    }

    /**
     * 데이터 스냅샷 정보를 완전히 삭제한다 (Hard Delete)
     */
    async 완전삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        // Soft Delete된 데이터 스냅샷 정보도 조회할 수 있도록 withDeleted 옵션 사용
        const snapshot = await repository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!snapshot) {
            throw new NotFoundException(`데이터 스냅샷 정보를 찾을 수 없습니다. (id: ${id})`);
        }
        // Hard Delete: 데이터베이스에서 완전히 삭제
        await repository.remove(snapshot);
    }

    /**
     * 동일 연월의 다른 스냅샷들의 is_current를 false로 설정한다
     *
     * @param yyyy 연도
     * @param mm 월
     * @param excludeSnapshotId 제외할 스냅샷 ID (이 스냅샷은 제외하고 나머지만 false로 설정)
     * @param userId 수정자 ID
     * @param manager 트랜잭션 매니저 (선택)
     */
    async 동일연월다른스냅샷들을비현재로설정한다(
        yyyy: string,
        mm: string,
        excludeSnapshotId: string,
        userId: string,
        manager?: EntityManager,
    ): Promise<void> {
        const repository = this.getRepository(manager);

        // 동일 연월의 다른 스냅샷들 조회 (현재 스냅샷 제외)
        const otherSnapshots = await repository.find({
            where: {
                yyyy,
                mm,
                deleted_at: IsNull(),
            },
        });

        // 현재 스냅샷을 제외하고 is_current가 true인 스냅샷들을 false로 설정
        const snapshotsToUpdate = otherSnapshots.filter(
            (snapshot) => snapshot.id !== excludeSnapshotId && snapshot.is_current === true,
        );

        if (snapshotsToUpdate.length > 0) {
            for (const snapshot of snapshotsToUpdate) {
                snapshot.업데이트한다(
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    false,
                );
                snapshot.수정자설정한다(userId);
                snapshot.메타데이터업데이트한다(userId);
            }
            await repository.save(snapshotsToUpdate);
        }
    }

    /**
     * 특정 스냅샷을 현재 스냅샷으로 설정하고 동일 연월의 다른 스냅샷들은 비현재로 설정한다
     *
     * @param snapshotId 현재로 설정할 스냅샷 ID
     * @param userId 수정자 ID
     * @param manager 트랜잭션 매니저 (선택)
     */
    async 현재스냅샷으로설정한다(
        snapshotId: string,
        userId: string,
        manager?: EntityManager,
    ): Promise<DataSnapshotInfoDTO> {
        const repository = this.getRepository(manager);
        const snapshot = await repository.findOne({ where: { id: snapshotId } });
        if (!snapshot) {
            throw new NotFoundException(`데이터 스냅샷 정보를 찾을 수 없습니다. (id: ${snapshotId})`);
        }

        // 1. 동일 연월의 다른 스냅샷들을 비현재로 설정
        await this.동일연월다른스냅샷들을비현재로설정한다(snapshot.yyyy, snapshot.mm, snapshotId, userId, manager);

        // 2. 현재 스냅샷을 is_current = true로 설정
        snapshot.업데이트한다(undefined, undefined, undefined, undefined, undefined, undefined, undefined, true);
        snapshot.수정자설정한다(userId);
        snapshot.메타데이터업데이트한다(userId);

        const saved = await repository.save(snapshot);
        return saved.DTO변환한다();
    }
}
