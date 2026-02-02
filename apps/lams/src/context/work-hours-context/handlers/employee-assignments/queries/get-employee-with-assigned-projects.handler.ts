import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetEmployeeWithAssignedProjectsQuery } from './get-employee-with-assigned-projects.query';
import {
    IGetEmployeeWithAssignedProjectsResponse,
    IEmployeeWithAssignedProjects,
    IAssignedProjectSummary,
    IDepartmentSummary,
} from '../../../interfaces/response/get-employee-with-assigned-projects-response.interface';
import { Employee, EmployeeStatus } from '@libs/modules/employee/employee.entity';
import { EmployeeDepartmentPosition } from '@libs/modules/employee-department-position/employee-department-position.entity';
import { DomainAssignedProjectService } from '../../../../../domain/assigned-project/assigned-project.service';

/**
 * 직원 목록 및 할당 프로젝트 조회 Query Handler
 *
 * 조직도에 재직 중인 직원 목록과 각 직원에게 할당된 활성 프로젝트를 반환한다.
 */
@QueryHandler(GetEmployeeWithAssignedProjectsQuery)
export class GetEmployeeWithAssignedProjectsHandler implements IQueryHandler<
    GetEmployeeWithAssignedProjectsQuery,
    IGetEmployeeWithAssignedProjectsResponse
> {
    private readonly logger = new Logger(GetEmployeeWithAssignedProjectsHandler.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly assignedProjectService: DomainAssignedProjectService,
    ) {}

    async execute(query: GetEmployeeWithAssignedProjectsQuery): Promise<IGetEmployeeWithAssignedProjectsResponse> {
        this.logger.log('직원 목록 및 할당 프로젝트 조회 시작');

        // 1. 현재 조직도에 재직 중인 직원 조회
        const employees = await this.dataSource.manager
            .createQueryBuilder(Employee, 'emp')
            .innerJoin(EmployeeDepartmentPosition, 'edp', 'edp.employeeId = emp.id')
            .where('emp.status = :status', { status: EmployeeStatus.Active })
            .distinct(true)
            .orderBy('emp.employeeNumber', 'ASC')
            .getMany();

        if (employees.length === 0) {
            this.logger.log('조건에 맞는 직원이 없습니다.');
            return { employees: [], totalCount: 0 };
        }

        const employeeIds = employees.map((e) => e.id);

        // 2. 직원별 부서 정보 조회 (EmployeeDepartmentPosition + Department)
        const edpList = await this.dataSource.manager
            .createQueryBuilder(EmployeeDepartmentPosition, 'edp')
            .innerJoinAndSelect('edp.department', 'dept')
            .where('edp.employeeId IN (:...employeeIds)', { employeeIds })
            .getMany();

        const departmentsByEmployeeId = new Map<string, IDepartmentSummary[]>();
        for (const edp of edpList) {
            const employeeId = edp.employeeId;
            const list = departmentsByEmployeeId.get(employeeId) ?? [];
            const dept = edp.department;
            if (dept && !list.some((d) => d.id === dept.id)) {
                list.push({
                    id: dept.id,
                    departmentName: dept.departmentName,
                    departmentCode: dept.departmentCode,
                });
                departmentsByEmployeeId.set(employeeId, list);
            }
        }

        // 3. 활성 할당 전체 조회 (프로젝트명 포함)
        const allAssignments = await this.assignedProjectService.활성할당전체조회한다();

        // 4. 직원 ID별 할당 목록 그룹핑
        const assignmentsByEmployeeId = new Map<string, IAssignedProjectSummary[]>();
        for (const a of allAssignments) {
            const summary: IAssignedProjectSummary = {
                id: a.id,
                projectId: a.projectId,
                projectName: a.projectName,
                projectCode: a.projectCode,
            };
            const list = assignmentsByEmployeeId.get(a.employeeId) ?? [];
            list.push(summary);
            assignmentsByEmployeeId.set(a.employeeId, list);
        }

        // 5. 직원 + 이메일 + 부서 + 할당 목록 응답 구성
        const employeesWithAssignments: IEmployeeWithAssignedProjects[] = employees.map((emp) => ({
            id: emp.id,
            employeeNumber: emp.employeeNumber,
            employeeName: emp.name,
            email: emp.email ?? null,
            departments: departmentsByEmployeeId.get(emp.id) ?? [],
            assignedProjects: assignmentsByEmployeeId.get(emp.id) ?? [],
        }));

        this.logger.log(`직원 목록 및 할당 프로젝트 조회 완료: totalCount=${employeesWithAssignments.length}`);

        return {
            employees: employeesWithAssignments,
            totalCount: employeesWithAssignments.length,
        };
    }
}
