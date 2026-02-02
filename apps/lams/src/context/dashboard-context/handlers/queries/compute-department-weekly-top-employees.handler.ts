import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ComputeDepartmentWeeklyTopEmployeesQuery } from './compute-department-weekly-top-employees.query';
import { IGetDepartmentWeeklyTopEmployeesResponse } from '../../interfaces/response/get-department-weekly-top-employees-response.interface';

/**
 * 부서별 월별 주차별 주간근무시간 상위 5명 계산 Handler (선택된 child 기반)
 */
@QueryHandler(ComputeDepartmentWeeklyTopEmployeesQuery)
export class ComputeDepartmentWeeklyTopEmployeesHandler implements IQueryHandler<
    ComputeDepartmentWeeklyTopEmployeesQuery,
    IGetDepartmentWeeklyTopEmployeesResponse
> {
    private readonly logger = new Logger(ComputeDepartmentWeeklyTopEmployeesHandler.name);

    async execute(query: ComputeDepartmentWeeklyTopEmployeesQuery): Promise<IGetDepartmentWeeklyTopEmployeesResponse> {
        const { departmentId, year, month, selectedChildren } = query.data;
        const monthStr = month.padStart(2, '0');

        this.logger.log(
            `부서별 월별 주차별 상위 5명 계산: departmentId=${departmentId}, year=${year}, month=${monthStr}`,
        );

        const weekDataMap = new Map<
            number,
            Map<
                string,
                {
                    employeeId: string;
                    employeeName: string;
                    employeeNumber: string;
                    weeklyWorkHours: number;
                }
            >
        >();

        selectedChildren.forEach((child) => {
            try {
                const snapshotData =
                    typeof child.snapshot_data === 'string' ? JSON.parse(child.snapshot_data) : child.snapshot_data;
                const weeklyWorkTimeSummary = snapshotData.weeklyWorkTimeSummary || [];
                const employeeId = child.employee_id;
                const employeeName = child.employee_name || '';
                const employeeNumber = child.employee_number || '';

                weeklyWorkTimeSummary.forEach((week: any) => {
                    const weekNumber = week.weekNumber ?? 0;
                    if (!weekDataMap.has(weekNumber)) {
                        weekDataMap.set(weekNumber, new Map());
                    }
                    const weekData = weekDataMap.get(weekNumber)!;
                    if (!weekData.has(employeeId)) {
                        weekData.set(employeeId, {
                            employeeId,
                            employeeName,
                            employeeNumber,
                            weeklyWorkHours: 0,
                        });
                    }
                    const employeeData = weekData.get(employeeId)!;
                    employeeData.weeklyWorkHours += week.weeklyWorkTime || 0;
                });
            } catch (error) {
                this.logger.warn(`스냅샷 데이터 파싱 실패: childId=${child.id}, error=${(error as Error).message}`);
            }
        });

        const weeklyTopEmployees: Array<{
            week: number;
            topEmployees: Array<{
                employeeId: string;
                employeeName: string;
                employeeNumber: string;
                weeklyWorkHours: number;
            }>;
        }> = [];

        weekDataMap.forEach((weekData, weekNumber) => {
            const topEmployees = Array.from(weekData.values())
                .map((e) => ({
                    ...e,
                    weeklyWorkHours: Math.round((e.weeklyWorkHours / 60) * 100) / 100,
                }))
                .sort((a, b) => b.weeklyWorkHours - a.weeklyWorkHours)
                .slice(0, 5);
            weeklyTopEmployees.push({ week: weekNumber, topEmployees });
        });

        weeklyTopEmployees.sort((a, b) => a.week - b.week);

        return {
            departmentId,
            year,
            month: monthStr,
            weeklyTopEmployees,
        };
    }
}
