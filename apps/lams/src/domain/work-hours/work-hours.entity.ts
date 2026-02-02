import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { BaseEntity } from '@libs/database/base/base.entity';
import { AssignedProject } from '../assigned-project/assigned-project.entity';
import { WorkHoursDTO } from './work-hours.types';

/**
 * 시수 엔티티
 *
 * 직원-프로젝트별 일일 근무 시수 데이터
 * 할당된 프로젝트와 1:N 관계 (직원-프로젝트별로 1년 기준 365개의 시수 데이터)
 */
@Entity('work_hours')
@Index(['assigned_project_id', 'date'])
@Index(['assigned_project_id'])
@Index(['date'])
export class WorkHours extends BaseEntity<WorkHoursDTO> {
    // BaseEntity에서 id, created_at, updated_at, deleted_at, created_by, updated_by, version 제공

    /**
     * 할당된 프로젝트 ID (외래키)
     */
    @Column({ name: 'assigned_project_id', type: 'uuid' })
    assigned_project_id: string;

    /**
     * 할당된 프로젝트 엔티티와의 관계
     */
    @ManyToOne(() => AssignedProject, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'assigned_project_id' })
    assignedProject: AssignedProject;

    /**
     * 날짜
     * 시수가 기록된 날짜
     */
    @Column({
        name: 'date',
        type: 'date',
        comment: '날짜',
    })
    date: string;

    /**
     * 근무 시작 시간
     * 해당 날짜에 프로젝트 근무를 시작한 시간
     */
    @Column({
        name: 'start_time',
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: '근무 시작 시간',
    })
    start_time: string | null;

    /**
     * 근무 종료 시간
     * 해당 날짜에 프로젝트 근무를 종료한 시간
     */
    @Column({
        name: 'end_time',
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: '근무 종료 시간',
    })
    end_time: string | null;

    /**
     * 근무 시간 (분 단위)
     * 해당 날짜에 프로젝트에 투입된 시간
     */
    @Column({
        name: 'work_minutes',
        type: 'int',
        default: 0,
        comment: '근무 시간 (분 단위)',
    })
    work_minutes: number;

    /**
     * 비고
     */
    @Column({
        name: 'note',
        type: 'text',
        nullable: true,
        comment: '비고',
    })
    note: string | null;

    /**
     * 시수 불변성 검증
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
        if (!this.assigned_project_id || !this.date) {
            return;
        }

        this.validateUuidFormat(this.assigned_project_id, 'assigned_project_id');
    }

    /**
     * 데이터 형식 검증
     */
    private validateDataFormat(): void {
        // TypeORM 메타데이터 검증 단계에서는 검증을 건너뜀
        if (this.work_minutes === undefined) {
            return;
        }

        // work_minutes는 0 이상이어야 함
        if (this.work_minutes < 0) {
            throw new BadRequestException('근무 시간은 0 이상이어야 합니다.');
        }

        // start_time과 end_time 길이 검증
        if (this.start_time && this.start_time.length > 50) {
            throw new BadRequestException('근무 시작 시간은 50자 이하여야 합니다.');
        }

        if (this.end_time && this.end_time.length > 50) {
            throw new BadRequestException('근무 종료 시간은 50자 이하여야 합니다.');
        }
    }

    /**
     * 논리적 일관성 검증
     */
    private validateLogicalConsistency(): void {
        // start_time과 end_time이 모두 있으면 시간 계산
        if (this.start_time && this.end_time && this.date) {
            this.근무시간계산한다();
        }
    }

    /**
     * 시수를 생성한다
     */
    constructor(
        assigned_project_id: string,
        date: string,
        start_time?: string,
        end_time?: string,
        work_minutes: number = 0,
        note?: string,
    ) {
        super();
        this.assigned_project_id = assigned_project_id;
        this.date = date;
        this.start_time = start_time || null;
        this.end_time = end_time || null;
        this.work_minutes = work_minutes;
        this.note = note || null;
        this.validateInvariants();
    }

    /**
     * 시수 정보를 업데이트한다
     */
    업데이트한다(start_time?: string, end_time?: string, work_minutes?: number, note?: string): void {
        if (start_time !== undefined) {
            this.start_time = start_time;
        }
        if (end_time !== undefined) {
            this.end_time = end_time;
        }
        if (work_minutes !== undefined) {
            this.work_minutes = work_minutes;
        }
        if (note !== undefined) {
            this.note = note;
        }
        this.validateInvariants();
    }

    /**
     * 근무 시간 설정 (시간 단위를 분으로 변환)
     */
    근무시간설정한다(hours: number): void {
        this.work_minutes = Math.round(hours * 60);
    }

    /**
     * 근무 시간 조회 (시간 단위)
     */
    근무시간조회한다(): number {
        return this.work_minutes / 60;
    }

    /**
     * 근무 시간 계산 (시작 시간과 종료 시간으로부터 자동 계산)
     * 12:00~13:00 점심 시간은 분 계산에서 제외한다.
     */
    근무시간계산한다(): void {
        if (this.start_time && this.end_time && this.date) {
            try {
                const startDateTime = new Date(`${this.date}T${this.start_time}`);
                const endDateTime = new Date(`${this.date}T${this.end_time}`);
                const lunchStart = new Date(`${this.date}T12:00`);
                const lunchEnd = new Date(`${this.date}T13:00`);

                let totalMinutes = Math.floor((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));
                const overlapStart = startDateTime < lunchStart ? lunchStart : startDateTime;
                const overlapEnd = endDateTime > lunchEnd ? lunchEnd : endDateTime;
                if (overlapStart < overlapEnd) {
                    const lunchOverlapMinutes = Math.floor(
                        (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60),
                    );
                    totalMinutes -= lunchOverlapMinutes;
                }
                this.work_minutes = Math.max(0, totalMinutes);
            } catch (error) {
                // 시간 형식이 잘못된 경우 계산하지 않음
                this.work_minutes = 0;
            }
        }
    }

    /**
     * 근무 시간 설정 (시작 시간과 종료 시간으로 설정)
     */
    근무시간과시간설정한다(start_time: string, end_time: string): void {
        this.start_time = start_time;
        this.end_time = end_time;
        this.근무시간계산한다();
    }

    /**
     * DTO로 변환한다
     */
    DTO변환한다(): WorkHoursDTO {
        return {
            id: this.id,
            assignedProjectId: this.assigned_project_id,
            date: this.date,
            startTime: this.start_time,
            endTime: this.end_time,
            workMinutes: this.work_minutes,
            note: this.note,
            createdAt: this.created_at,
            updatedAt: this.updated_at,
            deletedAt: this.deleted_at,
            createdBy: this.created_by,
            updatedBy: this.updated_by,
            version: this.version,
        };
    }
}
