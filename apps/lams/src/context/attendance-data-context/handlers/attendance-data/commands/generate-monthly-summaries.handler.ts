import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GenerateMonthlySummariesCommand } from './generate-monthly-summaries.command';
import { IGenerateMonthlySummariesResponse } from '../../../interfaces';
import { DomainMonthlyEventSummaryService } from '../../../../../domain/monthly-event-summary/monthly-event-summary.service';
import { DomainDailyEventSummaryService } from '../../../../../domain/daily-event-summary/daily-event-summary.service';
import { DomainUsedAttendanceService } from '../../../../../domain/used-attendance/used-attendance.service';
import { DomainAttendanceTypeService } from '../../../../../domain/attendance-type/attendance-type.service';
import { DailyEventSummary } from '../../../../../domain/daily-event-summary/daily-event-summary.entity';
import { MonthlyEventSummary } from '../../../../../domain/monthly-event-summary/monthly-event-summary.entity';
import { UsedAttendance } from '../../../../../domain/used-attendance/used-attendance.entity';
import { Employee } from '@libs/modules/employee/employee.entity';
import { startOfMonth, endOfMonth, format, isBefore, isAfter } from 'date-fns';

/**
 * 월간 요약 생성 핸들러
 *
 * flow.md의 "파일내용 반영 후 처리" 흐름 중 월간 요약 생성 부분을 구현합니다.
 *
 * 선택된 연도-월 에 대한 daily-event-summary 정보들을 가져와서 monthly-event-summary를 생성한다
 * 일간 요약들과 월간 요약을 관계형성하여 연결한다
 */
@CommandHandler(GenerateMonthlySummariesCommand)
export class GenerateMonthlySummariesHandler implements ICommandHandler<
    GenerateMonthlySummariesCommand,
    IGenerateMonthlySummariesResponse
> {
    private readonly logger = new Logger(GenerateMonthlySummariesHandler.name);

    constructor(
        private readonly monthlyEventSummaryService: DomainMonthlyEventSummaryService,
        private readonly dailyEventSummaryService: DomainDailyEventSummaryService,
        private readonly usedAttendanceService: DomainUsedAttendanceService,
        private readonly attendanceTypeService: DomainAttendanceTypeService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(command: GenerateMonthlySummariesCommand): Promise<IGenerateMonthlySummariesResponse> {
        const { year, month, performedBy } = command.data;

        return await this.dataSource.transaction(async (manager) => {
            try {
                // 날짜 범위 계산
                const yearNum = parseInt(year);
                const monthNum = parseInt(month);
                const startDate = startOfMonth(new Date(yearNum, monthNum - 1, 1));
                const endDate = endOfMonth(new Date(yearNum, monthNum - 1, 1));
                const startDateStr = format(startDate, 'yyyy-MM-dd');
                const endDateStr = format(endDate, 'yyyy-MM-dd');
                const yyyymm = `${year}-${month.padStart(2, '0')}`;

                // 1. 해당 연월에 일간 요약이 있는 모든 직원 ID 조회
                const employeesWithDailySummaries = await manager
                    .createQueryBuilder(DailyEventSummary, 'daily')
                    .select('DISTINCT daily.employee_id', 'employeeId')
                    .where('daily.deleted_at IS NULL')
                    .andWhere('daily.date >= :startDate', { startDate: startDateStr })
                    .andWhere('daily.date <= :endDate', { endDate: endDateStr })
                    .andWhere('daily.employee_id IS NOT NULL')
                    .getRawMany();

                const allEmployeeIds = employeesWithDailySummaries
                    .map((row) => row.employeeId)
                    .filter((id) => id !== null);

                this.logger.log(
                    `월간 요약 생성 시작: year=${year}, month=${month}, 일간 요약이 있는 직원 수=${allEmployeeIds.length}`,
                );

                if (allEmployeeIds.length === 0) {
                    this.logger.warn(`해당 연월에 일간 요약이 있는 직원이 없습니다. year=${year}, month=${month}`);
                    return {
                        success: true,
                        statistics: {
                            monthlyEventSummaryCount: 0,
                        },
                    };
                }

                // 2. 근태 유형 목록 조회 (한 번만 조회)
                const allAttendanceTypes = await this.attendanceTypeService.목록조회한다();

                // 3. 근태 사용 내역 조회 (날짜 범위, 모든 직원)
                const usedAttendances = await manager
                    .createQueryBuilder(UsedAttendance, 'ua')
                    .leftJoinAndSelect('ua.attendanceType', 'at')
                    .where('ua.deleted_at IS NULL')
                    .andWhere('ua.used_at >= :startDate', { startDate: startDateStr })
                    .andWhere('ua.used_at <= :endDate', { endDate: endDateStr })
                    .andWhere('ua.employee_id IN (:...employeeIds)', { employeeIds: allEmployeeIds })
                    .getMany();

                // 4. 직원별로 월간 요약 생성
                let monthlyEventSummaryCount = 0;

                for (const employeeId of allEmployeeIds) {
                    // 일간 요약 조회 (직원별, 날짜 범위)
                    const dailySummaries = await manager
                        .createQueryBuilder(DailyEventSummary, 'daily')
                        .leftJoinAndSelect('daily.employee', 'employee')
                        .where('daily.deleted_at IS NULL')
                        .andWhere('daily.employee_id = :employeeId', { employeeId })
                        .andWhere('daily.date >= :startDate', { startDate: startDateStr })
                        .andWhere('daily.date <= :endDate', { endDate: endDateStr })
                        .orderBy('daily.date', 'ASC')
                        .getMany();

                    if (dailySummaries.length === 0) {
                        this.logger.warn(`일간 요약이 없습니다. employeeId=${employeeId}, yyyymm=${yyyymm}`);
                        continue;
                    }

                    // 해당 직원의 근태 사용 내역 필터링
                    const employeeUsedAttendances = usedAttendances.filter((ua) => ua.employee_id === employeeId);

                    try {
                        // 5. 월간 요약 생성 또는 업데이트 (외부 트랜잭션의 manager 사용)
                        const monthlySummary = await this.monthlyEventSummaryService.생성또는갱신한다(
                            employeeId,
                            yyyymm,
                            dailySummaries,
                            employeeUsedAttendances,
                            allAttendanceTypes,
                            { manager }, // EntityManager를 전달
                        );

                        // 6. 월간 요약 노트 생성
                        const employee = dailySummaries[0]?.employee;
                        if (employee) {
                            const attendanceResult = {
                                lateDetails: monthlySummary.lateDetails || [],
                                absenceDetails: monthlySummary.absenceDetails || [],
                                earlyLeaveDetails: monthlySummary.earlyLeaveDetails || [],
                            };
                            const note = this.월간요약노트를생성한다(employee, year, month, attendanceResult);
                            if (note) {
                                // DTO가 아닌 엔티티를 조회하여 수정
                                const monthlySummaryEntity = await manager.findOne(MonthlyEventSummary, {
                                    where: { id: monthlySummary.id },
                                });
                                if (monthlySummaryEntity) {
                                    monthlySummaryEntity.note = note;
                                    await manager.save(MonthlyEventSummary, monthlySummaryEntity);
                                }
                            }
                        }

                        // 7. 일간 요약들의 monthly_event_summary_id 업데이트
                        for (const dailySummary of dailySummaries) {
                            dailySummary.업데이트한다(monthlySummary.id);
                            dailySummary.수정자설정한다(performedBy);
                            dailySummary.메타데이터업데이트한다(performedBy);
                        }

                        await manager.save(DailyEventSummary, dailySummaries);
                        monthlyEventSummaryCount++;
                    } catch (error) {
                        this.logger.error(
                            `월간 요약 생성 실패 (employeeId=${employeeId}, yyyymm=${yyyymm}): ${error.message}`,
                            error.stack,
                        );
                        throw error;
                    }
                }

                this.logger.log(`✅ 월간 요약 생성 완료: ${monthlyEventSummaryCount}건`);

                return {
                    success: true,
                    statistics: {
                        monthlyEventSummaryCount,
                    },
                };
            } catch (error) {
                this.logger.error(`월간 요약 생성 실패: ${error.message}`, error.stack);
                throw error;
            }
        });
    }

    /**
     * 월간 요약 노트를 생성한다
     *
     * 입사일, 퇴사일, 지각 횟수, 결근 횟수, 조퇴 횟수를 노트에 추가합니다.
     */
    private 월간요약노트를생성한다(
        employee: Employee,
        year: string,
        month: string,
        attendanceResult: {
            lateDetails: any[];
            absenceDetails: any[];
            earlyLeaveDetails: any[];
        },
    ): string {
        let newNote = ''; // note가 null인 경우 빈 문자열로 초기화

        // 요청 년월에 입사하거나 퇴사한 직원의 월간 근태 요약에 메모 추가
        const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
        const endDate = endOfMonth(new Date(parseInt(year), parseInt(month) - 1));

        // 입사가 시작과 종료사이 범위에 있는 직원의 월간 근태 요약에 메모 추가
        if (employee.hireDate && isBefore(employee.hireDate, endDate) && isAfter(employee.hireDate, startDate)) {
            newNote += `${format(employee.hireDate, 'yyyy-MM-dd')} 입사\n`;
        }

        if (
            employee.terminationDate &&
            isBefore(employee.terminationDate, endDate) &&
            isAfter(employee.terminationDate, startDate)
        ) {
            newNote += `${format(employee.terminationDate, 'yyyy-MM-dd')} 퇴사\n`;
        }

        if (attendanceResult.lateDetails.length > 0) {
            newNote += `${attendanceResult.lateDetails.length}회 지각\n`;
        }

        if (attendanceResult.absenceDetails.length > 0) {
            newNote += `${attendanceResult.absenceDetails.length}회 결근\n`;
        }

        if (attendanceResult.earlyLeaveDetails.length > 0) {
            newNote += `${attendanceResult.earlyLeaveDetails.length}회 조퇴\n`;
        }

        return newNote.trim();
    }
}
