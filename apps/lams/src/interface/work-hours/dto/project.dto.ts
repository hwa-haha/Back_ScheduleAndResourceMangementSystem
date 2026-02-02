import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 프로젝트 목록 조회 응답 DTO
 */
export class ProjectListItemDto {
    @ApiProperty({ description: '프로젝트 ID' })
    id: string;

    @ApiProperty({ description: '프로젝트 코드' })
    projectCode: string;

    @ApiProperty({ description: '프로젝트명' })
    projectName: string;

    @ApiPropertyOptional({ description: '프로젝트 설명' })
    description?: string | null;

    @ApiProperty({ description: '활성화 여부' })
    isActive: boolean;
}

/**
 * 프로젝트 목록 조회 응답 DTO
 */
export class GetProjectListResponseDto {
    @ApiProperty({ description: '프로젝트 목록', type: [ProjectListItemDto] })
    projects: ProjectListItemDto[];

    @ApiProperty({ description: '전체 프로젝트 수' })
    totalCount: number;
}

/**
 * 할당된 프로젝트 요약 DTO (직원별 할당 목록용)
 */
export class AssignedProjectSummaryDto {
    @ApiProperty({ description: '할당 ID' })
    id: string;

    @ApiProperty({ description: '프로젝트 ID' })
    projectId: string;

    @ApiProperty({ description: '프로젝트명' })
    projectName: string;

    @ApiProperty({ description: '프로젝트 코드' })
    projectCode: string;
}

/**
 * 부서 요약 DTO (직원별 소속 부서용)
 */
export class DepartmentSummaryDto {
    @ApiProperty({ description: '부서 ID' })
    id: string;

    @ApiProperty({ description: '부서명' })
    departmentName: string;

    @ApiProperty({ description: '부서 코드' })
    departmentCode: string;
}

/**
 * 직원 + 할당 프로젝트 목록 항목 DTO
 */
export class EmployeeWithAssignedProjectsDto {
    @ApiProperty({ description: '직원 ID' })
    id: string;

    @ApiProperty({ description: '직원번호' })
    employeeNumber: string;

    @ApiProperty({ description: '직원명' })
    employeeName: string;

    @ApiPropertyOptional({ description: '이메일' })
    email?: string | null;

    @ApiProperty({ description: '소속 부서 목록', type: [DepartmentSummaryDto] })
    departments: DepartmentSummaryDto[];

    @ApiProperty({ description: '할당된 프로젝트 목록', type: [AssignedProjectSummaryDto] })
    assignedProjects: AssignedProjectSummaryDto[];
}

/**
 * 직원 목록 및 할당 프로젝트 조회 응답 DTO
 */
export class GetEmployeeWithAssignedProjectsResponseDto {
    @ApiProperty({ description: '직원 목록 (할당 프로젝트 포함)', type: [EmployeeWithAssignedProjectsDto] })
    employees: EmployeeWithAssignedProjectsDto[];

    @ApiProperty({ description: '전체 직원 수' })
    totalCount: number;
}
