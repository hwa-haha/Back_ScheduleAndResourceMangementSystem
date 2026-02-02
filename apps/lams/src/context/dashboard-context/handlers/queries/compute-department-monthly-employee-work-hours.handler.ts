import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ComputeDepartmentMonthlyEmployeeWorkHoursQuery } from './compute-department-monthly-employee-work-hours.query';
import { IGetDepartmentMonthlyEmployeeWorkHoursResponse } from '../../interfaces/response/get-department-monthly-employee-work-hours-response.interface';

/**
 * 부서별 월별 직원별 근무시간 계산 Handler (선택된 child 기반)
 */
@QueryHandler(ComputeDepartmentMonthlyEmployeeWorkHoursQuery)
export class ComputeDepartmentMonthlyEmployeeWorkHoursHandler implements IQueryHandler<
    ComputeDepartmentMonthlyEmployeeWorkHoursQuery,
    IGetDepartmentMonthlyEmployeeWorkHoursResponse
> {
    private readonly logger = new Logger(ComputeDepartmentMonthlyEmployeeWorkHoursHandler.name);

    async execute(
        query: ComputeDepartmentMonthlyEmployeeWorkHoursQuery,
    ): Promise<IGetDepartmentMonthlyEmployeeWorkHoursResponse> {
        const { departmentId, year, month, selectedChildren } = query.data;
        const monthStr = month.padStart(2, '0');

        this.logger.log(
            `부서별 월별 직원별 근무시간 계산: departmentId=${departmentId}, year=${year}, month=${monthStr}`,
        );

        const monthEmployeeWorkHoursMap = new Map<
            string,
            {
                employeeId: string;
                employeeName: string;
                employeeNumber: string;
                totalWorkHours: number;
                lateCount: number;
                earlyLeaveCount: number;
                weeklyWorkHours: Array<{
                    weekNumber: number;
                    startDate: string;
                    endDate: string;
                    weeklyWorkHours: number;
                    lateCount: number;
                    earlyLeaveCount: number;
                    absentCount: number;
                }>;
            }
        >();

        selectedChildren.forEach((child) => {
            try {
                const snapshotData =
                    typeof child.snapshot_data === 'string' ? JSON.parse(child.snapshot_data) : child.snapshot_data;
                const totalWorkTimeValue = snapshotData.totalWorkTime || 0;
                const attendanceTypeCount = snapshotData.attendanceTypeCount || {};
                const weeklyWorkTimeSummary = snapshotData.weeklyWorkTimeSummary || [];
                const dailyWorkTimeSummary = snapshotData.dailySummaries || [];

                const employeeId = child.employee_id;
                if (!monthEmployeeWorkHoursMap.has(employeeId)) {
                    monthEmployeeWorkHoursMap.set(employeeId, {
                        employeeId,
                        employeeName: child.employee_name || '',
                        employeeNumber: child.employee_number || '',
                        totalWorkHours: 0,
                        lateCount: 0,
                        earlyLeaveCount: 0,
                        weeklyWorkHours: [],
                    });
                }
                const workHours = monthEmployeeWorkHoursMap.get(employeeId)!;
                workHours.totalWorkHours += totalWorkTimeValue;
                workHours.lateCount += attendanceTypeCount['지각'] || 0;
                workHours.earlyLeaveCount += attendanceTypeCount['조퇴'] || 0;
                weeklyWorkTimeSummary.forEach((week: any) => {
                    const startDate = week.startDate || '';
                    const endDate = week.endDate || '';
                    const weekDailySummaries = dailyWorkTimeSummary.filter((d: any) => {
                        const date = d.date ?? d.date_str ?? '';
                        return date >= startDate && date <= endDate;
                    });
                    const lateCount = weekDailySummaries.filter(
                        (d: any) => d.isLate === true || d.is_late === true,
                    ).length;
                    const earlyLeaveCount = weekDailySummaries.filter(
                        (d: any) => d.isEarlyLeave === true || d.is_early_leave === true,
                    ).length;
                    const absentCount = weekDailySummaries.filter(
                        (d: any) => d.isAbsent === true || d.is_absent === true,
                    ).length;
                    workHours.weeklyWorkHours.push({
                        weekNumber: week.weekNumber || 0,
                        startDate,
                        endDate,
                        weeklyWorkHours: Math.round(((week.weeklyWorkTime || 0) / 60) * 100) / 100,
                        lateCount,
                        earlyLeaveCount,
                        absentCount,
                    });
                });
            } catch (error) {
                this.logger.warn(`스냅샷 데이터 파싱 실패: childId=${child.id}, error=${(error as Error).message}`);
            }
        });

        const employeeWorkHours = Array.from(monthEmployeeWorkHoursMap.values())
            .map((e) => ({
                ...e,
                totalWorkHours: Math.round((e.totalWorkHours / 60) * 100) / 100,
                weeklyWorkHours: e.weeklyWorkHours.sort((a, b) => a.weekNumber - b.weekNumber),
            }))
            .sort((a, b) => b.totalWorkHours - a.totalWorkHours);

        return {
            departmentId,
            year,
            month: monthStr,
            employeeWorkHours,
        };
    }
}
