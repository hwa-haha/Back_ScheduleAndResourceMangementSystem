import { Injectable, Logger } from '@nestjs/common';
import { WorkHoursContextService } from '../../context/work-hours-context/work-hours-context.service';
import { SettingsContextService } from '../../context/settings-context/settings-context.service';
import {
    IGetMonthlyWorkHoursQuery,
    IGetProjectListQuery,
    IGetEmployeeWithAssignedProjectsQuery,
    IReplaceProjectAssignmentsCommand,
    ICreateWorkHoursCommand,
    IDeleteWorkHoursByDateCommand,
} from '../../context/work-hours-context/interfaces';
import {
    IGetWageCalculationTypeListQuery,
    ICreateWageCalculationTypeCommand,
    IGetWageCalculationTypeListResponse,
    ICreateWageCalculationTypeResponse,
} from '../../context/settings-context/interfaces';
import { AssignedProjectDTO } from '../../domain/assigned-project/assigned-project.types';
import { WorkHoursDTO } from '../../domain/work-hours/work-hours.types';

/**
 * 시수 비즈니스 서비스
 *
 * 시수 관련 비즈니스 로직을 오케스트레이션합니다.
 */
@Injectable()
export class WorkHoursBusinessService {
    private readonly logger = new Logger(WorkHoursBusinessService.name);

    constructor(
        private readonly workHoursContextService: WorkHoursContextService,
        private readonly settingsContextService: SettingsContextService,
    ) {}

    /**
     * 직원의 프로젝트 할당을 일괄 갱신한다
     * 기존 할당은 소프트 삭제하고, 요청한 프로젝트 목록으로 새로 생성한다 (시수 이력 보존)
     */
    async 직원프로젝트할당일괄갱신한다(
        command: IReplaceProjectAssignmentsCommand,
    ): Promise<{ assignedProjects: AssignedProjectDTO[] }> {
        this.logger.log(
            `프로젝트 할당 일괄 갱신: employeeId=${command.employeeId}, projects=${command.projects.length}건`,
        );
        return await this.workHoursContextService.직원프로젝트할당일괄갱신한다(command);
    }

    /**
     * 시수를 입력한다
     */
    async 시수입력한다(
        assignedProjectId: string,
        date: string,
        startTime?: string,
        endTime?: string,
        workMinutes?: number,
        note?: string,
        userId?: string,
    ): Promise<WorkHoursDTO> {
        this.logger.log(`시수 입력: assignedProjectId=${assignedProjectId}, date=${date}`);
        const command: ICreateWorkHoursCommand = {
            assignedProjectId,
            date,
            startTime,
            endTime,
            workMinutes,
            note,
            performedBy: userId,
        };
        const result = await this.workHoursContextService.시수입력한다(command);
        return result.workHours;
    }

    /**
     * 해당 날짜의 모든 시수를 삭제한다
     */
    async 날짜별시수삭제한다(date: string, userId: string): Promise<void> {
        this.logger.log(`날짜별 시수 삭제: date=${date}`);
        const command: IDeleteWorkHoursByDateCommand = {
            date,
            performedBy: userId,
        };
        await this.workHoursContextService.날짜별시수삭제한다(command);
    }

    /**
     * 월별 시수 현황을 조회한다
     */
    async 월별시수현황조회한다(
        employeeId: string,
        year: string,
        month: string,
    ): Promise<{
        employeeId: string;
        year: string;
        month: string;
        workHours: Array<{
            projectId: string;
            projectName: string;
            projectCode: string;
            date: string;
            startTime: string | null;
            endTime: string | null;
            workMinutes: number;
            note: string | null;
        }>;
        totalWorkMinutes: number;
    }> {
        this.logger.log(`월별 시수 현황 조회: employeeId=${employeeId}, year=${year}, month=${month}`);
        const query: IGetMonthlyWorkHoursQuery = {
            employeeId,
            year,
            month,
        };
        return await this.workHoursContextService.월별시수현황조회한다(query);
    }

    /**
     * 일별 시수 상세를 조회한다
     *
     * 해당 날짜의 시수만 필터링하여 반환한다.
     */
    async 일별시수상세조회한다(
        employeeId: string,
        date: string,
    ): Promise<{
        employeeId: string;
        date: string;
        workHours: Array<{
            projectId: string;
            projectName: string;
            projectCode: string;
            date: string;
            startTime: string | null;
            endTime: string | null;
            workMinutes: number;
            note: string | null;
        }>;
        totalWorkMinutes: number;
    }> {
        this.logger.log(`일별 시수 상세 조회: employeeId=${employeeId}, date=${date}`);
        const [year, month] = date.split('-');
        const monthly = await this.workHoursContextService.월별시수현황조회한다({
            employeeId,
            year,
            month: month!.padStart(2, '0'),
        });
        const dayItems = monthly.workHours.filter((w) => w.date === date);
        const totalWorkMinutes = dayItems.reduce((sum, w) => sum + w.workMinutes, 0);
        return {
            employeeId: monthly.employeeId,
            date,
            workHours: dayItems,
            totalWorkMinutes,
        };
    }

    /**
     * 직원 목록과 각 직원에게 할당된 프로젝트를 조회한다
     */
    async 직원목록및할당프로젝트조회한다(query: IGetEmployeeWithAssignedProjectsQuery): Promise<{
        employees: Array<{
            id: string;
            employeeNumber: string;
            employeeName: string;
            email?: string | null;
            departments: Array<{
                id: string;
                departmentName: string;
                departmentCode: string;
            }>;
            assignedProjects: Array<{
                id: string;
                projectId: string;
                projectName: string;
                projectCode: string;
            }>;
        }>;
        totalCount: number;
    }> {
        this.logger.log('직원 목록 및 할당 프로젝트 조회');
        return await this.workHoursContextService.직원목록및할당프로젝트조회한다(query);
    }

    /**
     * 프로젝트 목록을 조회한다
     */
    async 프로젝트목록조회한다(): Promise<{
        projects: Array<{
            id: string;
            projectCode: string;
            projectName: string;
            description: string | null;
            isActive: boolean;
        }>;
        totalCount: number;
    }> {
        this.logger.log('프로젝트 목록 조회');
        const query: IGetProjectListQuery = {};
        return await this.workHoursContextService.프로젝트목록조회한다(query);
    }

    /**
     * 임금 계산 유형 목록을 조회한다
     */
    async 임금계산유형목록을조회한다(
        query: IGetWageCalculationTypeListQuery,
    ): Promise<IGetWageCalculationTypeListResponse> {
        return await this.settingsContextService.임금계산유형목록을조회한다(query);
    }

    /**
     * 임금 계산 유형을 생성한다
     */
    async 임금계산유형을생성한다(
        command: ICreateWageCalculationTypeCommand,
    ): Promise<ICreateWageCalculationTypeResponse> {
        return await this.settingsContextService.임금계산유형을생성한다(command);
    }
}
