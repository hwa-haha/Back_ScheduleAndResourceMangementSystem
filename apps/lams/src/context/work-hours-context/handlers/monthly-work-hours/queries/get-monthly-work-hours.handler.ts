import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { endOfMonth, format } from 'date-fns';
import { GetMonthlyWorkHoursQuery } from './get-monthly-work-hours.query';
import { IGetMonthlyWorkHoursResponse } from '../../../interfaces/response/get-monthly-work-hours-response.interface';
import { DomainAssignedProjectService } from '../../../../../domain/assigned-project/assigned-project.service';
import { DomainWorkHoursService } from '../../../../../domain/work-hours/work-hours.service';
import { DomainProjectService } from '../../../../../domain/project/project.service';

/**
 * 월별 시수 현황 조회 Query Handler
 */
@QueryHandler(GetMonthlyWorkHoursQuery)
export class GetMonthlyWorkHoursHandler implements IQueryHandler<
    GetMonthlyWorkHoursQuery,
    IGetMonthlyWorkHoursResponse
> {
    private readonly logger = new Logger(GetMonthlyWorkHoursHandler.name);

    constructor(
        private readonly assignedProjectService: DomainAssignedProjectService,
        private readonly workHoursService: DomainWorkHoursService,
        private readonly projectService: DomainProjectService,
    ) {}

    async execute(query: GetMonthlyWorkHoursQuery): Promise<IGetMonthlyWorkHoursResponse> {
        const { employeeId, year, month } = query.data;

        this.logger.log(`월별 시수 현황 조회 시작: employeeId=${employeeId}, year=${year}, month=${month}`);

        // 1. 직원의 할당된 프로젝트 목록 조회
        const assignedProjects = await this.assignedProjectService.직원ID로조회한다(employeeId);

        // 2. 각 할당된 프로젝트의 시수 조회 (월 말일 계산: 11월→30일 등)
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        const startDate = format(new Date(yearNum, monthNum - 1, 1), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(new Date(yearNum, monthNum - 1, 1)), 'yyyy-MM-dd');

        const allWorkHours: Array<{
            id: string;
            projectId: string;
            projectName: string;
            projectCode: string;
            date: string;
            startTime: string | null;
            endTime: string | null;
            workMinutes: number;
            note: string | null;
        }> = [];

        let totalWorkMinutes = 0;

        for (const assignedProject of assignedProjects) {
            const workHoursList = await this.workHoursService.날짜범위로조회한다(
                assignedProject.id,
                startDate,
                endDate,
            );

            // 프로젝트 정보 조회
            const project = await this.projectService.ID로조회한다(assignedProject.projectId);

            for (const workHours of workHoursList) {
                allWorkHours.push({
                    id: workHours.id,
                    projectId: project.id,
                    projectName: project.projectName,
                    projectCode: project.projectCode,
                    date: workHours.date,
                    startTime: workHours.startTime,
                    endTime: workHours.endTime,
                    workMinutes: workHours.workMinutes,
                    note: workHours.note,
                });
                totalWorkMinutes += workHours.workMinutes;
            }
        }

        // 날짜순으로 정렬
        allWorkHours.sort((a, b) => a.date.localeCompare(b.date));

        this.logger.log(
            `월별 시수 현황 조회 완료: totalWorkHours=${allWorkHours.length}, totalWorkMinutes=${totalWorkMinutes}`,
        );

        return {
            employeeId,
            year,
            month,
            workHours: allWorkHours,
            totalWorkMinutes,
        };
    }
}
