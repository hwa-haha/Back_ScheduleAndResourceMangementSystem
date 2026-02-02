import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetDepartmentWeeklyTopEmployeesQuery } from './get-department-weekly-top-employees.query';
import { IGetDepartmentWeeklyTopEmployeesResponse } from '../../interfaces';
import { MonthlyEventSummary } from '../../../../domain/monthly-event-summary/monthly-event-summary.entity';
import { EmployeeDepartmentPositionHistory } from '@libs/modules/employee-department-position-history/employee-department-position-history.entity';
import { format, startOfMonth, endOfMonth } from 'date-fns';

/**
 * 부서별 월별 주차별 주간근무시간 상위 5명 조회 Query Handler
 *
 * 각 주차별로 주간근무시간이 높은 상위 5명의 직원을 조회합니다.
 */
@QueryHandler(GetDepartmentWeeklyTopEmployeesQuery)
export class GetDepartmentWeeklyTopEmployeesHandler implements IQueryHandler<
    GetDepartmentWeeklyTopEmployeesQuery,
    IGetDepartmentWeeklyTopEmployeesResponse
> {
    private readonly logger = new Logger(GetDepartmentWeeklyTopEmployeesHandler.name);

    constructor(private readonly dataSource: DataSource) {}

    async execute(query: GetDepartmentWeeklyTopEmployeesQuery): Promise<IGetDepartmentWeeklyTopEmployeesResponse> {
        const { departmentId, year, month } = query.data;

        this.logger.log(
            `부서별 월별 주차별 주간근무시간 상위 5명 조회: departmentId=${departmentId}, year=${year}, month=${month}`,
        );

        // 1. 부서별 직원 목록 조회 (해당 월 1일부터 말일까지의 범위)
        const startDate = format(startOfMonth(new Date(`${year}-${month}-01`)), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(new Date(`${year}-${month}-01`)), 'yyyy-MM-dd');

        const employeeHistories = await this.dataSource.manager
            .createQueryBuilder('EmployeeDepartmentPositionHistory', 'eh')
            .leftJoinAndSelect('eh.employee', 'emp')
            .leftJoinAndSelect('eh.position', 'pos')
            .leftJoinAndSelect('eh.rank', 'rank')
            .where('eh.departmentId = :departmentId', { departmentId })
            .andWhere('eh.effectiveStartDate <= :endDate', { endDate })
            .andWhere('(eh.effectiveEndDate IS NULL OR eh.effectiveEndDate >= :startDate)', { startDate })
            .getMany();

        const employeeIds = employeeHistories.map((eh) => eh.employeeId).filter((id) => id);

        if (employeeIds.length === 0) {
            return {
                departmentId,
                year,
                month,
                weeklyTopEmployees: [],
            };
        }

        // 2. 해당 월의 월간 요약 조회
        const yyyymm = `${year}-${month}`;
        const summaries = await this.dataSource.manager
            .createQueryBuilder(MonthlyEventSummary, 'summary')
            .leftJoinAndSelect('summary.employee', 'employee')
            .where('summary.yyyymm = :yyyymm', { yyyymm })
            .andWhere('summary.deleted_at IS NULL')
            .andWhere('summary.employee_id IN (:...employeeIds)', { employeeIds })
            .getMany();

        // 3. 주차별로 그룹화하고 상위 5명 추출
        const weeklyTopEmployees: Array<{
            week: number;
            topEmployees: Array<{
                employeeId: string;
                employeeName: string;
                employeeNumber: string;
                weeklyWorkHours: number;
            }>;
        }> = [];

        // 주차별 데이터 수집
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

        summaries.forEach((summary) => {
            const weeklyWorkTimeSummary = summary.weekly_work_time_summary || [];
            const employeeId = summary.employee_id;
            const employeeName = summary.employee?.name || '';
            const employeeNumber = summary.employee_number || '';

            weeklyWorkTimeSummary.forEach((week: any) => {
                const weekNumber = week.weekNumber;
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
        });

        // 주차별 상위 5명 추출
        weekDataMap.forEach((weekData, weekNumber) => {
            const topEmployees = Array.from(weekData.values())
                .map((e) => ({
                    ...e,
                    weeklyWorkHours: Math.round((e.weeklyWorkHours / 60) * 100) / 100, // 분을 시간으로 변환
                }))
                .sort((a, b) => b.weeklyWorkHours - a.weeklyWorkHours)
                .slice(0, 5);

            weeklyTopEmployees.push({
                week: weekNumber,
                topEmployees,
            });
        });

        // 주차 번호로 정렬
        weeklyTopEmployees.sort((a, b) => a.week - b.week);

        return {
            departmentId,
            year,
            month,
            weeklyTopEmployees,
        };
    }
}
