import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ComputeDepartmentMonthlyAveragesQuery } from './compute-department-monthly-averages.query';
import { IGetDepartmentMonthlyAverageWorkHoursResponse } from '../../interfaces/response/get-department-monthly-average-work-hours-response.interface';

/**
 * 부서별 월별 일평균 근무시간 계산 Handler (선택된 child 배열 기반)
 */
@QueryHandler(ComputeDepartmentMonthlyAveragesQuery)
export class ComputeDepartmentMonthlyAveragesHandler implements IQueryHandler<
    ComputeDepartmentMonthlyAveragesQuery,
    IGetDepartmentMonthlyAverageWorkHoursResponse
> {
    private readonly logger = new Logger(ComputeDepartmentMonthlyAveragesHandler.name);

    async execute(
        query: ComputeDepartmentMonthlyAveragesQuery,
    ): Promise<IGetDepartmentMonthlyAverageWorkHoursResponse> {
        const { departmentId, year, monthlySelections } = query.data;

        this.logger.log(`부서별 월별 일평균 계산: departmentId=${departmentId}, year=${year}`);

        const monthlyAverages = monthlySelections.map(({ month, selectedChildren }) => {
            let totalWorkTime = 0;
            let totalWorkDays = 0;
            selectedChildren.forEach((child) => {
                try {
                    const snapshotData =
                        typeof child.snapshot_data === 'string' ? JSON.parse(child.snapshot_data) : child.snapshot_data;
                    totalWorkTime += snapshotData.totalWorkTime || 0;
                    totalWorkDays += snapshotData.workDaysCount || 0;
                } catch {
                    // 무시
                }
            });
            const averageWorkHours = totalWorkDays > 0 ? totalWorkTime / totalWorkDays / 60 : 0;
            return {
                month,
                averageWorkHours: Math.round(averageWorkHours * 100) / 100,
            };
        });

        return {
            departmentId,
            year,
            monthlyAverages,
        };
    }
}
