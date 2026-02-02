import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { WorkHours } from './work-hours.entity';
import { CreateWorkHoursData, UpdateWorkHoursData, WorkHoursDTO } from './work-hours.types';

/**
 * 시수 서비스
 *
 * 시수 엔티티에 대한 CRUD 기능을 제공합니다.
 * 상위 로직에서 제공하는 트랜잭션(EntityManager)을 받아서 사용할 수 있습니다.
 */
@Injectable()
export class DomainWorkHoursService {
    constructor(
        @InjectRepository(WorkHours)
        private readonly repository: Repository<WorkHours>,
    ) {}

    /**
     * Repository를 가져온다 (트랜잭션 지원)
     */
    private getRepository(manager?: EntityManager): Repository<WorkHours> {
        return manager ? manager.getRepository(WorkHours) : this.repository;
    }

    /**
     * 시수를 생성한다
     */
    async 생성한다(data: CreateWorkHoursData, manager?: EntityManager): Promise<WorkHoursDTO> {
        const repository = this.getRepository(manager);

        const workHours = new WorkHours(
            data.assignedProjectId,
            data.date,
            data.startTime,
            data.endTime,
            data.workMinutes ?? 0,
            data.note,
        );
        if (data.startTime && data.endTime && data.workMinutes == null) {
            workHours.근무시간계산한다();
        }

        const saved = await repository.save(workHours);
        return saved.DTO변환한다();
    }

    /**
     * ID로 시수를 조회한다
     */
    async ID로조회한다(id: string): Promise<WorkHoursDTO> {
        const workHours = await this.repository.findOne({
            where: { id },
            relations: ['assignedProject'],
        });
        if (!workHours) {
            throw new NotFoundException(`시수를 찾을 수 없습니다. (id: ${id})`);
        }
        return workHours.DTO변환한다();
    }

    /**
     * 할당된 프로젝트 ID로 시수 목록을 조회한다
     */
    async 할당된프로젝트ID로조회한다(assignedProjectId: string): Promise<WorkHoursDTO[]> {
        const workHoursList = await this.repository.find({
            where: { assigned_project_id: assignedProjectId, deleted_at: IsNull() },
            order: { date: 'ASC' },
        });
        return workHoursList.map((wh) => wh.DTO변환한다());
    }

    /**
     * 날짜 범위로 시수 목록을 조회한다
     */
    async 날짜범위로조회한다(assignedProjectId: string, startDate: string, endDate: string): Promise<WorkHoursDTO[]> {
        const workHoursList = await this.repository
            .createQueryBuilder('workHours')
            .where('workHours.deleted_at IS NULL')
            .andWhere('workHours.assigned_project_id = :assignedProjectId', { assignedProjectId })
            .andWhere('workHours.date >= :startDate', { startDate })
            .andWhere('workHours.date <= :endDate', { endDate })
            .orderBy('workHours.date', 'ASC')
            .getMany();
        return workHoursList.map((wh) => wh.DTO변환한다());
    }

    /**
     * 특정 날짜의 시수를 조회한다
     */
    async 날짜로조회한다(assignedProjectId: string, date: string): Promise<WorkHoursDTO | null> {
        const workHours = await this.repository.findOne({
            where: { assigned_project_id: assignedProjectId, date, deleted_at: IsNull() },
        });
        return workHours ? workHours.DTO변환한다() : null;
    }

    /**
     * 연도별 시수 합계를 조회한다
     */
    async 연도별합계조회한다(assignedProjectId: string, year: string): Promise<number> {
        const result = await this.repository
            .createQueryBuilder('workHours')
            .select('SUM(workHours.work_minutes)', 'total')
            .where('workHours.deleted_at IS NULL')
            .andWhere('workHours.assigned_project_id = :assignedProjectId', { assignedProjectId })
            .andWhere('workHours.date LIKE :year', { year: `${year}%` })
            .getRawOne();

        return result?.total || 0;
    }

    /**
     * 월별 시수 합계를 조회한다
     */
    async 월별합계조회한다(assignedProjectId: string, year: string, month: string): Promise<number> {
        const yearMonth = `${year}-${month.padStart(2, '0')}`;
        const result = await this.repository
            .createQueryBuilder('workHours')
            .select('SUM(workHours.work_minutes)', 'total')
            .where('workHours.deleted_at IS NULL')
            .andWhere('workHours.assigned_project_id = :assignedProjectId', { assignedProjectId })
            .andWhere('workHours.date LIKE :yearMonth', { yearMonth: `${yearMonth}%` })
            .getRawOne();

        return result?.total || 0;
    }

    /**
     * 월별 직원별 시수 합계를 조회한다 (선택 직원·선택 프로젝트 필터 지원)
     */
    async 월별직원별시수합계조회한다(
        employeeIds: string[],
        startDate: string,
        endDate: string,
        projectIds?: string[],
    ): Promise<{ employeeId: string; totalMinutes: number }[]> {
        if (employeeIds.length === 0) {
            return [];
        }
        const qb = this.repository
            .createQueryBuilder('wh')
            .innerJoin('wh.assignedProject', 'ap')
            .select('ap.employee_id', 'employeeId')
            .addSelect('SUM(wh.work_minutes)', 'totalMinutes')
            .where('wh.deleted_at IS NULL')
            .andWhere('wh.date >= :startDate', { startDate })
            .andWhere('wh.date <= :endDate', { endDate })
            .andWhere('ap.employee_id IN (:...employeeIds)', { employeeIds })
            .groupBy('ap.employee_id');
        if (projectIds?.length) {
            qb.andWhere('ap.project_id IN (:...projectIds)', { projectIds });
        }
        const rows = await qb.getRawMany<{ employeeId: string; totalMinutes: string }>();
        return rows.map((r) => ({
            employeeId: r.employeeId,
            totalMinutes: Number(r.totalMinutes) || 0,
        }));
    }

    /**
     * 월별 직원별 일별 시수 합계를 조회한다 (선택 직원·선택 프로젝트 필터 지원)
     * 직원·날짜별 SUM(work_minutes) 반환
     */
    async 월별직원별일별시수합계조회한다(
        employeeIds: string[],
        startDate: string,
        endDate: string,
        projectIds?: string[],
    ): Promise<{ employeeId: string; date: string; totalMinutes: number }[]> {
        if (employeeIds.length === 0) {
            return [];
        }
        const qb = this.repository
            .createQueryBuilder('wh')
            .innerJoin('wh.assignedProject', 'ap')
            .select('ap.employee_id', 'employeeId')
            .addSelect('wh.date', 'date')
            .addSelect('SUM(wh.work_minutes)', 'totalMinutes')
            .where('wh.deleted_at IS NULL')
            .andWhere('wh.date >= :startDate', { startDate })
            .andWhere('wh.date <= :endDate', { endDate })
            .andWhere('ap.employee_id IN (:...employeeIds)', { employeeIds })
            .groupBy('ap.employee_id')
            .addGroupBy('wh.date');
        if (projectIds?.length) {
            qb.andWhere('ap.project_id IN (:...projectIds)', { projectIds });
        }
        const rows = await qb.getRawMany<{ employeeId: string; date: string; totalMinutes: string }>();
        return rows.map((r) => ({
            employeeId: r.employeeId,
            date: r.date,
            totalMinutes: Number(r.totalMinutes) || 0,
        }));
    }

    /**
     * 월별 프로젝트별 일별 시수 합계를 조회한다 (project_id 기준 그룹, 선택 프로젝트 필터 지원)
     */
    async 월별프로젝트별일별시수합계조회한다(
        startDate: string,
        endDate: string,
        projectIds?: string[],
    ): Promise<{ projectId: string; date: string; totalMinutes: number }[]> {
        const qb = this.repository
            .createQueryBuilder('wh')
            .innerJoin('wh.assignedProject', 'ap')
            .select('ap.project_id', 'projectId')
            .addSelect('wh.date', 'date')
            .addSelect('SUM(wh.work_minutes)', 'totalMinutes')
            .where('wh.deleted_at IS NULL')
            .andWhere('wh.date >= :startDate', { startDate })
            .andWhere('wh.date <= :endDate', { endDate })
            .groupBy('ap.project_id')
            .addGroupBy('wh.date');
        if (projectIds?.length) {
            qb.andWhere('ap.project_id IN (:...projectIds)', { projectIds });
        }
        const rows = await qb.getRawMany<{ projectId: string; date: string; totalMinutes: string }>();
        return rows.map((r) => ({
            projectId: r.projectId,
            date: r.date,
            totalMinutes: Number(r.totalMinutes) || 0,
        }));
    }

    /**
     * 시수를 생성하거나 업데이트한다 (upsert)
     */
    async 생성또는수정한다(data: CreateWorkHoursData, userId: string, manager?: EntityManager): Promise<WorkHoursDTO> {
        const repository = this.getRepository(manager);
        const existing = await repository.findOne({
            where: {
                assigned_project_id: data.assignedProjectId,
                date: data.date,
                deleted_at: IsNull(),
            },
        });

        if (existing) {
            existing.업데이트한다(data.startTime, data.endTime, data.workMinutes, data.note);
            if (data.startTime && data.endTime && data.workMinutes == null) {
                existing.근무시간계산한다();
            }
            existing.수정자설정한다(userId);
            existing.메타데이터업데이트한다(userId);

            const saved = await repository.save(existing);
            return saved.DTO변환한다();
        } else {
            // 새 시수 생성
            return await this.생성한다(data, manager);
        }
    }

    /**
     * 일괄 시수 생성 (1년치)
     */
    async 연도별일괄생성한다(
        assignedProjectId: string,
        year: string,
        manager?: EntityManager,
    ): Promise<WorkHoursDTO[]> {
        const repository = this.getRepository(manager);
        const workHoursList: WorkHours[] = [];
        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year}-12-31`);

        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const dateStr = date.toISOString().split('T')[0];
            const workHours = new WorkHours(assignedProjectId, dateStr, null, null, 0, null);
            workHoursList.push(workHours);
        }

        const saved = await repository.save(workHoursList);
        return saved.map((wh) => wh.DTO변환한다());
    }

    /**
     * 시수 정보를 수정한다
     */
    async 수정한다(
        id: string,
        data: UpdateWorkHoursData,
        userId: string,
        manager?: EntityManager,
    ): Promise<WorkHoursDTO> {
        const repository = this.getRepository(manager);
        const workHours = await repository.findOne({ where: { id } });
        if (!workHours) {
            throw new NotFoundException(`시수를 찾을 수 없습니다. (id: ${id})`);
        }

        workHours.업데이트한다(data.startTime, data.endTime, data.workMinutes, data.note);
        if (data.startTime && data.endTime && data.workMinutes == null) {
            workHours.근무시간계산한다();
        }
        workHours.수정자설정한다(userId);
        workHours.메타데이터업데이트한다(userId);

        const saved = await repository.save(workHours);
        return saved.DTO변환한다();
    }

    /**
     * 시수를 삭제한다 (Soft Delete)
     */
    async 삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        const workHours = await repository.findOne({ where: { id } });
        if (!workHours) {
            throw new NotFoundException(`시수를 찾을 수 없습니다. (id: ${id})`);
        }
        // Soft Delete: deleted_at 필드를 설정
        workHours.deleted_at = new Date();
        // 삭제자 정보 설정
        workHours.수정자설정한다(userId);
        workHours.메타데이터업데이트한다(userId);
        await repository.save(workHours);
    }

    /**
     * 시수를 완전히 삭제한다 (Hard Delete)
     */
    async 완전삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        // Soft Delete된 시수도 조회할 수 있도록 withDeleted 옵션 사용
        const workHours = await repository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!workHours) {
            throw new NotFoundException(`시수를 찾을 수 없습니다. (id: ${id})`);
        }
        // Hard Delete: 데이터베이스에서 완전히 삭제
        await repository.remove(workHours);
    }
}
