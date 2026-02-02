import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsOptional, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 프로젝트 할당 항목 DTO (일괄 갱신용)
 */
export class ReplaceProjectAssignmentItemDto {
    @ApiProperty({ description: '프로젝트 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    projectId: string;

    @ApiPropertyOptional({ description: '할당 시작일', example: '2024-01-01' })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @ApiPropertyOptional({ description: '할당 종료일', example: '2024-12-31' })
    @IsDateString()
    @IsOptional()
    endDate?: string;
}

/**
 * 직원 프로젝트 할당 일괄 갱신 요청 DTO
 *
 * 해당 직원의 기존 할당을 전부 비활성화한 뒤, 요청한 프로젝트만 활성화(기존 행 갱신 또는 신규 생성)합니다.
 * 시수(work_hours)는 같은 할당 행에 연결되므로 삭제하지 않고 is_active로 관리합니다.
 */
export class ReplaceProjectAssignmentsRequestDto {
    @ApiProperty({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    employeeId: string;

    @ApiProperty({
        description: '할당할 프로젝트 목록',
        type: [ReplaceProjectAssignmentItemDto],
        example: [
            { projectId: '123e4567-e89b-12d3-a456-426614174001', startDate: '2024-01-01', endDate: '2024-12-31' },
        ],
    })
    @IsArray()
    @ArrayMinSize(0)
    @ValidateNested({ each: true })
    @Type(() => ReplaceProjectAssignmentItemDto)
    projects: ReplaceProjectAssignmentItemDto[];
}

/**
 * 프로젝트 할당 응답 DTO (단건)
 */
export class AssignProjectResponseDto {
    @ApiProperty({ description: '할당된 프로젝트 ID' })
    id: string;

    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '프로젝트 ID' })
    projectId: string;

    @ApiPropertyOptional({ description: '할당 시작일' })
    startDate?: string | null;

    @ApiPropertyOptional({ description: '할당 종료일' })
    endDate?: string | null;

    @ApiProperty({ description: '활성화 여부' })
    isActive: boolean;
}

/**
 * 직원 프로젝트 할당 일괄 갱신 응답 DTO
 */
export class ReplaceProjectAssignmentsResponseDto {
    @ApiProperty({ description: '갱신된 할당 목록', type: [AssignProjectResponseDto] })
    assignedProjects: AssignProjectResponseDto[];
}
