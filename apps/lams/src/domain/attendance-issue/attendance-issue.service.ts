import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, IsNull, Repository } from 'typeorm';
import { AttendanceIssue } from './attendance-issue.entity';
import {
    CreateAttendanceIssueData,
    UpdateAttendanceIssueData,
    AttendanceIssueStatus,
    AttendanceIssueDTO,
} from './attendance-issue.types';

/**
 * 근태 이슈 서비스
 *
 * 근태 이슈 엔티티에 대한 CRUD 기능을 제공합니다.
 * 상위 로직에서 제공하는 트랜잭션(EntityManager)을 받아서 사용할 수 있습니다.
 */
@Injectable()
export class DomainAttendanceIssueService {
    constructor(
        @InjectRepository(AttendanceIssue)
        private readonly repository: Repository<AttendanceIssue>,
    ) {}

    /**
     * Repository를 가져온다 (트랜잭션 지원)
     */
    private getRepository(manager?: EntityManager): Repository<AttendanceIssue> {
        return manager ? manager.getRepository(AttendanceIssue) : this.repository;
    }

    /**
     * 근태 이슈를 생성한다
     */
    async 생성한다(data: CreateAttendanceIssueData, manager?: EntityManager): Promise<AttendanceIssueDTO> {
        const repository = this.getRepository(manager);

        const issue = new AttendanceIssue(
            data.employeeId,
            data.date,
            data.dailyEventSummaryId,
            data.problematicEnterTime,
            data.problematicLeaveTime,
            data.correctedEnterTime,
            data.correctedLeaveTime,
            data.problematicAttendanceTypeIds,
            data.correctedAttendanceTypeIds,
            data.description,
        );

        const saved = await repository.save(issue);
        return saved.DTO변환한다();
    }

    /**
     * ID로 근태 이슈를 조회한다
     */
    async ID로조회한다(id: string): Promise<AttendanceIssueDTO> {
        const issue = await this.repository.findOne({
            where: { id },
            relations: ['employee', 'dailyEventSummary'],
        });
        if (!issue) {
            throw new NotFoundException(`근태 이슈를 찾을 수 없습니다. (id: ${id})`);
        }
        return issue.DTO변환한다();
    }

    /**
     * ID 목록으로 근태 이슈 목록을 조회한다 (존재하는 것만 반환)
     */
    async ID목록으로조회한다(ids: string[], manager?: EntityManager): Promise<AttendanceIssueDTO[]> {
        if (!ids?.length) {
            return [];
        }
        const repository = this.getRepository(manager);
        const issues = await repository.find({
            where: { id: In(ids), deleted_at: IsNull() },
            order: { date: 'DESC', created_at: 'DESC' },
        });
        return issues.map((issue) => issue.DTO변환한다());
    }

    /**
     * 직원 ID로 근태 이슈 목록을 조회한다
     */
    async 직원ID로조회한다(employeeId: string): Promise<AttendanceIssueDTO[]> {
        const issues = await this.repository.find({
            where: { employee_id: employeeId, deleted_at: IsNull() },
            order: { date: 'DESC', created_at: 'DESC' },
        });
        return issues.map((issue) => issue.DTO변환한다());
    }

    /**
     * 날짜 범위로 근태 이슈 목록을 조회한다
     */
    async 날짜범위로조회한다(startDate: string, endDate: string): Promise<AttendanceIssueDTO[]> {
        const issues = await this.repository
            .createQueryBuilder('issue')
            .where('issue.deleted_at IS NULL')
            .andWhere('issue.date >= :startDate', { startDate })
            .andWhere('issue.date <= :endDate', { endDate })
            .orderBy('issue.date', 'DESC')
            .addOrderBy('issue.created_at', 'DESC')
            .getMany();
        return issues.map((issue) => issue.DTO변환한다());
    }

    /**
     * 상태별 근태 이슈 목록을 조회한다
     */
    async 상태별목록조회한다(status: AttendanceIssueStatus): Promise<AttendanceIssueDTO[]> {
        const issues = await this.repository.find({
            where: { status, deleted_at: IsNull() },
            order: { created_at: 'DESC' },
        });
        return issues.map((issue) => issue.DTO변환한다());
    }

    /**
     * 일간 요약 ID로 근태 이슈 목록을 조회한다
     */
    async 일간요약ID로조회한다(dailyEventSummaryId: string): Promise<AttendanceIssueDTO[]> {
        const issues = await this.repository.find({
            where: { daily_event_summary_id: dailyEventSummaryId, deleted_at: IsNull() },
            order: { created_at: 'DESC' },
        });
        return issues.map((issue) => issue.DTO변환한다());
    }

    /**
     * 일간 요약 ID 목록으로 근태 이슈 목록을 일괄 조회한다
     *
     * 여러 일간 요약의 근태 이슈를 한 번의 쿼리로 조회합니다.
     * 결과는 일간 요약 ID별로 그룹화되어 반환됩니다.
     */
    async 일간요약ID목록으로목록조회한다(
        dailyEventSummaryIds: string[],
        manager?: EntityManager,
    ): Promise<Map<string, AttendanceIssueDTO[]>> {
        if (dailyEventSummaryIds.length === 0) {
            return new Map();
        }

        const repository = this.getRepository(manager);
        const issues = await repository
            .createQueryBuilder('issue')
            .where('issue.daily_event_summary_id IN (:...ids)', { ids: dailyEventSummaryIds })
            .andWhere('issue.deleted_at IS NULL')
            .orderBy('issue.daily_event_summary_id', 'ASC')
            .addOrderBy('issue.created_at', 'DESC')
            .getMany();

        // 일간 요약 ID별로 그룹화
        const issueMap = new Map<string, AttendanceIssueDTO[]>();
        issues.forEach((issue) => {
            const id = issue.daily_event_summary_id;
            if (!id) return; // daily_event_summary_id가 null인 경우 스킵

            if (!issueMap.has(id)) {
                issueMap.set(id, []);
            }
            issueMap.get(id)!.push(issue.DTO변환한다());
        });

        return issueMap;
    }

    /**
     * 요청 상태인 근태 이슈 목록을 조회한다
     */
    async 요청중목록조회한다(): Promise<AttendanceIssueDTO[]> {
        return this.상태별목록조회한다(AttendanceIssueStatus.REQUEST);
    }

    /**
     * 반영된 근태 이슈 목록을 조회한다
     */
    async 반영된목록조회한다(): Promise<AttendanceIssueDTO[]> {
        return this.상태별목록조회한다(AttendanceIssueStatus.APPLIED);
    }

    /**
     * 미반영된 근태 이슈 목록을 조회한다
     */
    async 미반영된목록조회한다(): Promise<AttendanceIssueDTO[]> {
        return this.상태별목록조회한다(AttendanceIssueStatus.NOT_APPLIED);
    }

    /**
     * 특정 날짜의 근태 이슈 목록을 조회한다
     */
    async 날짜로조회한다(date: string): Promise<AttendanceIssueDTO[]> {
        const issues = await this.repository.find({
            where: { date, deleted_at: IsNull() },
            order: { created_at: 'DESC' },
        });
        return issues.map((issue) => issue.DTO변환한다());
    }

    /**
     * 근태 이슈 정보를 수정한다
     */
    async 수정한다(
        id: string,
        data: UpdateAttendanceIssueData,
        userId: string,
        manager?: EntityManager,
    ): Promise<AttendanceIssueDTO> {
        const repository = this.getRepository(manager);
        const issue = await repository.findOne({ where: { id } });
        if (!issue) {
            throw new NotFoundException(`근태 이슈를 찾을 수 없습니다. (id: ${id})`);
        }

        issue.업데이트한다(
            data.problematicEnterTime,
            data.problematicLeaveTime,
            data.correctedEnterTime,
            data.correctedLeaveTime,
            data.problematicAttendanceTypeIds,
            data.correctedAttendanceTypeIds,
            data.description,
            data.status,
            data.rejectionReason,
        );

        // 수정자 정보 설정
        issue.수정자설정한다(userId);
        issue.메타데이터업데이트한다(userId);

        const saved = await repository.save(issue);
        return saved.DTO변환한다();
    }

    /**
     * 근태 이슈를 요청한다 (단건)
     */
    async 요청한다(id: string, userId: string, manager?: EntityManager): Promise<AttendanceIssueDTO> {
        const repository = this.getRepository(manager);
        const issue = await repository.findOne({ where: { id } });
        if (!issue) {
            throw new NotFoundException(`근태 이슈를 찾을 수 없습니다. (id: ${id})`);
        }
        issue.요청한다();
        issue.수정자설정한다(userId);
        issue.메타데이터업데이트한다(userId);

        const saved = await repository.save(issue);
        return saved.DTO변환한다();
    }

    /**
     * ID 목록으로 근태 이슈를 벌크 요청한다 (PENDING → REQUEST)
     * PENDING 상태인 이슈만 일괄 변경하며, 한 번에 저장한다.
     */
    async ID목록으로요청한다(
        ids: string[],
        userId: string,
        manager?: EntityManager,
    ): Promise<AttendanceIssueDTO[]> {
        if (!ids?.length) return [];
        const repository = this.getRepository(manager);
        const issues = await repository.find({
            where: { id: In(ids), deleted_at: IsNull() },
        });
        const toUpdate = issues.filter((i) => i.status === AttendanceIssueStatus.PENDING);
        for (const issue of toUpdate) {
            issue.요청한다();
            issue.수정자설정한다(userId);
            issue.메타데이터업데이트한다(userId);
        }
        if (toUpdate.length === 0) return [];
        const saved = await repository.save(toUpdate);
        return saved.map((s) => s.DTO변환한다());
    }

    /**
     * ID 목록으로 근태 이슈를 벌크 재요청한다 (NOT_APPLIED/PENDING/REQUEST → REQUEST)
     * APPLIED 상태는 제외하고, 나머지를 REQUEST로 일괄 변경한다.
     */
    async ID목록으로재요청한다(
        ids: string[],
        userId: string,
        manager?: EntityManager,
    ): Promise<AttendanceIssueDTO[]> {
        if (!ids?.length) return [];
        const repository = this.getRepository(manager);
        const issues = await repository.find({
            where: { id: In(ids), deleted_at: IsNull() },
        });
        const toUpdate = issues.filter((i) => i.status !== AttendanceIssueStatus.APPLIED);
        for (const issue of toUpdate) {
            issue.요청한다();
            issue.수정자설정한다(userId);
            issue.메타데이터업데이트한다(userId);
        }
        if (toUpdate.length === 0) return [];
        const saved = await repository.save(toUpdate);
        return saved.map((s) => s.DTO변환한다());
    }

    /**
     * 근태 이슈 반영 처리
     */
    async 반영처리한다(
        id: string,
        confirmedBy: string,
        userId: string,
        manager?: EntityManager,
    ): Promise<AttendanceIssueDTO> {
        const repository = this.getRepository(manager);
        const issue = await repository.findOne({ where: { id } });
        if (!issue) {
            throw new NotFoundException(`근태 이슈를 찾을 수 없습니다. (id: ${id})`);
        }

        issue.반영처리한다(confirmedBy);
        issue.수정자설정한다(userId);
        issue.메타데이터업데이트한다(userId);

        const saved = await repository.save(issue);
        return saved.DTO변환한다();
    }

    /**
     * 근태 이슈 미반영 처리
     */
    async 미반영처리한다(
        id: string,
        rejectionReason: string,
        userId: string,
        manager?: EntityManager,
    ): Promise<AttendanceIssueDTO> {
        const repository = this.getRepository(manager);
        const issue = await repository.findOne({ where: { id } });
        if (!issue) {
            throw new NotFoundException(`근태 이슈를 찾을 수 없습니다. (id: ${id})`);
        }

        issue.미반영처리한다(rejectionReason);
        issue.수정자설정한다(userId);
        issue.메타데이터업데이트한다(userId);

        const saved = await repository.save(issue);
        return saved.DTO변환한다();
    }

    /**
     * 근태 이슈를 삭제한다 (Soft Delete)
     */
    async 삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        const issue = await repository.findOne({ where: { id } });
        if (!issue) {
            throw new NotFoundException(`근태 이슈를 찾을 수 없습니다. (id: ${id})`);
        }
        // Soft Delete: deleted_at 필드를 설정
        issue.deleted_at = new Date();
        // 삭제자 정보 설정
        issue.수정자설정한다(userId);
        issue.메타데이터업데이트한다(userId);
        await repository.save(issue);
    }

    /**
     * 근태 이슈를 완전히 삭제한다 (Hard Delete)
     */
    async 완전삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        // Soft Delete된 근태 이슈도 조회할 수 있도록 withDeleted 옵션 사용
        const issue = await repository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!issue) {
            throw new NotFoundException(`근태 이슈를 찾을 수 없습니다. (id: ${id})`);
        }
        // Hard Delete: 데이터베이스에서 완전히 삭제
        await repository.remove(issue);
    }
}
