import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { GenerateDailySummariesCommand } from './generate-daily-summaries.command';
import { IGenerateDailySummariesResponse } from '../../../interfaces';
import { DomainDailyEventSummaryService } from '../../../../../domain/daily-event-summary/daily-event-summary.service';
import { DomainAttendanceIssueService } from '../../../../../domain/attendance-issue/attendance-issue.service';
import { DomainEventInfoService } from '../../../../../domain/event-info/event-info.service';
import { DomainUsedAttendanceService } from '../../../../../domain/used-attendance/used-attendance.service';
import { DomainHolidayInfoService } from '../../../../../domain/holiday-info/holiday-info.service';
import { DomainWorkTimeOverrideService } from '../../../../../domain/work-time-override/work-time-override.service';
import { DomainEmployeeService } from '@libs/modules/employee/employee.service';
import { WorkTimePolicyService } from '../../../services/work-time-policy.service';
import { DailySummaryJudgmentService } from '../../../services/daily-summary-judgment.service';
import { EventInfo } from '../../../../../domain/event-info/event-info.entity';
import { UsedAttendance } from '../../../../../domain/used-attendance/used-attendance.entity';
import { DailyEventSummary } from '../../../../../domain/daily-event-summary/daily-event-summary.entity';
import { Employee } from '@libs/modules/employee/employee.entity';
import { EmployeeExtraInfo } from '../../../../../domain/employee-extra-info/employee-extra-info.entity';
import { format, startOfMonth, endOfMonth } from 'date-fns';

/**
 * 일일 요약 생성 핸들러
 *
 * flow.md의 두 가지 흐름을 지원합니다:
 *
 * 1. 파일내용반영 흐름 (snapshotData 없음):
 *    - event-info와 used-attendance를 기반으로 일일 요약 생성
 *    - 출입기록과 근태사용이력을 기반으로 계산
 *
 * 2. 스냅샷 적용 흐름 (snapshotData 제공):
 *    - 스냅샷에 저장된 데이터를 기반으로 일일 요약 생성
 *    - 기존 일일요약 데이터를 복원
 *
 * 공통:
 * - 정상근무 범위를 벗어난 경우 attendance-issue 데이터 생성
 * - 정상근무 범위는 정책적으로 변동될 여지가 있기때문에 유연하게 구현
 */
@CommandHandler(GenerateDailySummariesCommand)
export class GenerateDailySummariesHandler implements ICommandHandler<
    GenerateDailySummariesCommand,
    IGenerateDailySummariesResponse
> {
    private readonly logger = new Logger(GenerateDailySummariesHandler.name);

    constructor(
        private readonly dailyEventSummaryService: DomainDailyEventSummaryService,
        private readonly attendanceIssueService: DomainAttendanceIssueService,
        private readonly eventInfoService: DomainEventInfoService,
        private readonly usedAttendanceService: DomainUsedAttendanceService,
        private readonly holidayInfoService: DomainHolidayInfoService,
        private readonly workTimeOverrideService: DomainWorkTimeOverrideService,
        private readonly employeeService: DomainEmployeeService,
        private readonly workTimePolicyService: WorkTimePolicyService,
        private readonly dailySummaryJudgmentService: DailySummaryJudgmentService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(command: GenerateDailySummariesCommand): Promise<IGenerateDailySummariesResponse> {
        const { year, month, performedBy } = command.data;

        return await this.dataSource.transaction(async (manager) => {
            try {
                this.logger.log(`일일 요약 생성 시작: year=${year}, month=${month}`);

                // 날짜 범위 계산
                const yearNum = parseInt(year);
                const monthNum = parseInt(month);
                const startDate = startOfMonth(new Date(yearNum, monthNum - 1, 1));
                const endDate = endOfMonth(new Date(yearNum, monthNum - 1, 1));
                const startDateStr = format(startDate, 'yyyy-MM-dd');
                const endDateStr = format(endDate, 'yyyy-MM-dd');

                // 1. event-info와 used-attendance 가져오기 (도메인 서비스 사용)
                const events = await this.eventInfoService.날짜범위로조회한다(startDateStr, endDateStr, manager);
                const usedAttendances = await this.usedAttendanceService.날짜범위로조회한다(
                    startDateStr,
                    endDateStr,
                    manager,
                );

                // 2. 조회된 데이터에서 직원 정보 추출 및 조회
                const { employees, employeeNumberMap } = await this.직원정보를추출한다(
                    events,
                    usedAttendances,
                    manager,
                );

                if (employees.length === 0) {
                    this.logger.warn('조회된 직원이 없습니다.');
                    return {
                        success: true,
                        statistics: {
                            dailyEventSummaryCount: 0,
                            attendanceIssueCount: 0,
                        },
                    };
                }

                // 3. holiday 정보 가져오기
                const holidays = await this.holidayInfoService.목록조회한다();
                const holidaySet = new Set(holidays.map((h) => h.holidayDate));

                // 4. daily-event-summary 생성
                const summaries = await this.일일요약을생성한다(
                    events,
                    usedAttendances,
                    employees,
                    employeeNumberMap,
                    holidaySet,
                    year,
                    month,
                    manager,
                );

                this.logger.log(`✅ 일일 요약 생성 완료: 요약 ${summaries.length}건`);

                return {
                    success: true,
                    statistics: {
                        dailyEventSummaryCount: summaries.length,
                        attendanceIssueCount: 0, // 근태 이슈는 별도 핸들러에서 생성
                    },
                    summaries, // 오케스트레이션에서 사용
                };
            } catch (error) {
                this.logger.error(`일일 요약 생성 실패: ${error.message}`, error.stack);
                throw error;
            }
        });
    }

    /**
     * 조회된 데이터에서 직원 정보를 추출한다
     * is_excluded_from_summary가 true인 직원은 제외한다
     */
    private async 직원정보를추출한다(
        events: EventInfo[],
        usedAttendances: any[],
        manager: any,
    ): Promise<{
        employees: Employee[];
        employeeNumberMap: Map<string, Employee>;
    }> {
        // 1. 출입기록에서 employeeNumber 추출
        const employeeNumbers = new Set<string>();
        events.forEach((event) => {
            if (event.employee_number) {
                employeeNumbers.add(event.employee_number);
            }
        });

        // 2. 근태사용내역에서 employeeId 추출
        const employeeIds = new Set<string>();
        usedAttendances.forEach((ua) => {
            if (ua.employeeId) {
                employeeIds.add(ua.employeeId);
            }
        });

        // 3. employeeNumber로 직원 조회
        const employeesByNumber =
            employeeNumbers.size > 0
                ? await manager.find(Employee, {
                      where: { employeeNumber: In(Array.from(employeeNumbers)) },
                  })
                : [];

        // 4. employeeId로 직원 조회
        const employeesById =
            employeeIds.size > 0
                ? await manager.find(Employee, {
                      where: { id: In(Array.from(employeeIds)) },
                  })
                : [];

        // 5. 두 결과를 합치고 중복 제거
        const employeeMap = new Map<string, Employee>();
        employeesByNumber.forEach((emp) => employeeMap.set(emp.id, emp));
        employeesById.forEach((emp) => employeeMap.set(emp.id, emp));

        const allEmployees = Array.from(employeeMap.values());

        // 6. is_excluded_from_summary가 true인 직원 ID 조회
        const employeeIdsToCheck = allEmployees.map((emp) => emp.id);
        const excludedEmployeeInfos =
            employeeIdsToCheck.length > 0
                ? await manager.find(EmployeeExtraInfo, {
                      where: {
                          employee_id: In(employeeIdsToCheck),
                          is_excluded_from_summary: true,
                      },
                  })
                : [];

        const excludedEmployeeIds = new Set(excludedEmployeeInfos.map((info) => info.employee_id));

        // 7. 제외 대상 직원 필터링
        const employees = allEmployees.filter((emp) => !excludedEmployeeIds.has(emp.id));
        const employeeNumberMap = new Map(employees.map((emp) => [emp.employeeNumber, emp]));

        return { employees, employeeNumberMap };
    }

    /**
     * 일일 요약을 생성한다
     */
    private async 일일요약을생성한다(
        events: EventInfo[],
        usedAttendances: UsedAttendance[],
        employees: Employee[],
        employeeNumberMap: Map<string, Employee>,
        holidaySet: Set<string>,
        year: string,
        month: string,
        manager: any,
    ): Promise<DailyEventSummary[]> {
        // 해당 월의 모든 날짜 생성
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0);
        const allDates = this.날짜범위생성(startDate, endDate);

        // 직원별, 날짜별로 이벤트 그룹화
        const eventsByEmployeeAndDate = new Map<string, Map<string, EventInfo[]>>();
        events.forEach((event) => {
            if (!event.employee_number || !employeeNumberMap.has(event.employee_number)) return;

            const employee = employeeNumberMap.get(event.employee_number)!;
            if (!eventsByEmployeeAndDate.has(employee.id)) {
                eventsByEmployeeAndDate.set(employee.id, new Map());
            }

            const employeeEvents = eventsByEmployeeAndDate.get(employee.id)!;
            const dateStr = event.yyyymmdd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            if (!employeeEvents.has(dateStr)) {
                employeeEvents.set(dateStr, []);
            }

            employeeEvents.get(dateStr)!.push(event);
        });

        // 직원별, 날짜별 근태 이력 그룹화
        const attendancesByEmployeeAndDate = new Map<string, Map<string, UsedAttendance[]>>();
        usedAttendances.forEach((ua) => {
            const employeeId = ua.employee_id;
            if (!employeeId) return;

            if (!attendancesByEmployeeAndDate.has(employeeId)) {
                attendancesByEmployeeAndDate.set(employeeId, new Map());
            }
            const employeeAttendances = attendancesByEmployeeAndDate.get(employeeId)!;
            if (!employeeAttendances.has(ua.used_at)) {
                employeeAttendances.set(ua.used_at, []);
            }
            employeeAttendances.get(ua.used_at)!.push(ua);
        });

        // DailyEventSummary 생성
        const summaries: DailyEventSummary[] = [];

        // 모든 직원 × 모든 날짜 조합 생성
        for (const employee of employees) {
            const employeeEvents = eventsByEmployeeAndDate.get(employee.id);
            const employeeAttendances = attendancesByEmployeeAndDate.get(employee.id);

            for (const date of allDates) {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayEvents = employeeEvents?.get(dateStr);
                const dayAttendances = employeeAttendances?.get(dateStr) || [];

                const summary = new DailyEventSummary(
                    dateStr,
                    employee.id,
                    undefined,
                    holidaySet.has(dateStr) || this.주말여부확인(dateStr),
                );

                // // 입사일 및 퇴사일 확인
                // const hireDate = employee.hireDate ? format(new Date(employee.hireDate), 'yyyy-MM-dd') : null;
                // const terminationDate =
                //     employee.status === '퇴사' && employee.terminationDate
                //         ? format(new Date(employee.terminationDate), 'yyyy-MM-dd')
                //         : null;
                // const isBeforeHireDate = hireDate && dateStr < hireDate;
                // const isAfterTerminationDate = terminationDate && dateStr > terminationDate;

                // 1단계: 출입 기록 정보 반영
                let realEnterTime: string | null = null;
                let realLeaveTime: string | null = null;
                if (dayEvents && dayEvents.length > 0) {
                    dayEvents.sort((a, b) => a.hhmmss.localeCompare(b.hhmmss));
                    realEnterTime = this.HHMMSS를HHMMSS로변환(dayEvents[0].hhmmss);
                    realLeaveTime = this.HHMMSS를HHMMSS로변환(dayEvents[dayEvents.length - 1].hhmmss);

                    // 실제 출입 기록은 항상 유지
                    summary.real_enter = realEnterTime;
                    summary.real_leave = realLeaveTime;
                }

                // 2단계: 출입 기록과 근태 유형을 종합하여 출퇴근 시간 계산
                // 정상 근무로 인정되는 근태만 필터링
                const recognizedAttendances = dayAttendances.filter((ua) =>
                    this.workTimePolicyService.isRecognizedWorkTime(ua.attendanceType),
                );

                const workTime = this.출입기록과근태기반출입시간을계산한다(
                    realEnterTime,
                    realLeaveTime,
                    recognizedAttendances,
                );

                summary.enter = workTime.enter;
                summary.leave = workTime.leave;

                // 3-4단계: 결근, 지각, 조퇴 판정 (공통 서비스 사용)
                // used_attendances를 공통 서비스에서 사용하는 형태로 변환
                const usedAttendancesForJudgment = dayAttendances.map((ua) => ({
                    attendanceTypeId: ua.attendance_type_id,
                    title: ua.attendanceType?.title || '',
                    workTime: ua.attendanceType?.work_time,
                    isRecognizedWorkTime: ua.attendanceType?.is_recognized_work_time,
                    startWorkTime: ua.attendanceType?.start_work_time || null,
                    endWorkTime: ua.attendanceType?.end_work_time || null,
                    deductedAnnualLeave: ua.attendanceType?.deducted_annual_leave,
                }));

                const 판정결과 = await this.dailySummaryJudgmentService.결근지각조퇴판정한다(
                    summary,
                    realEnterTime,
                    realLeaveTime,
                    usedAttendancesForJudgment.length > 0 ? usedAttendancesForJudgment : null,
                    manager,
                );

                summary.is_absent = 판정결과.isAbsent;
                summary.is_late = 판정결과.isLate;
                summary.is_early_leave = 판정결과.isEarlyLeave;
                summary.has_attendance_conflict = 판정결과.hasAttendanceConflict;
                summary.has_attendance_overlap = 판정결과.hasAttendanceOverlap;

                // 5단계: 근무 시간 계산
                summary.work_time = this.근무시간을계산한다(summary.enter, summary.leave, recognizedAttendances);
                summary.is_checked = true;

                // 6단계: 노트 생성
                this.노트를생성한다(summary);

                // 해당 날짜에 사용된 근태 유형 정보 설정
                const usedAttendanceInfos = dayAttendances.map((ua) => {
                    const attendanceType = ua.attendanceType;
                    return {
                        attendanceTypeId: ua.attendance_type_id,
                        title: attendanceType?.title || '',
                        workTime: attendanceType?.work_time,
                        isRecognizedWorkTime: attendanceType?.is_recognized_work_time,
                        startWorkTime: attendanceType?.start_work_time || null,
                        endWorkTime: attendanceType?.end_work_time || null,
                        deductedAnnualLeave: attendanceType?.deducted_annual_leave,
                    };
                });
                summary.used_attendances = usedAttendanceInfos.length > 0 ? usedAttendanceInfos : null;

                summaries.push(summary);
            }
        }

        // 기존 데이터 조회 (소프트 삭제된 데이터 포함)
        const existingDateStartStr = format(startDate, 'yyyy-MM-dd');
        const existingDateEndStr = format(endDate, 'yyyy-MM-dd');
        const existingSummaries = await manager
            .createQueryBuilder(DailyEventSummary, 'des')
            .where('des.date >= :startDate', { startDate: existingDateStartStr })
            .andWhere('des.date <= :endDate', { endDate: existingDateEndStr })
            .withDeleted() // 소프트 삭제된 데이터도 조회
            .getMany();

        const existingMap = new Map<string, DailyEventSummary>();
        existingSummaries.forEach((existing) => {
            const key = `${existing.date}_${existing.employee_id}`;
            existingMap.set(key, existing);
        });

        // 복원 및 생성 데이터 분리
        const toSave: DailyEventSummary[] = [];
        summaries.forEach((summary) => {
            const key = `${summary.date}_${summary.employee_id}`;
            const existing = existingMap.get(key);

            if (existing) {
                // 기존 데이터 복원 및 업데이트
                existing.deleted_at = null; // 소프트 삭제 해제
                existing.enter = summary.enter;
                existing.leave = summary.leave;
                existing.real_enter = summary.real_enter;
                existing.real_leave = summary.real_leave;
                existing.is_holiday = summary.is_holiday;
                existing.is_absent = summary.is_absent;
                existing.is_late = summary.is_late;
                existing.is_early_leave = summary.is_early_leave;
                existing.is_checked = summary.is_checked;
                existing.note = summary.note;
                existing.work_time = summary.work_time;
                existing.used_attendances = summary.used_attendances;

                toSave.push(existing);
            } else {
                // 새 데이터 생성
                toSave.push(summary);
            }
        });
        // console.log(toSave);

        // 배치 저장
        const SUMMARY_BATCH_SIZE = 1000;
        for (let i = 0; i < toSave.length; i += SUMMARY_BATCH_SIZE) {
            const batch = toSave.slice(i, i + SUMMARY_BATCH_SIZE);
            await manager.save(DailyEventSummary, batch);
        }

        return toSave;
    }

    /**
     * 날짜 범위 생성
     */
    private 날짜범위생성(start: Date, end: Date): Date[] {
        const dates: Date[] = [];
        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            dates.push(new Date(date));
        }
        return dates;
    }

    /**
     * 주말 여부 확인
     */
    private 주말여부확인(dateString: string): boolean {
        const date = new Date(dateString);
        return date.getDay() === 0 || date.getDay() === 6;
    }

    /**
     * 출입 기록과 근태 유형을 종합하여 출퇴근 시간을 계산한다
     *
     * 정책: 실제 출입 기록과 근태 유형에 정해진 출퇴근 시간들 중
     * 가장 이른 시간과 가장 늦은 시간으로 출퇴근 시간을 입력
     *
     * @param realEnterTime 실제 출입 기록의 출근 시간 (HH:MM:SS 형식 또는 null)
     * @param realLeaveTime 실제 출입 기록의 퇴근 시간 (HH:MM:SS 형식 또는 null)
     * @param recognizedAttendances 인정되는 근태 사용 내역 목록
     * @returns 출입 시간 정보 (enter, leave)
     */
    private 출입기록과근태기반출입시간을계산한다(
        realEnterTime: string | null,
        realLeaveTime: string | null,
        recognizedAttendances: UsedAttendance[],
    ): {
        enter: string | null;
        leave: string | null;
    } {
        // 시간 비교를 위한 함수 (HH:MM:SS 형식)
        const compareTime = (time1: string, time2: string): number => {
            return time1.localeCompare(time2);
        };

        // 출근 시간 후보 목록
        const enterTimeCandidates: string[] = [];
        if (realEnterTime) {
            enterTimeCandidates.push(realEnterTime);
        }

        // 근태 유형에서 출근 시간 추출
        recognizedAttendances.forEach((ua) => {
            const attendanceType = ua.attendanceType;
            if (attendanceType?.start_work_time) {
                // HH:MM 형식인 경우 HH:MM:00 형식으로 변환
                // 이미 HH:MM:SS 형식인 경우 그대로 사용
                const startTime =
                    attendanceType.start_work_time.length === 5
                        ? attendanceType.start_work_time + ':00'
                        : attendanceType.start_work_time;
                enterTimeCandidates.push(startTime);
            }
        });

        // 퇴근 시간 후보 목록
        const leaveTimeCandidates: string[] = [];
        if (realLeaveTime) {
            leaveTimeCandidates.push(realLeaveTime);
        }

        // 근태 유형에서 퇴근 시간 추출
        recognizedAttendances.forEach((ua) => {
            const attendanceType = ua.attendanceType;
            if (attendanceType?.end_work_time) {
                // HH:MM 형식인 경우 HH:MM:00 형식으로 변환
                // 이미 HH:MM:SS 형식인 경우 그대로 사용
                const endTime =
                    attendanceType.end_work_time.length === 5
                        ? attendanceType.end_work_time + ':00'
                        : attendanceType.end_work_time;
                leaveTimeCandidates.push(endTime);
            }
        });

        // 가장 이른 출근 시간 선택
        let enterTime: string | null = null;
        if (enterTimeCandidates.length > 0) {
            enterTimeCandidates.sort(compareTime);
            enterTime = enterTimeCandidates[0];
        }

        // 가장 늦은 퇴근 시간 선택
        let leaveTime: string | null = null;
        if (leaveTimeCandidates.length > 0) {
            leaveTimeCandidates.sort(compareTime);
            leaveTime = leaveTimeCandidates[leaveTimeCandidates.length - 1];
        }

        return {
            enter: enterTime,
            leave: leaveTime,
        };
    }

    /**
     * 근무 시간을 계산한다
     *
     * 정책: 법정 휴식시간 보장
     * - 4시간 미만: 의무 없음 (휴식시간 제외 안 함)
     * - 4시간 이상 ~ 8시간 미만: 30분 이상 제외
     * - 8시간 이상: 1시간 이상 제외
     *
     * 1. 출입 기록이 있는 경우: enter와 leave 시간 차이에서 법정 휴식시간 제외
     * 2. 근태 유형만 있는 경우: 근태 유형의 work_time 합계 사용
     * 3. 둘 다 있는 경우: 출입 기록 기반 계산 (법정 휴식시간 제외)
     *
     * @param enter 출근 시간 (HH:MM:SS 형식 또는 null)
     * @param leave 퇴근 시간 (HH:MM:SS 형식 또는 null)
     * @param recognizedAttendances 인정되는 근태 사용 내역 목록
     * @returns 근무 시간 (분 단위)
     */
    private 근무시간을계산한다(
        enter: string | null,
        leave: string | null,
        recognizedAttendances: UsedAttendance[],
    ): number | null {
        // 출입 기록이 있는 경우: 시간 차이에서 법정 휴식시간 제외
        if (enter && leave) {
            const enterTime = this.시간문자열을분으로변환(enter);
            const leaveTime = this.시간문자열을분으로변환(leave);
            const totalWorkMinutes = leaveTime - enterTime;

            // 법정 휴식시간 계산
            const requiredRestMinutes = this.법정휴식시간을계산한다(totalWorkMinutes);

            // 총 근로시간에서 법정 휴식시간 제외
            const workTime = totalWorkMinutes - requiredRestMinutes;
            return workTime > 0 ? workTime : 0;
        }

        // 출입 기록이 없고 근태 유형만 있는 경우: 근태 유형의 work_time 합계
        if (recognizedAttendances.length > 0) {
            const totalWorkTime = recognizedAttendances.reduce((sum, ua) => {
                return sum + (ua.attendanceType?.work_time || 0);
            }, 0);
            return totalWorkTime > 0 ? totalWorkTime : null;
        }

        return null;
    }

    /**
     * 법정 휴식시간을 계산한다
     *
     * 근로시간별 휴식시간 계산표:
     * - 4시간 미만: 의무 없음 (0분)
     * - 4시간 이상 ~ 8시간 미만: 30분 이상
     * - 8시간 이상: 1시간 이상
     *
     * @param totalWorkMinutes 총 근로 시간 (분 단위)
     * @returns 법정 휴식시간 (분 단위)
     */
    private 법정휴식시간을계산한다(totalWorkMinutes: number): number {
        const FOUR_HOURS = 4 * 60; // 240분
        const EIGHT_HOURS = 8 * 60; // 480분

        if (totalWorkMinutes < FOUR_HOURS) {
            // 4시간 미만: 의무 없음
            return 0;
        } else if (totalWorkMinutes < EIGHT_HOURS) {
            // 4시간 이상 ~ 8시간 미만: 30분 이상
            return 30;
        } else {
            // 8시간 이상: 1시간 이상
            return 60;
        }
    }

    /**
     * 시간 문자열을 분 단위로 변환한다
     *
     * @param timeStr 시간 문자열 (HH:MM:SS 또는 HH:MM 형식)
     * @returns 분 단위 시간
     */
    private 시간문자열을분으로변환(timeStr: string): number {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        return hours * 60 + minutes;
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
     * 일간 요약 노트를 생성한다
     *
     * 지각, 조퇴, 결근 정보를 노트에 추가합니다.
     */
    private 노트를생성한다(summary: DailyEventSummary): void {
        let newNote = '';

        if (summary.is_late) {
            newNote += `출근 시간: ${summary.enter} 지각\n`;
        }

        if (summary.is_early_leave) {
            newNote += `퇴근 시간: ${summary.leave} 조퇴\n`;
        }

        if (summary.is_absent) {
            newNote += '결근\n';
        }

        if (newNote) {
            summary.note = newNote.trim();
        } else {
            summary.note = '';
        }
    }
}
