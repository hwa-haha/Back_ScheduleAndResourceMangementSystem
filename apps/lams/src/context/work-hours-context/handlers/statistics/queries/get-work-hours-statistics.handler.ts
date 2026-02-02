import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { startOfMonth, endOfMonth, format, getDaysInMonth } from 'date-fns';
import { GetWorkHoursStatisticsQuery } from './get-work-hours-statistics.query';
import {
    IGetWorkHoursStatisticsResponse,
    IWorkHoursStatisticsItem,
} from '../../../interfaces/response/get-work-hours-statistics-response.interface';
import { DomainWorkHoursService } from '../../../../../domain/work-hours/work-hours.service';

/**
 * 시수 통계 조회 Query Handler
 *
 * 직원 결정이 완료된 페이로드(직원 ID·정보)를 받아 월별 시수 합계만 수행합니다.
 */
@QueryHandler(GetWorkHoursStatisticsQuery)
export class GetWorkHoursStatisticsHandler implements IQueryHandler<
    GetWorkHoursStatisticsQuery,
    IGetWorkHoursStatisticsResponse
> {
    private readonly logger = new Logger(GetWorkHoursStatisticsHandler.name);

    constructor(private readonly workHoursService: DomainWorkHoursService) {}

    async execute(query: GetWorkHoursStatisticsQuery): Promise<IGetWorkHoursStatisticsResponse> {
        const { year, month, employeeIds: targetEmployeeIds, employeeInfoItems } = query.data;
        const monthStr = month.padStart(2, '0');

        this.logger.log(`시수 통계 조회: year=${year}, month=${monthStr}, 직원 수=${targetEmployeeIds.length}`);

        if (targetEmployeeIds.length === 0) {
            return { year, month: monthStr, items: [] };
        }

        const employeeInfoMap = new Map(
            employeeInfoItems.map((item) => [
                item.employeeId,
                {
                    employeeName: item.employeeName,
                    employeeNumber: item.employeeNumber,
                    departmentName: item.departmentName,
                },
            ]),
        );

        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(monthStr, 10);
        const startDate = format(startOfMonth(new Date(yearNum, monthNum - 1, 1)), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(new Date(yearNum, monthNum - 1, 1)), 'yyyy-MM-dd');

        // 월별 직원별 일별 시수 합계 조회
        const dailyRows = await this.workHoursService.월별직원별일별시수합계조회한다(
            targetEmployeeIds,
            startDate,
            endDate,
        );

        // 직원별·일별 분(minutes) 맵: employeeId -> day(1..31) -> minutes
        const dailyMinutesByEmployee = new Map<string, Map<number, number>>();
        for (const r of dailyRows) {
            if (!dailyMinutesByEmployee.has(r.employeeId)) {
                dailyMinutesByEmployee.set(r.employeeId, new Map());
            }
            // DB 드라이버가 date를 Date 객체로 반환할 수 있음. 로컬 날짜 기준으로 처리(UTC 사용 시 타임존으로 하루 밀림)
            const dateStr = typeof r.date === 'string' ? r.date : format(r.date as Date, 'yyyy-MM-dd');
            const day = parseInt(dateStr.slice(8, 10), 10) || 1;
            const map = dailyMinutesByEmployee.get(r.employeeId)!;
            map.set(day, (map.get(day) ?? 0) + r.totalMinutes);
        }

        // 5. 응답 구성: 직원 정보 + 일자별 { date, workHours } + 총 시수(시간)
        const lastDay = getDaysInMonth(new Date(yearNum, monthNum - 1, 1));
        const items: IWorkHoursStatisticsItem[] = targetEmployeeIds.map((employeeId) => {
            const info = employeeInfoMap.get(employeeId)!;
            const dayMap = dailyMinutesByEmployee.get(employeeId);
            const dailyWorkHours: { date: string; workHours: number }[] = [];
            let totalMinutes = 0;
            for (let day = 1; day <= lastDay; day++) {
                const dateStr = `${year}-${monthStr}-${day.toString().padStart(2, '0')}`;
                const minutes = dayMap?.get(day) ?? 0;
                totalMinutes += minutes;
                dailyWorkHours.push({
                    date: dateStr,
                    workHours: Math.round((minutes / 60) * 100) / 100,
                });
            }
            const totalWorkHours = Math.round((totalMinutes / 60) * 100) / 100;
            return {
                employeeId,
                employeeName: info.employeeName,
                employeeNumber: info.employeeNumber,
                departmentName: info.departmentName,
                dailyWorkHours,
                totalWorkHours,
            };
        });
        return { year, month: monthStr, items };
    }
}
