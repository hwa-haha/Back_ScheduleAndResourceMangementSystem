import { Entity, Column, Index } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { BaseEntity } from '@libs/database/base/base.entity';
import { EventInfoDTO } from './event-info.types';

/**
 * 이벤트 정보 엔티티
 */
@Entity('event_info')
@Index(['employee_number', 'yyyymmdd'])
@Index(['employee_number', 'event_time'], { unique: true })
export class EventInfo extends BaseEntity<EventInfoDTO> {
    // BaseEntity에서 id, created_at, updated_at, deleted_at, created_by, updated_by, version 제공

    @Column({
        name: 'employee_name',
        comment: '직원명',
    })
    employee_name: string;

    @Column({
        name: 'employee_number',
        nullable: true,
        comment: '직원번호',
    })
    @Index()
    employee_number: string | null;

    @Column({
        name: 'event_time',
        comment: '이벤트 시간',
    })
    @Index()
    event_time: string;

    @Column({
        name: 'yyyymmdd',
        comment: '날짜 (YYYYMMDD)',
    })
    yyyymmdd: string;

    @Column({
        name: 'hhmmss',
        comment: '시간 (HHMMSS)',
    })
    hhmmss: string;

    /**
     * 이벤트 정보 불변성 검증
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
        if (!this.employee_name || !this.event_time || !this.yyyymmdd || !this.hhmmss) {
            return;
        }

        if (this.employee_name.trim().length === 0) {
            throw new BadRequestException('직원명은 필수입니다.');
        }

        if (this.event_time.trim().length === 0) {
            throw new BadRequestException('이벤트 시간은 필수입니다.');
        }

        if (this.yyyymmdd.trim().length === 0) {
            throw new BadRequestException('날짜는 필수입니다.');
        }

        if (this.hhmmss.trim().length === 0) {
            throw new BadRequestException('시간은 필수입니다.');
        }
    }

    /**
     * 데이터 형식 검증
     */
    private validateDataFormat(): void {
        if (!this.event_time || !this.yyyymmdd || !this.hhmmss) {
            return;
        }
        // 추가적인 형식 검증이 필요한 경우 여기에 구현
        if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(this.event_time)) {
            throw new BadRequestException('이벤트 시간은 YYYY-MM-DD HH:MM:SS 형식이어야 합니다.');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(this.yyyymmdd)) {       
            throw new BadRequestException('날짜는 YYYY-MM-DD 형식이어야 합니다.');
        }
        if (!/^\d{2}:\d{2}:\d{2}$/.test(this.hhmmss)) {
            throw new BadRequestException('시간은 HH:MM:SS 형식이어야 합니다.');
        }
    }

    /**
     * 논리적 일관성 검증
     */
    private validateLogicalConsistency(): void {
        // 추가적인 논리적 검증이 필요한 경우 여기에 구현
    }

    /**
     * 이벤트 정보를 생성한다
     */
    constructor(employee_name: string, event_time: string, yyyymmdd: string, hhmmss: string, employee_number?: string) {
        super();
        this.employee_name = employee_name;
        this.event_time = event_time;
        this.yyyymmdd = yyyymmdd;
        this.hhmmss = hhmmss;
        this.employee_number = employee_number || null;
        this.validateInvariants();
    }

    /**
     * 이벤트 정보를 업데이트한다
     */
    업데이트한다(
        employee_name?: string,
        employee_number?: string,
        event_time?: string,
        yyyymmdd?: string,
        hhmmss?: string,
    ): void {
        if (employee_name !== undefined) {
            this.employee_name = employee_name;
        }
        if (employee_number !== undefined) {
            this.employee_number = employee_number;
        }
        if (event_time !== undefined) {
            this.event_time = event_time;
        }
        if (yyyymmdd !== undefined) {
            this.yyyymmdd = yyyymmdd;
        }
        if (hhmmss !== undefined) {
            this.hhmmss = hhmmss;
        }
        this.validateInvariants();
    }

    /**
     * DTO로 변환한다
     */
    DTO변환한다(): EventInfoDTO {
        return {
            id: this.id,
            employeeName: this.employee_name,
            employeeNumber: this.employee_number,
            eventTime: this.event_time,
            yyyymmdd: this.yyyymmdd,
            hhmmss: this.hhmmss,
            createdAt: this.created_at,
            updatedAt: this.updated_at,
            deletedAt: this.deleted_at,
            createdBy: this.created_by,
            updatedBy: this.updated_by,
            version: this.version,
        };
    }

    /**
     * 이벤트 정보로부터 엔티티를 생성한다 (정적 팩토리 메서드)
     */
    static 이벤트정보로부터생성한다(eventInfo: any): EventInfo {
        const entity = new EventInfo(
            eventInfo.employeeName || eventInfo.employee_name,
            eventInfo.eventTime || eventInfo.event_time,
            eventInfo.yyyymmdd,
            eventInfo.hhmmss,
            eventInfo.employeeNumber || eventInfo.employee_number,
        );
        return entity;
    }

    /**
     * 이벤트 정보 배열로부터 엔티티 배열을 생성한다 (정적 팩토리 메서드)
     */
    static 이벤트정보배열로부터생성한다(eventInfoArray: any[]): Partial<EventInfo>[] {
        return eventInfoArray.map((eventInfo) => {
            return {
                employee_name: eventInfo.employeeName || eventInfo.employee_name,
                employee_number: eventInfo.employeeNumber || eventInfo.employee_number,
                event_time: eventInfo.eventTime || eventInfo.event_time,
                yyyymmdd: eventInfo.yyyymmdd,
                hhmmss: eventInfo.hhmmss,
            };
        });
    }
}
