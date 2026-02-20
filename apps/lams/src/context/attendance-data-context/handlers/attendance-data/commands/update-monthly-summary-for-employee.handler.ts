import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UpdateMonthlySummaryForEmployeeCommand } from './update-monthly-summary-for-employee.command';
import { IUpdateMonthlySummaryForEmployeeResponse } from '../../../interfaces/response/update-monthly-summary-for-employee-response.interface';
import { DomainMonthlyEventSummaryService } from '../../../../../domain/monthly-event-summary/monthly-event-summary.service';
import { DomainAttendanceTypeService } from '../../../../../domain/attendance-type/attendance-type.service';
import { DailyEventSummary } from '../../../../../domain/daily-event-summary/daily-event-summary.entity';
import { MonthlyEventSummary } from '../../../../../domain/monthly-event-summary/monthly-event-summary.entity';
import { UsedAttendance } from '../../../../../domain/used-attendance/used-attendance.entity';
import { Employee } from '@libs/modules/employee/employee.entity';
import { startOfMonth, endOfMonth, format, isBefore, isAfter } from 'date-fns';

/**
 * 특정 직원의 월간 요약 업데이트 핸들러
 *
 * 특정 직원의 특정 연월에 대한 월간 요약만 업데이트합니다.
 */
@CommandHandler(UpdateMonthlySummaryForEmployeeCommand)
export class UpdateMonthlySummaryForEmployeeHandler implements ICommandHandler<
    UpdateMonthlySummaryForEmployeeCommand,
    IUpdateMonthlySummaryForEmployeeResponse
> {
    private readonly logger = new Logger(UpdateMonthlySummaryForEmployeeHandler.name);

    constructor(
        private readonly monthlyEventSummaryService: DomainMonthlyEventSummaryService,
        private readonly attendanceTypeService: DomainAttendanceTypeService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(command: UpdateMonthlySummaryForEmployeeCommand): Promise<IUpdateMonthlySummaryForEmployeeResponse> {
        const { employeeId, year, month, performedBy } = command.data;

        this.logger.log(`특정 직원의 월간 요약 업데이트 시작: employeeId=${employeeId}, year=${year}, month=${month}`);

        // 날짜 범위 계산 (catch 블록에서도 사용하기 위해 밖으로 이동)
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const yyyymm = `${year}-${month.padStart(2, '0')}`;

        return await this.dataSource.transaction(async (manager) => {
            try {
                const startDate = startOfMonth(new Date(yearNum, monthNum - 1, 1));
                const endDate = endOfMonth(new Date(yearNum, monthNum - 1, 1));
                const startDateStr = format(startDate, 'yyyy-MM-dd');
                const endDateStr = format(endDate, 'yyyy-MM-dd');

                // 1. 해당 직원의 일간 요약 조회 (날짜 범위)
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
                    throw new Error(`해당 연월에 일간 요약이 없습니다. employeeId=${employeeId}, yyyymm=${yyyymm}`);
                }

                // 2. 근태 유형 목록 조회
                const allAttendanceTypes = await this.attendanceTypeService.목록조회한다();

                // 3. 해당 직원의 근태 사용 내역 조회 (날짜 범위)
                const usedAttendances = await manager
                    .createQueryBuilder(UsedAttendance, 'ua')
                    .leftJoinAndSelect('ua.attendanceType', 'at')
                    .where('ua.deleted_at IS NULL')
                    .andWhere('ua.used_at >= :startDate', { startDate: startDateStr })
                    .andWhere('ua.used_at <= :endDate', { endDate: endDateStr })
                    .andWhere('ua.employee_id = :employeeId', { employeeId })
                    .getMany();

                // 4. 월간 요약 생성 또는 업데이트
                const monthlySummary = await this.monthlyEventSummaryService.생성또는갱신한다(
                    employeeId,
                    yyyymm,
                    dailySummaries,
                    usedAttendances,
                    allAttendanceTypes,
                    { manager }, // EntityManager를 전달
                );

                // 5. 월간 요약 노트 생성
                const employee = dailySummaries[0]?.employee;
                if (employee) {
                    const attendanceResult = {
                        lateDetails: monthlySummary.lateDetails || [],
                        absenceDetails: monthlySummary.absenceDetails || [],
                        earlyLeaveDetails: monthlySummary.earlyLeaveDetails || [],
                    };
                    const note = this.월간요약노트를생성한다(employee, year, month, attendanceResult);
                    const monthlySummaryEntity = await manager.findOne(MonthlyEventSummary, {
                        where: { id: monthlySummary.id },
                    });
                    if (monthlySummaryEntity) {
                        monthlySummaryEntity.note = note;
                        await manager.save(MonthlyEventSummary, monthlySummaryEntity);
                    }
                }

                // 6. 일간 요약들의 monthly_event_summary_id 업데이트
                for (const dailySummary of dailySummaries) {
                    dailySummary.업데이트한다(monthlySummary.id);
                    dailySummary.수정자설정한다(performedBy);
                    dailySummary.메타데이터업데이트한다(performedBy);
                }

                await manager.save(DailyEventSummary, dailySummaries);

                // 7. 업데이트된 월간 요약 엔티티 조회
                const updatedMonthlySummary = await manager.findOne(MonthlyEventSummary, {
                    where: { id: monthlySummary.id },
                });

                if (!updatedMonthlySummary) {
                    throw new Error(`월간 요약을 찾을 수 없습니다. id=${monthlySummary.id}`);
                }

                this.logger.log(`특정 직원의 월간 요약 업데이트 완료: employeeId=${employeeId}, yyyymm=${yyyymm}`);

                return {
                    monthlySummary: updatedMonthlySummary.DTO변환한다(),
                };
            } catch (error) {
                const errorYyyymm = `${year}-${month.padStart(2, '0')}`;
                this.logger.error(
                    `특정 직원의 월간 요약 업데이트 실패 (employeeId=${employeeId}, yyyymm=${errorYyyymm}): ${error.message}`,
                    error.stack,
                );
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
