import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository, DataSource } from 'typeorm';
import { MonthlyEventSummary } from './monthly-event-summary.entity';
import {
    CreateMonthlyEventSummaryData,
    UpdateMonthlyEventSummaryData,
    MonthlyEventSummaryDTO,
} from './monthly-event-summary.types';
import { DailyEventSummary } from '../daily-event-summary/daily-event-summary.entity';
import { UsedAttendance } from '../used-attendance/used-attendance.entity';
import { DomainAttendanceTypeService } from '../attendance-type/attendance-type.service';
import {
    startOfMonth,
    endOfMonth,
    format,
    eachDayOfInterval,
    startOfISOWeek,
    getISOWeek,
    getISOWeekYear,
} from 'date-fns';

/**
 * 월간 요약 서비스
 *
 * 월간 요약 엔티티에 대한 CRUD 기능을 제공합니다.
 * 상위 로직에서 제공하는 트랜잭션(EntityManager)을 받아서 사용할 수 있습니다.
 */
@Injectable()
export class DomainMonthlyEventSummaryService {
    private readonly logger = new Logger(DomainMonthlyEventSummaryService.name);

    constructor(
        @InjectRepository(MonthlyEventSummary)
        private readonly repository: Repository<MonthlyEventSummary>,
        private readonly dataSource: DataSource,
        private readonly attendanceTypeService: DomainAttendanceTypeService,
    ) {}

    /**
     * Repository를 가져온다 (트랜잭션 지원)
     */
    private getRepository(manager?: EntityManager): Repository<MonthlyEventSummary> {
        return manager ? manager.getRepository(MonthlyEventSummary) : this.repository;
    }

    /**
     * 월간 요약을 생성한다
     */
    async 생성한다(data: CreateMonthlyEventSummaryData, manager?: EntityManager): Promise<MonthlyEventSummaryDTO> {
        const repository = this.getRepository(manager);

        // 중복 검증 (직원 ID와 연월 조합은 유일해야 함)
        const existing = await repository.findOne({
            where: {
                employee_id: data.employeeId,
                yyyymm: data.yyyymm,
                deleted_at: IsNull(),
            },
        });
        if (existing) {
            throw new ConflictException('이미 해당 연월의 월간 요약이 존재합니다.');
        }

        const summary = new MonthlyEventSummary(
            data.employeeNumber,
            data.employeeId,
            data.yyyymm,
            data.workDaysCount,
            data.totalWorkTime,
            data.avgWorkTimes,
            data.attendanceTypeCount,
            data.employeeName,
            data.totalWorkableTime,
            data.weeklyWorkTimeSummary,
            data.dailyEventSummary,
            data.lateDetails,
            data.absenceDetails,
            data.earlyLeaveDetails,
            data.note,
            data.additionalNote,
        );

        const saved = await repository.save(summary);
        return saved.DTO변환한다();
    }

    /**
     * ID로 월간 요약을 조회한다
     */
    async ID로조회한다(id: string): Promise<MonthlyEventSummaryDTO> {
        const summary = await this.repository.findOne({
            where: { id },
            relations: ['employee', 'dailyEventSummaries'],
        });
        if (!summary) {
            throw new NotFoundException(`월간 요약을 찾을 수 없습니다. (id: ${id})`);
        }
        return summary.DTO변환한다();
    }

    /**
     * 특정 직원의 특정 연월 요약을 조회한다
     */
    async 직원ID와연월로조회한다(employeeId: string, yyyymm: string): Promise<MonthlyEventSummaryDTO | null> {
        const summary = await this.repository.findOne({
            where: { employee_id: employeeId, yyyymm, deleted_at: IsNull() },
        });
        return summary ? summary.DTO변환한다() : null;
    }

    /**
     * 특정 연월의 모든 월간 요약 목록을 조회한다
     */
    async 연월로목록조회한다(yyyymm: string): Promise<MonthlyEventSummaryDTO[]> {
        const summaries = await this.repository.find({
            where: { yyyymm, deleted_at: IsNull() },
            order: { employee_number: 'ASC' },
        });
        return summaries.map((summary) => summary.DTO변환한다());
    }

    /**
     * 특정 직원의 모든 월간 요약 목록을 조회한다
     */
    async 직원ID로목록조회한다(employeeId: string): Promise<MonthlyEventSummaryDTO[]> {
        const summaries = await this.repository.find({
            where: { employee_id: employeeId, deleted_at: IsNull() },
            order: { yyyymm: 'DESC' },
        });
        return summaries.map((summary) => summary.DTO변환한다());
    }

    /**
     * 연월 범위로 월간 요약 목록을 조회한다
     */
    async 연월범위로목록조회한다(startYyyymm: string, endYyyymm: string): Promise<MonthlyEventSummaryDTO[]> {
        const summaries = await this.repository
            .createQueryBuilder('summary')
            .where('summary.deleted_at IS NULL')
            .andWhere('summary.yyyymm BETWEEN :start AND :end', {
                start: startYyyymm,
                end: endYyyymm,
            })
            .orderBy('summary.yyyymm', 'DESC')
            .addOrderBy('summary.employee_number', 'ASC')
            .getMany();
        return summaries.map((summary) => summary.DTO변환한다());
    }

    /**
     * 월간 요약 생성 또는 갱신 (배치 최적화 버전 - 이미 조회된 데이터 사용)
     */
    async 생성또는갱신한다(
        employeeId: string,
        yyyymm: string,
        dailySummaries: DailyEventSummary[],
        usedAttendances: any[],
        allAttendanceTypes: any[],
        queryRunnerOrManager: any,
    ): Promise<MonthlyEventSummaryDTO> {
        try {
            const [year, month] = yyyymm.split('-');

            if (dailySummaries.length === 0) {
                throw new BadRequestException(`${yyyymm}의 일일 요약 데이터가 없습니다.`);
            }

            // queryRunner 또는 { manager } 형태 모두 지원
            const manager = queryRunnerOrManager?.manager || queryRunnerOrManager;

            // 통계 계산 (뷰 로직과 동기화)
            const workDays = dailySummaries.filter((d) => {
                if (d.work_time !== null) return true;

                const hasRecognizedAttendance = usedAttendances.some(
                    (ua) => ua.used_at === d.date && ua.attendanceType?.is_recognized_work_time === true,
                );
                return hasRecognizedAttendance;
            });

            // 주간 근무시간 요약 계산
            const weeklyWorkTimeSummary = this.주간근무시간계산한다(dailySummaries, usedAttendances, year, month);
            const totalWorkTime = weeklyWorkTimeSummary.reduce((sum, week) => sum + week.weeklyWorkTime, 0);

            // totalWorkableTime 계산
            const monthStart = startOfMonth(new Date(`${year}-${month}-01`));
            const monthEnd = endOfMonth(new Date(`${year}-${month}-01`));
            const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
            const weekdayCount = allDays.filter((day) => {
                const dow = day.getDay();
                return dow !== 0 && dow !== 6;
            }).length;
            const totalWorkableTime = weekdayCount * 624; // 624는 주당최대 근무 시간52시간을 하루치의 분 단위로 변환한 값(52시간 / 5일 * 60분 = 624분)

            const avgWorkTimes = workDays.length > 0 ? totalWorkTime / workDays.length : 0;

            // 근태 유형별 카운트 (전달받은 allAttendanceTypes 사용)
            const attendanceTypeCount: { [key: string]: number } = {};

            allAttendanceTypes.forEach((at) => {
                attendanceTypeCount[at.title] = 0;
            });

            attendanceTypeCount['지각'] = 0;
            attendanceTypeCount['결근'] = 0;
            attendanceTypeCount['조퇴'] = 0;

            usedAttendances.forEach((ua) => {
                const title = ua.attendanceType?.title;
                if (title && title in attendanceTypeCount) {
                    attendanceTypeCount[title]++;
                }
            });

            dailySummaries.forEach((d) => {
                if (d.is_late) attendanceTypeCount['지각']++;
                if (d.is_absent) attendanceTypeCount['결근']++;
                if (d.is_early_leave) attendanceTypeCount['조퇴']++;
            });

            // 상세 정보
            const dailyEventSummary = null;
            // const dailyEventSummary = dailySummaries.map((d) => ({
            //     dailyEventSummaryId: d.id,
            //     date: d.date,
            //     isHoliday: d.is_holiday,
            //     enter: d.enter,
            //     leave: d.leave,
            //     realEnter: d.real_enter,
            //     realLeave: d.real_leave,
            //     isChecked: d.is_checked,
            //     isLate: d.is_late,
            //     isEarlyLeave: d.is_early_leave,
            //     isAbsent: d.is_absent,
            //     workTime: d.work_time,
            //     note: d.note || '',
            //     usedAttendances: usedAttendances
            //         .filter((ua) => ua.used_at === d.date)
            //         .map((ua) => ({
            //             usedAttendanceId: ua.id,
            //             attendanceTypeId: ua.attendanceType?.id,
            //             title: ua.attendanceType?.title,
            //         })),
            // }));

            const lateDetails = dailySummaries
                .filter((d) => d.is_late)
                .map((d) => ({
                    dailyEventSummaryId: d.id,
                    date: d.date,
                    isHoliday: d.is_holiday,
                    enter: d.enter,
                    leave: d.leave,
                    realEnter: d.real_enter,
                    realLeave: d.real_leave,
                    isChecked: d.is_checked,
                    isLate: d.is_late,
                    isEarlyLeave: d.is_early_leave,
                    isAbsent: d.is_absent,
                    workTime: d.work_time,
                    note: d.note || '',
                    usedAttendances: usedAttendances
                        .filter((ua) => ua.used_at === d.date)
                        .map((ua) => ({
                            usedAttendanceId: ua.id,
                            attendanceTypeId: ua.attendanceType?.id,
                            title: ua.attendanceType?.title,
                        })),
                }));

            const absenceDetails = dailySummaries
                .filter((d) => d.is_absent)
                .map((d) => ({
                    dailyEventSummaryId: d.id,
                    date: d.date,
                    isHoliday: d.is_holiday,
                    enter: d.enter,
                    leave: d.leave,
                    realEnter: d.real_enter,
                    realLeave: d.real_leave,
                    isChecked: d.is_checked,
                    isLate: d.is_late,
                    isEarlyLeave: d.is_early_leave,
                    isAbsent: d.is_absent,
                    workTime: d.work_time,
                    note: d.note || '',
                    usedAttendances: usedAttendances
                        .filter((ua) => ua.used_at === d.date)
                        .map((ua) => ({
                            usedAttendanceId: ua.id,
                            attendanceTypeId: ua.attendanceType?.id,
                            title: ua.attendanceType?.title,
                        })),
                }));

            const earlyLeaveDetails = dailySummaries
                .filter((d) => d.is_early_leave)
                .map((d) => ({
                    dailyEventSummaryId: d.id,
                    date: d.date,
                    isHoliday: d.is_holiday,
                    enter: d.enter,
                    leave: d.leave,
                    realEnter: d.real_enter,
                    realLeave: d.real_leave,
                    isChecked: d.is_checked,
                    isLate: d.is_late,
                    isEarlyLeave: d.is_early_leave,
                    isAbsent: d.is_absent,
                    workTime: d.work_time,
                    note: d.note || '',
                    usedAttendances: usedAttendances
                        .filter((ua) => ua.used_at === d.date)
                        .map((ua) => ({
                            usedAttendanceId: ua.id,
                            attendanceTypeId: ua.attendanceType?.id,
                            title: ua.attendanceType?.title,
                        })),
                }));

            // 기존 요약 찾기 (삭제된 레코드도 포함하여 조회)
            let summary = await manager.findOne(MonthlyEventSummary, {
                where: { employee_id: employeeId, yyyymm },
                withDeleted: true,
            });

            if (!summary) {
                // 새로 생성
                summary = new MonthlyEventSummary(
                    dailySummaries[0].employee?.employeeNumber || '',
                    employeeId,
                    yyyymm,
                    workDays.length,
                    totalWorkTime,
                    avgWorkTimes,
                    attendanceTypeCount,
                    dailySummaries[0].employee?.name || null,
                    totalWorkableTime,
                    weeklyWorkTimeSummary,
                    dailyEventSummary,
                    lateDetails,
                    absenceDetails,
                    earlyLeaveDetails,
                );
            } else {
                summary.deleted_at = null;

                // 기존 요약 업데이트
                summary.요약업데이트한다({
                    employeeInfo: {
                        employeeNumber: dailySummaries[0].employee?.employeeNumber || '',
                        employeeId: employeeId,
                        employeeName: dailySummaries[0].employee?.name || '',
                    },
                    yyyymm,
                    totalWorkableTime,
                    totalWorkTime,
                    workDaysCount: workDays.length,
                    avgWorkTimes,
                    attendanceTypeCount,
                    weeklyWorkTimeSummary,
                    dailyEventSummary,
                    lateDetails,
                    absenceDetails,
                    earlyLeaveDetails,
                    note: summary.note || '',
                });
            }
            const saved = await manager.save(MonthlyEventSummary, summary);
            return saved.DTO변환한다();
        } catch (error) {
            this.logger.error(`월간 요약 생성 실패 (배치): ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 주간 근무시간 계산 (뷰 로직과 동기화)
     * ISO 주(월요일 시작)로 그룹하고, 해당 월이 속한 연도(year) 기준으로 weekNumber를 부여한다.
     * 12월 말처럼 다음 해 1주차에 속하는 일자는 해당 연도 "53주차"로 표시한다.
     */
    private 주간근무시간계산한다(
        dailySummaries: DailyEventSummary[],
        usedAttendances: UsedAttendance[],
        year: string,
        month: string,
    ): Array<{
        weekNumber: number;
        startDate: string;
        endDate: string;
        weeklyWorkTime: number;
    }> {
        const displayYear = parseInt(year, 10);
        const monthStart = startOfMonth(new Date(`${year}-${month}-01`));
        const monthEnd = endOfMonth(new Date(`${year}-${month}-01`));
        const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

        // ISO 주 시작일(월요일) 문자열로 그룹화
        const weekGroups = new Map<string, { dates: string[]; workTime: number }>();

        allDays.forEach((day) => {
            const weekStart = startOfISOWeek(day);
            const weekStartStr = format(weekStart, 'yyyy-MM-dd');
            const dateStr = format(day, 'yyyy-MM-dd');

            if (!weekGroups.has(weekStartStr)) {
                weekGroups.set(weekStartStr, { dates: [], workTime: 0 });
            }

            const group = weekGroups.get(weekStartStr)!;
            group.dates.push(dateStr);

            // 해당 날짜의 근무시간 찾기 (뷰 로직과 동일)
            const dailySummary = dailySummaries.find((d) => d.date === dateStr);
            const dayAttendances = usedAttendances.filter((ua) => ua.used_at === dateStr);
            const totalAttendanceWorkTime = dayAttendances.reduce(
                (sum, ua) => sum + (ua.attendanceType?.work_time || 0),
                0,
            );

            let dailyWorkTime = 0;

            // 뷰 로직과 동기화: 실제 출입기록이 있는 경우
            if (
                dailySummary?.real_enter !== null &&
                dailySummary?.real_enter !== undefined &&
                dailySummary?.real_leave !== null &&
                dailySummary?.real_leave !== undefined
            ) {
                // work_time + 근태시간
                const baseWorkTime = (dailySummary.work_time || 0) + totalAttendanceWorkTime;

                // 점심시간 차감 (12:00-13:00 포함 시)
                let lunchDeduction = 0;
                if (dailySummary.real_enter <= '12:00:00' && dailySummary.real_leave >= '13:00:00') {
                    lunchDeduction = 60;
                }

                // 저녁시간 차감 (13시간 이상 근무 시)
                let dinnerDeduction = 0;
                if (baseWorkTime >= 780) {
                    dinnerDeduction = 30;
                }

                dailyWorkTime = baseWorkTime - lunchDeduction - dinnerDeduction;
            }
            // 출입기록이 없지만 근태 이력이 있는 경우 (연차, 반차 등)
            else if (
                (dailySummary?.real_enter === null || dailySummary?.real_leave === null) &&
                totalAttendanceWorkTime > 0
            ) {
                dailyWorkTime = totalAttendanceWorkTime;
            }

            group.workTime += dailyWorkTime;
        });

        // 주 시작일 기준 정렬 후, 해당 월이 속한 연도(displayYear) 기준으로 ISO 주차 부여
        // 다음 해 1주차로 넘어가는 주(12월 말)는 53주차로 표시
        const sortedWeekStarts = Array.from(weekGroups.keys()).sort();
        const weeklyWorkTimeSummary: Array<{
            weekNumber: number;
            startDate: string;
            endDate: string;
            weeklyWorkTime: number;
        }> = [];

        sortedWeekStarts.forEach((weekStartStr) => {
            const group = weekGroups.get(weekStartStr)!;
            const sortedDates = group.dates.sort();
            const firstDateInWeek = new Date(sortedDates[0]);
            const isoWeekYear = getISOWeekYear(firstDateInWeek);
            const isoWeek = getISOWeek(firstDateInWeek);
            // 해당 월이 속한 연도와 다르면(12월 말 → 다음 해 1주차) 53주차로 표시
            const weekNumber = isoWeekYear > displayYear ? 53 : isoWeek;

            weeklyWorkTimeSummary.push({
                weekNumber,
                startDate: sortedDates[0],
                endDate: sortedDates[sortedDates.length - 1],
                weeklyWorkTime: group.workTime,
            });
        });

        return weeklyWorkTimeSummary.sort((a, b) => a.weekNumber - b.weekNumber);
    }

    /**
     * 월간 요약 조회 (일일 요약 포함)
     */
    async 일일요약포함조회한다(employeeId: string, yyyymm: string): Promise<MonthlyEventSummaryDTO | null> {
        const summary = await this.repository.findOne({
            where: { employee_id: employeeId, yyyymm, deleted_at: IsNull() },
        });

        if (!summary) return null;

        // 일일 요약 조회
        const [year, month] = yyyymm.split('-');
        const startDate = format(startOfMonth(new Date(`${year}-${month}-01`)), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(new Date(`${year}-${month}-01`)), 'yyyy-MM-dd');

        const dailySummaries = await this.dataSource.manager
            .createQueryBuilder(DailyEventSummary, 'daily')
            .leftJoinAndSelect('daily.employee', 'employee')
            .where('daily.deleted_at IS NULL')
            .andWhere('daily.employee_id = :employeeId', { employeeId })
            .andWhere('daily.date BETWEEN :startDate AND :endDate', { startDate, endDate })
            .orderBy('daily.date', 'ASC')
            .getMany();

        // 각 일일 요약에 근태 사용 내역 추가
        for (const daily of dailySummaries) {
            const usedAttendances = await this.dataSource.manager
                .createQueryBuilder(UsedAttendance, 'ua')
                .leftJoinAndSelect('ua.attendanceType', 'at')
                .where('ua.deleted_at IS NULL')
                .andWhere('ua.employee_id = :employeeId', { employeeId: daily.employee_id })
                .andWhere('ua.used_at = :date::text', { date: daily.date })
                .getMany();

            (daily as any).usedAttendances = usedAttendances.map((ua) => ({
                usedAttendanceId: ua.id,
                attendanceTypeId: ua.attendanceType?.id || '',
                title: ua.attendanceType?.title,
            }));
        }

        summary.daily_event_summary = dailySummaries as any;

        return summary.DTO변환한다();
    }

    /**
     * 월간 요약 정보를 수정한다
     */
    async 수정한다(
        id: string,
        data: UpdateMonthlyEventSummaryData,
        userId: string,
        manager?: EntityManager,
    ): Promise<MonthlyEventSummaryDTO> {
        const repository = this.getRepository(manager);
        const summary = await repository.findOne({ where: { id } });
        if (!summary) {
            throw new NotFoundException(`월간 요약을 찾을 수 없습니다. (id: ${id})`);
        }

        summary.업데이트한다(
            data.employeeNumber,
            data.employeeName,
            data.workDaysCount,
            data.totalWorkableTime,
            data.totalWorkTime,
            data.avgWorkTimes,
            data.attendanceTypeCount,
            data.weeklyWorkTimeSummary,
            data.dailyEventSummary,
            data.lateDetails,
            data.absenceDetails,
            data.earlyLeaveDetails,
            data.note,
            data.additionalNote,
        );

        // 수정자 정보 설정
        summary.수정자설정한다(userId);
        summary.메타데이터업데이트한다(userId);

        const saved = await repository.save(summary);
        return saved.DTO변환한다();
    }

    /**
     * 월간 요약을 삭제한다 (Soft Delete)
     */
    async 삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        const summary = await repository.findOne({ where: { id } });
        if (!summary) {
            throw new NotFoundException(`월간 요약을 찾을 수 없습니다. (id: ${id})`);
        }
        // Soft Delete: deleted_at 필드를 설정
        summary.deleted_at = new Date();
        // 삭제자 정보 설정
        summary.수정자설정한다(userId);
        summary.메타데이터업데이트한다(userId);
        await repository.save(summary);
    }

    /**
     * 월간 요약을 완전히 삭제한다 (Hard Delete)
     */
    async 완전삭제한다(id: string, userId: string, manager?: EntityManager): Promise<void> {
        const repository = this.getRepository(manager);
        // Soft Delete된 월간 요약도 조회할 수 있도록 withDeleted 옵션 사용
        const summary = await repository.findOne({
            where: { id },
            withDeleted: true,
        });
        if (!summary) {
            throw new NotFoundException(`월간 요약을 찾을 수 없습니다. (id: ${id})`);
        }
        // Hard Delete: 데이터베이스에서 완전히 삭제
        await repository.remove(summary);
    }
}
