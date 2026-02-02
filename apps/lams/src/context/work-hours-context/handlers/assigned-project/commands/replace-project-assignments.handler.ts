import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ReplaceProjectAssignmentsCommand } from './replace-project-assignments.command';
import { IReplaceProjectAssignmentsResponse } from '../../../interfaces/response/replace-project-assignments-response.interface';
import { DomainAssignedProjectService } from '../../../../../domain/assigned-project/assigned-project.service';

/**
 * 직원 프로젝트 할당 일괄 갱신 Handler
 *
 * 해당 직원의 기존 할당을 전부 비활성화(is_active=false)한 뒤,
 * 요청한 프로젝트 목록만 활성화(기존 행 있으면 활성화·갱신, 없으면 생성)한다.
 * 시수(work_hours)가 같은 할당 행에 연결되어 있으므로 삭제하지 않고 활성화 컬럼으로 관리한다.
 */
@CommandHandler(ReplaceProjectAssignmentsCommand)
export class ReplaceProjectAssignmentsHandler implements ICommandHandler<
    ReplaceProjectAssignmentsCommand,
    IReplaceProjectAssignmentsResponse
> {
    private readonly logger = new Logger(ReplaceProjectAssignmentsHandler.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly assignedProjectService: DomainAssignedProjectService,
    ) {}

    async execute(command: ReplaceProjectAssignmentsCommand): Promise<IReplaceProjectAssignmentsResponse> {
        const { employeeId, projects, performedBy } = command.data;

        this.logger.log(`직원 프로젝트 할당 일괄 갱신 시작: employeeId=${employeeId}, projects=${projects.length}건`);

        return await this.dataSource.transaction(async (manager) => {
            // 1. 해당 직원의 할당 전부 비활성화
            await this.assignedProjectService.직원별할당전체비활성화한다(employeeId, performedBy, manager);

            // 2. 요청한 프로젝트만 활성화(기존 행 있으면 갱신, 없으면 생성)
            const assignedProjects: Awaited<
                ReturnType<DomainAssignedProjectService['직원프로젝트할당활성화또는생성한다']>
            >[] = [];
            for (const p of projects) {
                const result = await this.assignedProjectService.직원프로젝트할당활성화또는생성한다(
                    employeeId,
                    p.projectId,
                    p.startDate,
                    p.endDate,
                    performedBy,
                    manager,
                );
                assignedProjects.push(result);
            }

            this.logger.log(`직원 프로젝트 할당 일괄 갱신 완료: ${assignedProjects.length}건 활성화됨`);

            return { assignedProjects };
        });
    }
}
