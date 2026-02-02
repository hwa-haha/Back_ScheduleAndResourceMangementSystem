import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { GetDailyWorkHoursQuery } from './get-daily-work-hours.query';
import { IGetDailyWorkHoursResponse } from '../../../interfaces/response/get-daily-work-hours-response.interface';
import { DomainAssignedProjectService } from '../../../../../domain/assigned-project/assigned-project.service';
import { DomainWorkHoursService } from '../../../../../domain/work-hours/work-hours.service';
import { DomainProjectService } from '../../../../../domain/project/project.service';

/**
 * 일별 시수 조회 Query Handler
 *
 * 해당 날짜에 해당하는 직원의 시수 정보 전체를 조회한다.
 */
@QueryHandler(GetDailyWorkHoursQuery)
export class GetDailyWorkHoursHandler implements IQueryHandler<GetDailyWorkHoursQuery, IGetDailyWorkHoursResponse> {
    private readonly logger = new Logger(GetDailyWorkHoursHandler.name);

    constructor(
        private readonly assignedProjectService: DomainAssignedProjectService,
        private readonly workHoursService: DomainWorkHoursService,
        private readonly projectService: DomainProjectService,
    ) {}

    async execute(query: GetDailyWorkHoursQuery): Promise<IGetDailyWorkHoursResponse> {
        const { employeeId, date } = query.data;

        this.logger.log(`일별 시수 조회: employeeId=${employeeId}, date=${date}`);

        const assignedProjects = await this.assignedProjectService.직원ID로조회한다(employeeId);

        const allWorkHours: Array<{
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
            const workHoursList = await this.workHoursService.날짜범위로조회한다(assignedProject.id, date, date);

            const project = await this.projectService.ID로조회한다(assignedProject.projectId);

            for (const workHours of workHoursList) {
                allWorkHours.push({
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

        allWorkHours.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

        this.logger.log(
            `일별 시수 조회 완료: totalWorkHours=${allWorkHours.length}, totalWorkMinutes=${totalWorkMinutes}`,
        );

        return {
            employeeId,
            date,
            workHours: allWorkHours,
            totalWorkMinutes,
        };
    }
}
