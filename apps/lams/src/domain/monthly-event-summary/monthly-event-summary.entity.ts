import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { BaseEntity } from '@libs/database/base/base.entity';
import { Employee } from '@libs/modules/employee/employee.entity';
import { DailyEventSummary } from '../daily-event-summary/daily-event-summary.entity';
import { MonthlyEventSummaryDTO } from './monthly-event-summary.types';

/**
 * 월간 요약 엔티티
 */
@Entity('monthly_event_summary')
@Index(['employee_id', 'yyyymm'], { unique: true })
export class MonthlyEventSummary extends BaseEntity<MonthlyEventSummaryDTO> {
    // BaseEntity에서 id, created_at, updated_at, deleted_at, created_by, updated_by, version 제공

    @Column({
        name: 'employee_number',
        comment: '사원 번호',
    })
    employee_number: string;

    @Column({ name: 'employee_id', type: 'uuid' })
    employee_id: string;

    /**
     * 직원 엔티티와의 관계
     */
    @ManyToOne(() => Employee, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @Column({
        name: 'employee_name',
        nullable: true,
        comment: '사원 이름',
    })
    employee_name: string | null;

    @Column({
        name: 'yyyymm',
        comment: '해당 월의 첫 날 (YYYY-MM)',
    })
    yyyymm: string;

    @Column({
        name: 'note',
        nullable: true,
        comment: '비고',
    })
    note: string | null;

    @Column({
        name: 'additional_note',
        default: '',
        comment: '월간 근태 요약 노트',
    })
    additional_note: string;

    @Column({
        name: 'work_days_count',
        comment: '근무 일수',
    })
    work_days_count: number;

    @Column('int', {
        name: 'total_workable_time',
        nullable: true,
        comment: '총 업무 가능 시간 (분 단위)',
    })
    total_workable_time: number | null;

    @Column('int', {
        name: 'total_work_time',
        comment: '총 근무 시간 (분 단위)',
    })
    total_work_time: number;

    @Column('float', {
        name: 'avg_work_times',
        comment: '평균 근무 시간 (분 단위)',
    })
    avg_work_times: number;

    @Column('simple-json', {
        name: 'attendance_type_count',
        comment: '근태 유형별 횟수',
    })
    attendance_type_count: Record<string, number>;

    @Column('simple-json', {
        name: 'daily_event_summary',
        nullable: true,
        comment: '일별 이벤트 요약 (JSON 데이터)',
    })
    daily_event_summary: any[] | null;

    /**
     * 일간 요약 엔티티와의 관계 (1:N)
     * 월간 요약에 포함된 일간 요약들
     */
    @OneToMany(() => DailyEventSummary, (dailyEventSummary) => dailyEventSummary.monthlyEventSummary)
    dailyEventSummaries: DailyEventSummary[];

    @Column('simple-json', {
        name: 'weekly_work_time_summary',
        nullable: true,
        comment: '주별 이벤트 요약',
    })
    weekly_work_time_summary: any[] | null;

    @Column('simple-json', {
        name: 'late_details',
        nullable: true,
        comment: '지각 상세정보',
    })
    late_details: any[] | null;

    @Column('simple-json', {
        name: 'absence_details',
        nullable: true,
        comment: '결근 상세정보',
    })
    absence_details: any[] | null;

    @Column('simple-json', {
        name: 'early_leave_details',
        nullable: true,
        comment: '조퇴 상세정보',
    })
    early_leave_details: any[] | null;

    /**
     * 월간 요약 불변성 검증
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
        if (!this.employee_id || !this.yyyymm || !this.employee_number) {
            return;
        }

        if (this.employee_number.trim().length === 0) {
            throw new BadRequestException('사원 번호는 필수입니다.');
        }

        if (this.yyyymm.trim().length === 0) {
            throw new BadRequestException('연월은 필수입니다.');
        }

        this.validateUuidFormat(this.employee_id, 'employee_id');
    }

    /**
     * 데이터 형식 검증
     */
    private validateDataFormat(): void {
        // TypeORM 메타데이터 검증 단계에서는 검증을 건너뜀
        if (this.work_days_count === undefined || this.total_work_time === undefined) {
            return;
        }

        // work_days_count는 0 이상이어야 함
        if (this.work_days_count < 0) {
            throw new BadRequestException('근무 일수는 0 이상이어야 합니다.');
        }

        // total_work_time은 0 이상이어야 함
        if (this.total_work_time < 0) {
            throw new BadRequestException('총 근무 시간은 0 이상이어야 합니다.');
        }

        // total_workable_time은 0 이상이어야 함
        if (
            this.total_workable_time !== null &&
            this.total_workable_time !== undefined &&
            this.total_workable_time < 0
        ) {
            throw new BadRequestException('총 업무 가능 시간은 0 이상이어야 합니다.');
        }
    }

    /**
     * 논리적 일관성 검증
     */
    private validateLogicalConsistency(): void {
        // 추가적인 논리적 검증이 필요한 경우 여기에 구현
    }

    /**
     * 월간 요약을 생성한다
     */
    constructor(
        employee_number: string,
        employee_id: string,
        yyyymm: string,
        work_days_count: number,
        total_work_time: number,
        avg_work_times: number,
        attendance_type_count: Record<string, number>,
        employee_name?: string,
        total_workable_time?: number,
        weekly_work_time_summary?: any[],
        daily_event_summary?: any[],
        late_details?: any[],
        absence_details?: any[],
        early_leave_details?: any[],
        note?: string,
        additional_note?: string,
    ) {
        super();
        this.employee_number = employee_number;
        this.employee_id = employee_id;
        this.yyyymm = yyyymm;
        this.work_days_count = work_days_count;
        this.total_work_time = total_work_time;
        this.avg_work_times = avg_work_times;
        this.attendance_type_count = attendance_type_count;
        this.employee_name = employee_name || null;
        this.total_workable_time = total_workable_time || null;
        this.weekly_work_time_summary = weekly_work_time_summary || null;
        this.daily_event_summary = daily_event_summary || null;
        this.late_details = late_details || null;
        this.absence_details = absence_details || null;
        this.early_leave_details = early_leave_details || null;
        this.note = note || '';
        this.additional_note = additional_note || '';
        this.validateInvariants();
    }

    /**
     * 월간 요약 정보를 업데이트한다
     */
    업데이트한다(
        employee_number?: string,
        employee_name?: string,
        work_days_count?: number,
        total_workable_time?: number,
        total_work_time?: number,
        avg_work_times?: number,
        attendance_type_count?: Record<string, number>,
        weekly_work_time_summary?: any[],
        daily_event_summary?: any[],
        late_details?: any[],
        absence_details?: any[],
        early_leave_details?: any[],
        note?: string,
        additional_note?: string,
    ): void {
        if (employee_number !== undefined) {
            this.employee_number = employee_number;
        }
        if (employee_name !== undefined) {
            this.employee_name = employee_name;
        }
        if (work_days_count !== undefined) {
            this.work_days_count = work_days_count;
        }
        if (total_workable_time !== undefined) {
            this.total_workable_time = total_workable_time;
        }
        if (total_work_time !== undefined) {
            this.total_work_time = total_work_time;
        }
        if (avg_work_times !== undefined) {
            this.avg_work_times = avg_work_times;
        }
        if (attendance_type_count !== undefined) {
            this.attendance_type_count = attendance_type_count;
        }
        if (weekly_work_time_summary !== undefined) {
            this.weekly_work_time_summary = weekly_work_time_summary;
        }
        if (daily_event_summary !== undefined) {
            this.daily_event_summary = daily_event_summary;
        }
        if (late_details !== undefined) {
            this.late_details = late_details;
        }
        if (absence_details !== undefined) {
            this.absence_details = absence_details;
        }
        if (early_leave_details !== undefined) {
            this.early_leave_details = early_leave_details;
        }
        if (note !== undefined) {
            this.note = note;
        }
        if (additional_note !== undefined) {
            this.additional_note = additional_note;
        }
        this.validateInvariants();
    }

    /**
     * 요약 정보를 업데이트한다 (기존 메서드 호환성 유지)
     */
    요약업데이트한다(params: {
        employeeInfo: { employeeNumber: string; employeeId: string; employeeName: string };
        yyyymm: string;
        totalWorkableTime: number;
        totalWorkTime: number;
        workDaysCount: number;
        avgWorkTimes: number;
        attendanceTypeCount: Record<string, number>;
        weeklyWorkTimeSummary: any[];
        dailyEventSummary: any[];
        lateDetails: any[];
        absenceDetails: any[];
        earlyLeaveDetails: any[];
        note: string;
    }): void {
        this.employee_number = params.employeeInfo.employeeNumber;
        this.employee_id = params.employeeInfo.employeeId;
        this.employee_name = params.employeeInfo.employeeName;
        this.yyyymm = params.yyyymm;
        this.total_workable_time = params.totalWorkableTime;
        this.total_work_time = params.totalWorkTime;
        this.work_days_count = params.workDaysCount;
        this.avg_work_times = params.avgWorkTimes;
        this.attendance_type_count = params.attendanceTypeCount;
        this.weekly_work_time_summary = params.weeklyWorkTimeSummary;
        this.daily_event_summary = params.dailyEventSummary;
        this.late_details = params.lateDetails;
        this.absence_details = params.absenceDetails;
        this.early_leave_details = params.earlyLeaveDetails;
        this.note = params.note;
        this.validateInvariants();
    }

    /**
     * DTO로 변환한다
     */
    DTO변환한다(): MonthlyEventSummaryDTO {
        return {
            id: this.id,
            employeeNumber: this.employee_number,
            employeeId: this.employee_id,
            employeeName: this.employee_name,
            yyyymm: this.yyyymm,
            note: this.note,
            additionalNote: this.additional_note,
            workDaysCount: this.work_days_count,
            totalWorkableTime: this.total_workable_time,
            totalWorkTime: this.total_work_time,
            avgWorkTimes: this.avg_work_times,
            attendanceTypeCount: this.attendance_type_count,
            dailyEventSummary: this.daily_event_summary,
            weeklyWorkTimeSummary: this.weekly_work_time_summary,
            lateDetails: this.late_details,
            absenceDetails: this.absence_details,
            earlyLeaveDetails: this.early_leave_details,
            createdAt: this.created_at,
            updatedAt: this.updated_at,
            deletedAt: this.deleted_at,
            createdBy: this.created_by,
            updatedBy: this.updated_by,
            version: this.version,
        };
    }
}
