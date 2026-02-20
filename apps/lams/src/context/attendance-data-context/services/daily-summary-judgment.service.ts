import { Injectable } from '@nestjs/common';
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
        const dateStr = dailySummary.date;

        // 1. 직원 정보 조회 (입사일, 퇴사일 확인)
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

        // 2. 공휴일 및 주말 여부 확인
        // 휴일 데이터를 조회하여 확인 (최초 생성 후 휴일이 변동될 수 있음)
        const holidays = await this.holidayInfoService.목록조회한다();
        const holidaySet = new Set(holidays.map((h) => h.holidayDate));
        const isHoliday = holidaySet.has(dateStr) || this.주말여부확인(dateStr);

        // 3. 정상 근무로 인정되는 근태만 필터링
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

        // 5. 지각/조퇴 판정 (출입 기록이 있는 경우에만)
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

        // 4. 결근 판정
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

        // 6. 근태 충돌/겹침 판정
        const { hasAttendanceConflict, hasAttendanceOverlap } = this.근태충돌겹침판정한다(usedAttendances);

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
     * 연차와 반차, 연차와 출장 등이 동시에 사용된 경우 시간 범위를 비교하여:
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

        // 연차, 반차, 출장 관련 근태만 필터링
        const 연차근태 = attendancesWithTimeRange.filter((ua) => ua.title.includes('연차'));
        const 반차근태 = attendancesWithTimeRange.filter((ua) => ua.title.includes('반차'));
        const 출장근태 = attendancesWithTimeRange.filter((ua) => ua.title.includes('출장'));

        // 연차와 반차, 연차와 출장 조합만 확인
        const 조합목록: Array<{
            att1: (typeof attendancesWithTimeRange)[0];
            att2: (typeof attendancesWithTimeRange)[0];
        }> = [];

        // 연차와 반차 조합
        for (const 연차 of 연차근태) {
            for (const 반차 of 반차근태) {
                조합목록.push({ att1: 연차, att2: 반차 });
            }
        }

        // 연차와 출장 조합
        for (const 연차 of 연차근태) {
            for (const 출장 of 출장근태) {
                조합목록.push({ att1: 연차, att2: 출장 });
            }
        }

        if (조합목록.length === 0) {
            return {
                hasAttendanceConflict: false,
                hasAttendanceOverlap: false,
            };
        }

        // 모든 조합을 비교
        let hasConflict = false;
        let hasOverlap = false;

        for (const { att1, att2 } of 조합목록) {
            const timeRange1 = {
                start: this.시간을분으로변환(att1.startWorkTime!),
                end: this.시간을분으로변환(att1.endWorkTime!),
            };
            const timeRange2 = {
                start: this.시간을분으로변환(att2.startWorkTime!),
                end: this.시간을분으로변환(att2.endWorkTime!),
            };

            // 시간 범위 비교
            const isConflict = timeRange1.start === timeRange2.start && timeRange1.end === timeRange2.end;
            const isOverlapping = this.시간범위가겹치는가(timeRange1, timeRange2);

            if (isConflict) {
                hasConflict = true;
            } else if (isOverlapping) {
                hasOverlap = true;
            }
        }

        return {
            hasAttendanceConflict: hasConflict,
            hasAttendanceOverlap: hasOverlap && !hasConflict, // conflict가 있으면 overlap은 false
        };
    }

    /**
     * 시간을 분으로 변환한다 (HH:MM:SS -> 분)
     */
    private 시간을분으로변환(timeStr: string): number {
        if (!timeStr || timeStr.length < 8) {
            return 0;
        }
        const parts = timeStr.split(':');
        if (parts.length !== 3) {
            return 0;
        }
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
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
