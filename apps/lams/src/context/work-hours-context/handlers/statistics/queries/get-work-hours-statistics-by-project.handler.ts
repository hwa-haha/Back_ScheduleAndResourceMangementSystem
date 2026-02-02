import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { startOfMonth, endOfMonth, format, getDaysInMonth } from 'date-fns';
import { GetWorkHoursStatisticsByProjectQuery } from './get-work-hours-statistics-by-project.query';
import { IGetWorkHoursStatisticsByProjectResponse } from '../../../interfaces/response/get-work-hours-statistics-by-project-response.interface';
import { IWorkHoursStatisticsByProjectItem } from '../../../interfaces/response/get-work-hours-statistics-by-project-response.interface';
import { DomainWorkHoursService } from '../../../../../domain/work-hours/work-hours.service';
import { DomainProjectService } from '../../../../../domain/project/project.service';

/**
 * 프로젝트 기준 시수 통계 조회 Query Handler
 *
 * project_id 기준으로 시수를 그룹핑하여, 해당 월 일자별 시수와 총합을 반환한다.
 */
@QueryHandler(GetWorkHoursStatisticsByProjectQuery)
export class GetWorkHoursStatisticsByProjectHandler implements IQueryHandler<
    GetWorkHoursStatisticsByProjectQuery,
    IGetWorkHoursStatisticsByProjectResponse
> {
    private readonly logger = new Logger(GetWorkHoursStatisticsByProjectHandler.name);

    constructor(
        private readonly workHoursService: DomainWorkHoursService,
        private readonly projectService: DomainProjectService,
    ) {}

    async execute(query: GetWorkHoursStatisticsByProjectQuery): Promise<IGetWorkHoursStatisticsByProjectResponse> {
        const { year, month, projectIds } = query.data;
        const monthStr = month.padStart(2, '0');

        this.logger.log(`프로젝트 기준 시수 통계 조회: year=${year}, month=${monthStr}`);

        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(monthStr, 10);
        const startDate = format(startOfMonth(new Date(yearNum, monthNum - 1, 1)), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(new Date(yearNum, monthNum - 1, 1)), 'yyyy-MM-dd');

        // 1. 전체 프로젝트 목록 조회 (필터 있으면 해당 프로젝트만)
        const allProjects = await this.projectService.목록조회한다();
        let projectList = allProjects;
        if (projectIds?.length) {
            const idSet = new Set(projectIds);
            projectList = allProjects.filter((p) => idSet.has(p.id));
        }

        // 2. 프로젝트 정보 맵 + 프로젝트별·일별 시수 맵 초기화 (시수가 없어도 조회되도록)
        const projectInfoMap = new Map<string, { projectName: string; projectCode: string }>();
        const dailyMinutesByProject = new Map<string, Map<number, number>>();
        for (const p of projectList) {
            projectInfoMap.set(p.id, { projectName: p.projectName, projectCode: p.projectCode });
            dailyMinutesByProject.set(p.id, new Map());
        }

        const projectIdsList = projectList.map((p) => p.id);
        if (projectIdsList.length === 0) {
            return { year, month: monthStr, items: [] };
        }

        // 3. 해당 월 시수 데이터로 일별 분 채우기
        const dailyRows = await this.workHoursService.월별프로젝트별일별시수합계조회한다(
            startDate,
            endDate,
            projectIds?.length ? projectIds : undefined,
        );
        for (const r of dailyRows) {
            if (!dailyMinutesByProject.has(r.projectId)) continue;
            const dateStr = typeof r.date === 'string' ? r.date : format(r.date as Date, 'yyyy-MM-dd');
            const day = parseInt(dateStr.slice(8, 10), 10) || 1;
            const map = dailyMinutesByProject.get(r.projectId)!;
            map.set(day, (map.get(day) ?? 0) + r.totalMinutes);
        }

        const lastDay = getDaysInMonth(new Date(yearNum, monthNum - 1, 1));
        const items: IWorkHoursStatisticsByProjectItem[] = projectIdsList.map((projectId) => {
            const info = projectInfoMap.get(projectId)!;
            const dayMap = dailyMinutesByProject.get(projectId);
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
                projectId,
                projectName: info.projectName,
                projectCode: info.projectCode,
                dailyWorkHours,
                totalWorkHours,
            };
        });

        return { year, month: monthStr, items };
    }
}
