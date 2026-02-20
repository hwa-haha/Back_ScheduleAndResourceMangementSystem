import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SaveReflectedDataCommand } from './save-reflected-data.command';
import { EventInfo } from '../../../../../domain/event-info/event-info.entity';
import { UsedAttendance } from '../../../../../domain/used-attendance/used-attendance.entity';

/**
 * 반영 데이터 저장 핸들러
 *
 * 파일 내용 반영으로 가공된 이벤트 정보와 근태 사용 내역을 저장합니다.
 */
@CommandHandler(SaveReflectedDataCommand)
export class SaveReflectedDataHandler implements ICommandHandler<SaveReflectedDataCommand, void> {
    private readonly logger = new Logger(SaveReflectedDataHandler.name);

    constructor(private readonly dataSource: DataSource) {}

    async execute(command: SaveReflectedDataCommand): Promise<void> {
        const { eventInfos, usedAttendances } = command.data;

        return await this.dataSource.transaction(async (manager) => {
            await this.반영데이터를저장한다(eventInfos, usedAttendances, manager);
        });
    }

    /**
     * 반영 데이터를 저장한다
     */
    private async 반영데이터를저장한다(
        eventInfos: Partial<EventInfo>[],
        usedAttendances: Partial<UsedAttendance>[],
        manager: any,
    ): Promise<void> {
        // 1. 이벤트 정보 저장
        // (employee_number, event_time)이 타입/공백 차이로 JS에서는 다르지만 DB에서는 동일해지는 중복 제거
        if (eventInfos.length > 0) {
            const deduplicated = this.이벤트정보중복제거한다(eventInfos);
            const EVENT_BATCH_SIZE = 10000;
            for (let i = 0; i < deduplicated.length; i += EVENT_BATCH_SIZE) {
                const batch = deduplicated.slice(i, i + EVENT_BATCH_SIZE);
                await manager.createQueryBuilder().insert().into(EventInfo).values(batch).execute();
            }
            this.logger.log(
                `이벤트 정보 저장 완료: ${deduplicated.length}건${deduplicated.length !== eventInfos.length ? ` (중복 제거: ${eventInfos.length - deduplicated.length}건)` : ''}`,
            );
        }

        // 2. 근태 사용 내역 저장
        // (employee_id, used_at, attendance_type_id) 복합 키 기준 중복 제거
        if (usedAttendances.length > 0) {
            const deduplicated = this.근태사용내역중복제거한다(usedAttendances);
            const ATTENDANCE_BATCH_SIZE = 1000;
            for (let i = 0; i < deduplicated.length; i += ATTENDANCE_BATCH_SIZE) {
                const batch = deduplicated.slice(i, i + ATTENDANCE_BATCH_SIZE);
                await manager.createQueryBuilder().insert().into(UsedAttendance).values(batch).execute();
            }
            this.logger.log(
                `근태 사용 내역 저장 완료: ${deduplicated.length}건${deduplicated.length !== usedAttendances.length ? ` (중복 제거: ${usedAttendances.length - deduplicated.length}건)` : ''}`,
            );
        }
    }

    /**
     * (employee_number, event_time) 복합 키 기준으로 중복을 제거한다.
     * DB에서는 동일한데 JS에서는 다르게 들어올 수 있는 경우(숫자/문자, 공백, 날짜 포맷 등)를
     * 정규화한 키로 비교하여 제거한다.
     */
    private 이벤트정보중복제거한다(eventInfos: Partial<EventInfo>[]): Partial<EventInfo>[] {
        const seen = new Set<string>();
        return eventInfos.filter((event) => {
            const emp = event.employee_number != null ? String(event.employee_number).trim() : '';
            const time = event.event_time != null ? String(event.event_time).trim().replace(/\s+/g, ' ') : '';
            const key = `${emp}\0${time}`;
            if (seen.has(key)) {
                this.logger.warn(
                    `이벤트 정보 중복 제거: employee_number=${event.employee_number}, event_time=${event.event_time}`,
                );
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * (employee_id, used_at, attendance_type_id) 복합 키 기준으로 중복을 제거한다.
     * DB에서는 동일한데 JS에서는 다르게 들어올 수 있는 경우를 정규화한 키로 비교하여 제거한다.
     */
    private 근태사용내역중복제거한다(usedAttendances: Partial<UsedAttendance>[]): Partial<UsedAttendance>[] {
        const seen = new Set<string>();
        return usedAttendances.filter((att) => {
            const empId = att.employee_id != null ? String(att.employee_id).trim() : '';
            const usedAt = att.used_at != null ? String(att.used_at).trim().replace(/\s+/g, ' ') : '';
            const typeId = att.attendance_type_id != null ? String(att.attendance_type_id).trim() : '';
            const key = `${empId}\0${usedAt}\0${typeId}`;
            if (seen.has(key)) {
                this.logger.warn(
                    `근태 사용 내역 중복 제거: employee_id=${att.employee_id}, used_at=${att.used_at}, attendance_type_id=${att.attendance_type_id}`,
                );
                return false;
            }
            seen.add(key);
            return true;
        });
    }
}
