import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { DailyEventSummary } from '../../../domain/daily-event-summary/daily-event-summary.entity';
import { Employee } from '@libs/modules/employee/employee.entity';
import { DomainHolidayInfoService } from '../../../domain/holiday-info/holiday-info.service';
import { DomainWorkTimeOverrideService } from '../../../domain/work-time-override/work-time-override.service';
import { WorkTimePolicyService } from './work-time-policy.service';
import { format } from 'date-fns';

/**
 * 일간 요약 판정 서비스
 *
 * 결근, 지각, 조퇴 판정 로직을 공통으로 제공합니다.
 */
@Injectable()
export class DailySummaryJudgmentService {
    constructor(
        private readonly holidayInfoService: DomainHolidayInfoService,
        private readonly workTimeOverrideService: DomainWorkTimeOverrideService,
        private readonly workTimePolicyService: WorkTimePolicyService,
    ) {}

    /**
     * 결근, 지각, 조퇴 판정을 수행한다
     *
     * @param dailySummary 일간 요약 엔티티
     * @param realEnter 실제 출근 시간 (HH:MM:SS 형식 또는 null)
     * @param realLeave 실제 퇴근 시간 (HH:MM:SS 형식 또는 null)
     * @param usedAttendances 사용된 근태 목록
     * @param manager EntityManager (트랜잭션 지원)
     * @returns 판정 결과
     */
    async 결근지각조퇴판정한다(
        dailySummary: DailyEventSummary,
        realEnter: string | null,
        realLeave: string | null,
        usedAttendances:
            | Array<{
                  attendanceTypeId: string;
                  title: string;
                  workTime?: number;
                  isRecognizedWorkTime?: boolean;
                  startWorkTime?: string | null;
                  endWorkTime?: string | null;
                  deductedAnnualLeave?: number;
              }>
            | null
            | undefined,
        manager?: EntityManager,
    ): Promise<{
        isAbsent: boolean;
        isLate: boolean;
        isEarlyLeave: boolean;
        hasAttendanceConflict: boolean;
        hasAttendanceOverlap: boolean;
    }> {
        // 1. 근태 충돌/겹침 판정 (조기 반환 여부와 관계없이 항상 수행)
        const { hasAttendanceConflict, hasAttendanceOverlap } = this.근태충돌겹침판정한다(usedAttendances);

        // 2. 정상 근무로 인정되는 근태만 필터링
        // used_attendances를 UsedAttendance 형태로 변환
        const recognizedAttendances =
            usedAttendances
                ?.filter((ua) => ua.isRecognizedWorkTime)
                .map(
                    (ua) =>
                        ({
                            attendanceType: {
                                work_time: ua.workTime,
                                start_work_time: ua.startWorkTime,
                                end_work_time: ua.endWorkTime,
                                is_recognized_work_time: ua.isRecognizedWorkTime,
                                startWorkTime: ua.startWorkTime,
                                endWorkTime: ua.endWorkTime,
                            },
                        }) as any,
                ) || [];

        // 3. 종일 인정 근태만 있는 경우: 지각/조퇴/결근 판정 생략 (출퇴근 인정시간이 종일이면 판정 불필요)
        const singleRecognized = recognizedAttendances.length === 1;
        const isFullDayRecognized =
            singleRecognized && this.workTimePolicyService.isFullDayRecognized(recognizedAttendances[0].attendanceType);
        if (isFullDayRecognized) {
            return {
                isAbsent: false,
                isLate: false,
                isEarlyLeave: false,
                hasAttendanceConflict,
                hasAttendanceOverlap,
            };
        }

        const dateStr = dailySummary.date;

        // 4. 직원 정보 조회 (입사일, 퇴사일 확인)
        let isBeforeHireDate = false;
        let isAfterTerminationDate = false;
        if (dailySummary.employee_id && manager) {
            const employee = await manager.findOne(Employee, {
                where: { id: dailySummary.employee_id },
            });
            if (employee) {
                const hireDate = employee.hireDate ? format(new Date(employee.hireDate), 'yyyy-MM-dd') : null;
                const terminationDate =
                    employee.status === '퇴사' && employee.terminationDate
                        ? format(new Date(employee.terminationDate), 'yyyy-MM-dd')
                        : null;
                isBeforeHireDate = hireDate ? dateStr < hireDate : false;
                isAfterTerminationDate = terminationDate ? dateStr > terminationDate : false;
            }
        }

        // 5. 공휴일 및 주말 여부 확인
        // 휴일 데이터를 조회하여 확인 (최초 생성 후 휴일이 변동될 수 있음)
        const holidays = await this.holidayInfoService.목록조회한다();
        const holidaySet = new Set(holidays.map((h) => h.holidayDate));
        const isHoliday = holidaySet.has(dateStr) || this.주말여부확인(dateStr);

        // 6. 지각/조퇴 판정
        let isLate = false;
        let isEarlyLeave = false;

        if (realEnter && realLeave) {
            const hasMorningRecognized = this.workTimePolicyService.hasMorningRecognized(recognizedAttendances as any);
            const hasAfternoonRecognized = this.workTimePolicyService.hasAfternoonRecognized(
                recognizedAttendances as any,
            );

            // HH:MM:SS 형식을 HHMMSS 형식으로 변환
            const enterHHMMSS = this.HHMMSS를HHMMSS로변환(realEnter);
            const leaveHHMMSS = this.HHMMSS를HHMMSS로변환(realLeave);

            // 해당 날짜의 커스텀 시간 조회
            const workTimeOverride = await this.workTimeOverrideService.날짜로조회한다(dateStr, manager);

            isLate = this.workTimePolicyService.isLate(
                enterHHMMSS,
                dateStr,
                hasMorningRecognized,
                isHoliday,
                isBeforeHireDate,
                isAfterTerminationDate,
                workTimeOverride,
            );

            isEarlyLeave = this.workTimePolicyService.isEarlyLeave(
                leaveHHMMSS,
                dateStr,
                hasAfternoonRecognized,
                isHoliday,
                isBeforeHireDate,
                isAfterTerminationDate,
                workTimeOverride,
            );
        }

        // 7. 결근 판정
        let isAbsent = false;
        if (isBeforeHireDate || isAfterTerminationDate) {
            isAbsent = false;
        } else if (isHoliday) {
            isAbsent = false;
        } else if (recognizedAttendances.length > 0 || (realEnter && realLeave)) {
            // 인정되는 근태가 있거나 출입 기록이 있으면 결근 아님
            isAbsent = false;
        } else if (isLate || isEarlyLeave) {
            isAbsent = false;
        } else {
            isAbsent = true;
        }

        return {
            isAbsent,
            isLate,
            isEarlyLeave,
            hasAttendanceConflict,
            hasAttendanceOverlap,
        };
    }

    /**
     * 근태 충돌/겹침 판정을 수행한다
     *
     * 시간 범위가 있는 근태가 2건 이상일 때, 모든 쌍에 대해 시간 범위만 비교하여:
     * - 시간 범위가 완전히 일치하면 has_attendance_conflict = true
     * - 시간 범위가 일부만 겹치면 has_attendance_overlap = true
     */
    private 근태충돌겹침판정한다(
        usedAttendances:
            | Array<{
                  attendanceTypeId: string;
                  title: string;
                  workTime?: number;
                  isRecognizedWorkTime?: boolean;
                  startWorkTime?: string | null;
                  endWorkTime?: string | null;
                  deductedAnnualLeave?: number;
              }>
            | null
            | undefined,
    ): {
        hasAttendanceConflict: boolean;
        hasAttendanceOverlap: boolean;
    } {
        if (!usedAttendances || usedAttendances.length < 2) {
            return {
                hasAttendanceConflict: false,
                hasAttendanceOverlap: false,
            };
        }

        // 시간 범위가 있는 근태만 필터링
        const attendancesWithTimeRange = usedAttendances.filter((ua) => ua.startWorkTime && ua.endWorkTime);

        if (attendancesWithTimeRange.length < 2) {
            return {
                hasAttendanceConflict: false,
                hasAttendanceOverlap: false,
            };
        }

        // 모든 근태유형에 대해 서로 다른 두 건씩 시간 범위만 비교
        let hasConflict = false;
        let hasOverlap = false;

        for (let i = 0; i < attendancesWithTimeRange.length; i++) {
            for (let j = i + 1; j < attendancesWithTimeRange.length; j++) {
                const att1 = attendancesWithTimeRange[i];
                const att2 = attendancesWithTimeRange[j];

                const timeRange1 = {
                    start: this.시간을분으로변환(att1.startWorkTime!),
                    end: this.시간을분으로변환(att1.endWorkTime!),
                };
                const timeRange2 = {
                    start: this.시간을분으로변환(att2.startWorkTime!),
                    end: this.시간을분으로변환(att2.endWorkTime!),
                };

                const isConflict = timeRange1.start === timeRange2.start && timeRange1.end === timeRange2.end;
                const isOverlapping = this.시간범위가겹치는가(timeRange1, timeRange2);

                if (isConflict) {
                    hasConflict = true;
                } else if (isOverlapping) {
                    hasOverlap = true;
                }
            }
        }

        return {
            hasAttendanceConflict: hasConflict,
            hasAttendanceOverlap: hasOverlap, // conflict가 있으면 overlap은 false
        };
    }

    /**
     * 시간을 분으로 변환한다 (HH:MM 또는 HH:MM:SS -> 분)
     */
    private 시간을분으로변환(timeStr: string): number {
        const trimmed = typeof timeStr === 'string' ? timeStr.trim() : '';
        if (!trimmed) {
            throw new BadRequestException('시간 값이 비어 있습니다.');
        }
        const parts = trimmed.split(':');
        if (parts.length < 2) {
            throw new BadRequestException(`시간 형식이 올바르지 않습니다. (HH:MM 또는 HH:MM:SS): ${timeStr}`);
        }
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) {
            throw new BadRequestException(`시간을 숫자로 변환할 수 없습니다: ${timeStr}`);
        }
        if (hours < 0 || hours > 24 || minutes < 0 || minutes > 59) {
            throw new BadRequestException(`시간 범위가 올바르지 않습니다. (시 0~24, 분 0~59): ${timeStr}`);
        }
        return hours * 60 + minutes;
    }

    /**
     * 두 시간 범위가 겹치는지 확인한다
     */
    private 시간범위가겹치는가(
        range1: { start: number; end: number },
        range2: { start: number; end: number },
    ): boolean {
        // 완전히 일치하는 경우는 제외 (이미 conflict로 처리됨)
        if (range1.start === range2.start && range1.end === range2.end) {
            return false;
        }

        // 겹치는 경우: range1의 시작이 range2 안에 있거나, range2의 시작이 range1 안에 있음
        return (
            (range1.start >= range2.start && range1.start < range2.end) ||
            (range2.start >= range1.start && range2.start < range1.end)
        );
    }

    /**
     * HH:MM:SS 형식을 HHMMSS 형식으로 변환한다
     */
    private HHMMSS를HHMMSS로변환(hhmmss: string): string {
        if (!hhmmss || hhmmss.length !== 8) {
            return hhmmss;
        }
        // HH:MM:SS -> HHMMSS
        return hhmmss.replace(/:/g, '');
    }

    /**
     * 주말 여부를 확인한다
     */
    private 주말여부확인(dateString: string): boolean {
        const date = new Date(dateString);
        const dayOfWeek = date.getDay();
        // 0: 일요일, 6: 토요일
        return dayOfWeek === 0 || dayOfWeek === 6;
    }
}
