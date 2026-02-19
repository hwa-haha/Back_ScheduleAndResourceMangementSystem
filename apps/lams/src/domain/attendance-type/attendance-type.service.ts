import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { AttendanceType } from './attendance-type.entity';
import { CreateAttendanceTypeData, UpdateAttendanceTypeData, AttendanceTypeDTO } from './attendance-type.types';

/**
 * 출석 타입 서비스
 *
 * 출석 타입 엔티티에 대한 CRUD 기능을 제공합니다.
 * 상위 로직에서 제공하는 트랜잭션(EntityManager)을 받아서 사용할 수 있습니다.
 */
@Injectable()
export class DomainAttendanceTypeService {
    constructor(
        @InjectRepository(AttendanceType)
        private readonly repository: Repository<AttendanceType>,
    ) {}

    /**
     * Repository를 가져온다 (트랜잭션 지원)
     */
    private getRepository(manager?: EntityManager): Repository<AttendanceType> {
        return manager ? manager.getRepository(AttendanceType) : this.repository;
    }

    /**
     * 출석 타입을 생성한다
     */
    async 생성한다(data: CreateAttendanceTypeData, manager?: EntityManager): Promise<AttendanceTypeDTO> {
        const repository = this.getRepository(manager);

        const attendanceType = new AttendanceType(
            data.title,
            data.workTime,
            data.isRecognizedWorkTime,
            data.startWorkTime,
            data.endWorkTime,
            data.deductedAnnualLeave !== undefined ? data.deductedAnnualLeave : 0,
            data.code,
            data.isActive !== undefined ? data.isActive : true,
        );

        const saved = await repository.save(attendanceType);
        return saved.DTO변환한다();
    }

    /**
     * ID로 출석 타입을 조회한다
     */
    async ID로조회한다(id: string): Promise<AttendanceTypeDTO> {
        const attendanceType = await this.repository.findOne({ where: { id } });
        if (!attendanceType) {
            throw new NotFoundException(`출석 타입을 찾을 수 없습니다. (id: ${id})`);
        }
        return attendanceType.DTO변환한다();
    }

    /**
     * 출석 타입 목록을 조회한다
     */
    async 목록조회한다(): Promise<AttendanceTypeDTO[]> {
        const attendanceTypes = await this.repository.find({
            where: { deleted_at: IsNull() },
            order: { title: 'ASC' },
        });
        return attendanceTypes.map((at) => at.DTO변환한다());
    }

    /**
     * 출석 타입 정보를 수정한다
     */
    async 수정한다(
        id: string,
        data: UpdateAttendanceTypeData,
        userId: string,
        manager?: EntityManager,
    ): Promise<AttendanceTypeDTO> {
        const repository = this.getRepository(manager);
        const attendanceType = await repository.findOne({ where: { id } });
        if (!attendanceType) {
            throw new NotFoundException(`출석 타입을 찾을 수 없습니다. (id: ${id})`);
        }

        attendanceType.업데이트한다(
            data.title,
            data.workTime,
            data.isRecognizedWorkTime,
            data.startWorkTime,
            data.endWorkTime,
            data.deductedAnnualLeave,
            data.code,
            data.isActive,
        );

        // 수정자 정보 설정
        attendanceType.수정자설정한다(userId);
        attendanceType.메타데이터업데이트한다(userId);

        const saved = await repository.save(attendanceType);
        return saved.DTO변환한다();
    }

    /**
     * 출석 타입을 삭제한다 (Soft Delete)
     */
    async 삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        const attendanceType = await repository.findOne({ where: { id } });
        if (!attendanceType) {
            throw new NotFoundException(`출석 타입을 찾을 수 없습니다. (id: ${id})`);
        }
        // Soft Delete: deleted_at 필드를 설정
        attendanceType.deleted_at = new Date();
        // 삭제자 정보 설정
        attendanceType.수정자설정한다(userId);
        attendanceType.메타데이터업데이트한다(userId);
        await repository.save(attendanceType);
    }

    /**
     * 출석 타입을 완전히 삭제한다 (Hard Delete)
     */
    async 완전삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        // Soft Delete된 출석 타입도 조회할 수 있도록 withDeleted 옵션 사용
        const attendanceType = await repository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!attendanceType) {
            throw new NotFoundException(`출석 타입을 찾을 수 없습니다. (id: ${id})`);
        }
        // Hard Delete: 데이터베이스에서 완전히 삭제
        await repository.remove(attendanceType);
    }
}
