import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { EmployeeExtraInfo } from './employee-extra-info.entity';
import {
    CreateEmployeeExtraInfoData,
    UpdateEmployeeExtraInfoData,
    EmployeeExtraInfoDTO,
} from './employee-extra-info.types';

/**
 * 직원 추가 정보 서비스
 *
 * 직원 추가 정보 엔티티에 대한 CRUD 기능을 제공합니다.
 * 상위 로직에서 제공하는 트랜잭션(EntityManager)을 받아서 사용할 수 있습니다.
 */
@Injectable()
export class DomainEmployeeExtraInfoService {
    constructor(
        @InjectRepository(EmployeeExtraInfo)
        private readonly repository: Repository<EmployeeExtraInfo>,
    ) {}

    /**
     * Repository를 가져온다 (트랜잭션 지원)
     */
    private getRepository(manager?: EntityManager): Repository<EmployeeExtraInfo> {
        return manager ? manager.getRepository(EmployeeExtraInfo) : this.repository;
    }

    /**
     * 직원 추가 정보를 생성한다
     */
    async 생성한다(
        data: CreateEmployeeExtraInfoData,
        manager?: EntityManager,
    ): Promise<EmployeeExtraInfoDTO> {
        const repository = this.getRepository(manager);

        const extraInfo = new EmployeeExtraInfo(data.employeeId, data.isExcludedFromSummary);

        const saved = await repository.save(extraInfo);
        return saved.DTO변환한다();
    }

    /**
     * ID로 직원 추가 정보를 조회한다
     */
    async ID로조회한다(id: string): Promise<EmployeeExtraInfoDTO> {
        const extraInfo = await this.repository.findOne({
            where: { id },
            relations: ['employee'],
        });
        if (!extraInfo) {
            throw new NotFoundException(`직원 추가 정보를 찾을 수 없습니다. (id: ${id})`);
        }
        return extraInfo.DTO변환한다();
    }

    /**
     * 직원 ID로 추가 정보를 조회한다
     */
    async 직원ID로조회한다(
        employeeId: string,
        manager?: EntityManager,
    ): Promise<EmployeeExtraInfoDTO | null> {
        const repository = this.getRepository(manager);
        const extraInfo = await repository.findOne({
            where: { employee_id: employeeId, deleted_at: IsNull() },
            relations: ['employee'],
        });
        return extraInfo ? extraInfo.DTO변환한다() : null;
    }

    /**
     * 직원 추가 정보를 수정한다
     */
    async 수정한다(
        id: string,
        data: UpdateEmployeeExtraInfoData,
        userId: string,
        manager?: EntityManager,
    ): Promise<EmployeeExtraInfoDTO> {
        const repository = this.getRepository(manager);
        const extraInfo = await repository.findOne({ where: { id } });
        if (!extraInfo) {
            throw new NotFoundException(`직원 추가 정보를 찾을 수 없습니다. (id: ${id})`);
        }

        extraInfo.업데이트한다(data.isExcludedFromSummary);

        // 수정자 정보 설정
        extraInfo.수정자설정한다(userId);
        extraInfo.메타데이터업데이트한다(userId);

        const saved = await repository.save(extraInfo);
        return saved.DTO변환한다();
    }

    /**
     * 직원 ID로 추가 정보를 수정한다 (없으면 생성)
     */
    async 직원ID로생성또는수정한다(
        employeeId: string,
        data: UpdateEmployeeExtraInfoData,
        userId: string,
        manager?: EntityManager,
    ): Promise<EmployeeExtraInfoDTO> {
        const repository = this.getRepository(manager);
        const existing = await repository.findOne({
            where: { employee_id: employeeId, deleted_at: IsNull() },
        });

        if (existing) {
            // 기존 정보가 있으면 업데이트
            existing.업데이트한다(data.isExcludedFromSummary);
            existing.수정자설정한다(userId);
            existing.메타데이터업데이트한다(userId);
            const saved = await repository.save(existing);
            return saved.DTO변환한다();
        } else {
            // 기존 정보가 없으면 생성
            const newExtraInfo = new EmployeeExtraInfo(
                employeeId,
                data.isExcludedFromSummary ?? false,
            );
            newExtraInfo.생성자설정한다(userId);
            newExtraInfo.메타데이터업데이트한다(userId);
            const saved = await repository.save(newExtraInfo);
            return saved.DTO변환한다();
        }
    }

    /**
     * 직원 추가 정보를 삭제한다 (Soft Delete)
     */
    async 삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        const extraInfo = await repository.findOne({ where: { id } });
        if (!extraInfo) {
            throw new NotFoundException(`직원 추가 정보를 찾을 수 없습니다. (id: ${id})`);
        }
        // Soft Delete: deleted_at 필드를 설정
        extraInfo.deleted_at = new Date();
        // 삭제자 정보 설정
        extraInfo.수정자설정한다(userId);
        extraInfo.메타데이터업데이트한다(userId);
        await repository.save(extraInfo);
    }
}
