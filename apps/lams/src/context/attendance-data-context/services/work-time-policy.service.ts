import { Injectable } from '@nestjs/common';
import { UsedAttendance } from '../../../domain/used-attendance/used-attendance.entity';

/**
 * 정상근무 범위 정책 서비스
 *
 * 정상근무 시간 범위, 지각/조퇴 판정, 근태 인정 여부 등의 정책을 관리합니다.
 * 정책 변경 시 이 서비스만 수정하면 됩니다.
 */
@Injectable()
export class WorkTimePolicyService {
    /**
     * 정상근무 시작 시간 (기본값: 09:00)
     */
    private readonly NORMAL_WORK_START_TIME = '09:00:00';

    /**
     * 정상근무 종료 시간 (기본값: 18:00)
     */
    private readonly NORMAL_WORK_END_TIME = '18:00:00';

    /**
     * 정상근무 시작 시간을 반환한다
     */
    getNormalWorkStartTime(): string {
        return this.NORMAL_WORK_START_TIME;
    }

    /**
     * 정상근무 종료 시간을 반환한다
     */
    getNormalWorkEndTime(): string {
        return this.NORMAL_WORK_END_TIME;
    }

    /**
     * 근태가 정상 근무로 인정되는지 확인한다
     */
    isRecognizedWorkTime(attendanceType: any): boolean {
        return attendanceType?.is_recognized_work_time === true;
    }

    /**
     * 근태가 오전 근무를 인정하는지 확인한다
     *
     * @param attendanceType 근태 유형
     * @returns 오전 근무 인정 여부
     */
    isMorningRecognized(attendanceType: any): boolean {
        if (!this.isRecognizedWorkTime(attendanceType)) {
            return false;
        }
        const startTime = this.workTimeToHHmmss(attendanceType?.startWorkTime);
        // startWorkTime이 없거나 정상근무 시작 시간 이전/이후를 커버하면 오전 인정
        return !startTime || startTime <= this.NORMAL_WORK_START_TIME;
    }

    /**
     * 근태가 오후 근무를 인정하는지 확인한다
     *
     * @param attendanceType 근태 유형
     * @returns 오후 근무 인정 여부
     */
    isAfternoonRecognized(attendanceType: any): boolean {
        if (!this.isRecognizedWorkTime(attendanceType)) {
            return false;
        }
        const endTime = this.workTimeToHHmmss(attendanceType?.endWorkTime);
        // endWorkTime이 없거나 정상근무 종료 시간 이후를 커버하면 오후 인정
        return !endTime || endTime >= this.NORMAL_WORK_END_TIME;
    }

    /**
     * 근태가 하루 종일 근무를 인정하는지 확인한다
     *
     * @param attendanceType 근태 유형
     * @returns 하루 종일 인정 여부
     */
    isFullDayRecognized(attendanceType: any): boolean {
        if (!this.isRecognizedWorkTime(attendanceType)) {
            return false;
        }
        const startTime = this.workTimeToHHmmss(attendanceType?.startWorkTime);
        const endTime = this.workTimeToHHmmss(attendanceType?.endWorkTime);
        // startWorkTime과 endWorkTime이 모두 없거나, 전체 시간대를 커버하면 하루 종일
        return (
            (!startTime || startTime <= this.NORMAL_WORK_START_TIME) &&
            (!endTime || endTime >= this.NORMAL_WORK_END_TIME)
        );
    }

    /**
     * 근태 목록에서 오전 근무를 인정하는 근태가 있는지 확인한다
     *
     * @param attendances 근태 목록
     * @returns 오전 근무 인정 여부
     */
    hasMorningRecognized(attendances: UsedAttendance[]): boolean {
        return attendances.some((ua) => this.isMorningRecognized(ua.attendanceType));
    }

    /**
     * 근태 목록에서 오후 근무를 인정하는 근태가 있는지 확인한다
     *
     * @param attendances 근태 목록
     * @returns 오후 근무 인정 여부
     */
    hasAfternoonRecognized(attendances: UsedAttendance[]): boolean {
        return attendances.some((ua) => this.isAfternoonRecognized(ua.attendanceType));
    }

    /**
     * 근태 목록에서 정상 근무로 인정되는 근태가 있는지 확인한다
     *
     * @param attendances 근태 목록
     * @returns 정상 근무 인정 여부
     */
    hasRecognizedWorkTime(attendances: UsedAttendance[]): boolean {
        return attendances.some((ua) => this.isRecognizedWorkTime(ua.attendanceType));
    }

    /**
     * 근태 목록에서 하루 종일 근무를 인정하는 근태가 있는지 확인한다
     *
     * @param attendances 근태 목록
     * @returns 하루 종일 인정 여부
     */
    hasFullDayRecognized(attendances: UsedAttendance[]): boolean {
        return attendances.some((ua) => this.isFullDayRecognized(ua.attendanceType));
    }

    /**
     * 특정 날짜의 정상근무 시작 시간을 반환한다
     *
     * 커스텀 시간이 있으면 우선 사용, 없으면 기본값 사용
     *
     * @param date 날짜 (yyyy-MM-dd)
     * @param workTimeOverride 해당 날짜의 커스텀 시간 (선택)
     * @returns 정상근무 시작 시간 (HH:MM:SS)
     */
    getWorkStartTime(date: string, workTimeOverride?: { startWorkTime: string | null } | null): string {
        if (workTimeOverride?.startWorkTime) {
            return workTimeOverride.startWorkTime;
        }
        return this.NORMAL_WORK_START_TIME;
    }

    /**
     * 특정 날짜의 정상근무 종료 시간을 반환한다
     *
     * 커스텀 시간이 있으면 우선 사용, 없으면 기본값 사용
     *
     * @param date 날짜 (yyyy-MM-dd)
     * @param workTimeOverride 해당 날짜의 커스텀 시간 (선택)
     * @returns 정상근무 종료 시간 (HH:MM:SS)
     */
    getWorkEndTime(date: string, workTimeOverride?: { endWorkTime: string | null } | null): string {
        if (workTimeOverride?.endWorkTime) {
            return workTimeOverride.endWorkTime;
        }
        return this.NORMAL_WORK_END_TIME;
    }

    /**
     * 지각 여부를 판정한다
     *
     * @param enterTime 출근 시간 (HHMMSS 형식)
     * @param date 날짜 (yyyy-MM-dd)
     * @param hasMorningRecognized 오전 근무 인정 여부
     * @param isHoliday 공휴일 여부
     * @param isBeforeHireDate 입사일 이전 여부
     * @param isAfterTerminationDate 퇴사일 이후 여부
     * @param workTimeOverride 해당 날짜의 커스텀 시간 (선택)
     * @returns 지각 여부
     */
    isLate(
        enterTime: string,
        date: string,
        hasMorningRecognized: boolean,
        isHoliday: boolean,
        isBeforeHireDate: boolean,
        isAfterTerminationDate: boolean,
        workTimeOverride?: { startWorkTime: string | null } | null,
    ): boolean {
        // 입사일 이전, 퇴사일 이후, 공휴일은 지각 아님
        if (isBeforeHireDate || isAfterTerminationDate || isHoliday) {
            return false;
        }

        // HHMMSS 형식을 HH:MM:SS 형식으로 변환하여 비교
        const enterTimeFormatted = this.HHMMSS를HHMMSS로변환(enterTime);

        // 오전 근무가 인정되면 workStartTime을 14시로 설정
        const workStartTime = hasMorningRecognized ? '14:00:00' : this.getWorkStartTime(date, workTimeOverride);

        return enterTimeFormatted > workStartTime;
    }

    /**
     * 조퇴 여부를 판정한다
     *
     * @param leaveTime 퇴근 시간 (HHMMSS 형식)
     * @param date 날짜 (yyyy-MM-dd)
     * @param hasAfternoonRecognized 오후 근무 인정 여부
     * @param isHoliday 공휴일 여부
     * @param isBeforeHireDate 입사일 이전 여부
     * @param isAfterTerminationDate 퇴사일 이후 여부
     * @param workTimeOverride 해당 날짜의 커스텀 시간 (선택)
     * @returns 조퇴 여부
     */
    isEarlyLeave(
        leaveTime: string,
        date: string,
        hasAfternoonRecognized: boolean,
        isHoliday: boolean,
        isBeforeHireDate: boolean,
        isAfterTerminationDate: boolean,
        workTimeOverride?: { endWorkTime: string | null } | null,
    ): boolean {
        // 입사일 이전, 퇴사일 이후, 공휴일은 조퇴 아님
        if (isBeforeHireDate || isAfterTerminationDate || isHoliday) {
            return false;
        }

        // HHMMSS 형식을 HH:MM:SS 형식으로 변환하여 비교
        const leaveTimeFormatted = this.HHMMSS를HHMMSS로변환(leaveTime);
        // 오후 근무가 인정되면 workEndTime을 14시로 설정
        const workEndTime = hasAfternoonRecognized ? '14:00:00' : this.getWorkEndTime(date, workTimeOverride);
        console.log('workEndTime', workEndTime);
        console.log('leaveTimeFormatted', leaveTimeFormatted);
        return leaveTimeFormatted < workEndTime;
    }

    /**
     * HHMMSS 형식을 HH:MM:SS 형식으로 변환한다
     */
    private HHMMSS를HHMMSS로변환(hhmmss: string): string {
        if (!hhmmss || hhmmss.length !== 6) {
            return hhmmss;
        }
        return `${hhmmss.substring(0, 2)}:${hhmmss.substring(2, 4)}:${hhmmss.substring(4, 6)}`;
    }

    /**
     * attendanceType의 work time 값을 HH:mm:ss 형식으로 정규화한다.
     * "09:00", "09:00:00", "090000" 등 다양한 입력을 HH:mm:ss로 통일하여 비교에 사용한다.
     */
    private workTimeToHHmmss(time: string | undefined | null): string {
        if (time == null || time === '') {
            return '';
        }
        const trimmed = time.trim();
        if (!trimmed) return '';

        const digits = trimmed.replace(/\D/g, '');
        if (digits.length >= 6) {
            return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:${digits.slice(4, 6)}`;
        }
        if (digits.length === 4) {
            return `${digits.slice(0, 2)}:${digits.slice(2, 4)}:00`;
        }
        if (digits.length === 5) {
            return `0${digits.slice(0, 1)}:${digits.slice(1, 3)}:${digits.slice(3, 5)}`;
        }
        // 이미 HH:mm 또는 HH:mm:ss 형태인 경우
        const parts = trimmed.split(':');
        if (parts.length >= 2) {
            const hh = parts[0].padStart(2, '0');
            const mm = parts[1].padStart(2, '0');
            const ss = (parts[2] ?? '0').padStart(2, '0');
            return `${hh}:${mm}:${ss}`;
        }
        return trimmed;
    }
}
