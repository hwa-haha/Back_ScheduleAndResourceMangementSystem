import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsEnum, IsArray, ArrayMaxSize, ArrayMinSize, ValidateIf } from 'class-validator';
import { AttendanceIssueStatus } from '../../../domain/attendance-issue/attendance-issue.types';

/**
 * 근태 이슈 목록 조회 요청 DTO
 */
export class GetAttendanceIssuesRequestDto {
    @ApiPropertyOptional({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsOptional()
    @IsUUID()
    employeeId?: string;

    @ApiPropertyOptional({ description: '시작 날짜 (yyyy-MM-dd)', example: '2024-01-01' })
    @IsOptional()
    @IsString()
    startDate?: string;

    @ApiPropertyOptional({ description: '종료 날짜 (yyyy-MM-dd)', example: '2024-01-31' })
    @IsOptional()
    @IsString()
    endDate?: string;

    @ApiPropertyOptional({ description: '상태', enum: AttendanceIssueStatus, example: AttendanceIssueStatus.REQUEST })
    @IsOptional()
    @IsEnum(AttendanceIssueStatus)
    status?: AttendanceIssueStatus;
}

/**
 * 근태 이슈 사유 수정 요청 DTO
 */
export class UpdateAttendanceIssueDescriptionRequestDto {
    @ApiProperty({ description: '이슈 설명 (사유)', example: '출장으로 인한 지각입니다.' })
    @IsString()
    description: string;
}

/**
 * 근태 이슈 반영 요청 DTO
 * 확인자(confirmed_by)는 인증된 사용자 ID(userId)로 자동 설정된다.
 */
export class ApplyAttendanceIssueRequestDto {
    @ApiPropertyOptional({ description: '변경할 출근 시간 (HH:MM:SS)', example: '09:00:00' })
    @IsOptional()
    @IsString()
    correctedEnterTime?: string;

    @ApiPropertyOptional({ description: '변경할 퇴근 시간 (HH:MM:SS)', example: '18:00:00' })
    @IsOptional()
    @IsString()
    correctedLeaveTime?: string;

    @ApiPropertyOptional({
        description: '변경할 근태 유형 ID 목록 (최대 2개)',
        example: ['7d45683d-7476-4e86-859f-961637e48526'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(2)
    @IsUUID('4', { each: true })
    correctedAttendanceTypeIds?: string[];
}

/**
 * 근태 이슈 요청 DTO (PENDING → REQUEST, 복수 ID)
 */
export class RequestAttendanceIssueRequestDto {
    @ApiProperty({
        description: '요청할 근태 이슈 ID 목록 (대기 상태만 요청 가능)',
        example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
        type: [String],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    ids: string[];
}

/**
 * 근태 이슈 재요청 DTO (복수 ID)
 */
export class ReRequestAttendanceIssuesRequestDto {
    @ApiProperty({
        description: '재요청할 근태 이슈 ID 목록 (이미 반영된 이슈는 제외)',
        example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
        type: [String],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsUUID('4', { each: true })
    ids: string[];
}

/**
 * 근태 이슈 미반영 요청 DTO
 */
export class RejectAttendanceIssueRequestDto {
    @ApiProperty({ description: '미반영 사유', example: '사유가 불충분합니다.' })
    @IsString()
    rejectionReason: string;
}

/**
 * 근태 이슈 응답 DTO
 */
export class AttendanceIssueResponseDto {
    @ApiProperty({ description: '이슈 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ description: '직원 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    employeeId: string;

    @ApiPropertyOptional({ description: '일간 요약 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    dailyEventSummaryId: string | null;

    @ApiProperty({ description: '날짜', example: '2024-01-15' })
    date: string;

    @ApiPropertyOptional({ description: '문제가 된 출근 시간', example: '09:30:00' })
    problematicEnterTime: string | null;

    @ApiPropertyOptional({ description: '문제가 된 퇴근 시간', example: '17:30:00' })
    problematicLeaveTime: string | null;

    @ApiPropertyOptional({ description: '변경할 출근 시간', example: '09:00:00' })
    correctedEnterTime: string | null;

    @ApiPropertyOptional({ description: '변경할 퇴근 시간', example: '18:00:00' })
    correctedLeaveTime: string | null;

    @ApiPropertyOptional({
        description: '문제가 된 근태 유형 ID 목록',
        example: ['7d45683d-7476-4e86-859f-961637e48526'],
        type: [String],
    })
    problematicAttendanceTypeIds: string[] | null;

    @ApiPropertyOptional({
        description: '변경할 근태 유형 ID 목록',
        example: ['7d45683d-7476-4e86-859f-961637e48526'],
        type: [String],
    })
    correctedAttendanceTypeIds: string[] | null;

    @ApiProperty({ description: '상태', enum: AttendanceIssueStatus, example: AttendanceIssueStatus.REQUEST })
    status: AttendanceIssueStatus;

    @ApiPropertyOptional({ description: '이슈 설명', example: '출장으로 인한 지각입니다.' })
    description: string | null;

    @ApiPropertyOptional({ description: '확인자', example: '관리자' })
    confirmedBy: string | null;

    @ApiPropertyOptional({ description: '확인 시간' })
    confirmedAt: Date | null;

    @ApiPropertyOptional({ description: '해결 시간' })
    resolvedAt: Date | null;

    @ApiPropertyOptional({ description: '거부 사유', example: '사유가 불충분합니다.' })
    rejectionReason: string | null;

    @ApiProperty({ description: '생성 시간' })
    createdAt: Date;

    @ApiProperty({ description: '수정 시간' })
    updatedAt: Date;
}

/**
 * 근태 이슈 요청 응답 DTO (복수 처리 결과)
 */
export class RequestAttendanceIssueResponseDto {
    @ApiProperty({ description: '요청 처리된 근태 이슈 목록', type: [AttendanceIssueResponseDto] })
    issues: AttendanceIssueResponseDto[];

    @ApiProperty({ description: '요청 처리된 개수', example: 2 })
    requestedCount: number;
}

/**
 * 근태 이슈 재요청 응답 DTO (복수 처리 결과)
 */
export class ReRequestAttendanceIssuesResponseDto {
    @ApiProperty({ description: '재요청 처리된 근태 이슈 목록', type: [AttendanceIssueResponseDto] })
    issues: AttendanceIssueResponseDto[];

    @ApiProperty({ description: '재요청 처리된 개수', example: 2 })
    reRequestedCount: number;
}

/**
 * 근태 이슈 목록 응답 DTO
 */
export class GetAttendanceIssuesResponseDto {
    @ApiProperty({ description: '근태 이슈 목록', type: [AttendanceIssueResponseDto] })
    issues: AttendanceIssueResponseDto[];

    @ApiProperty({ description: '총 개수', example: 10 })
    total: number;
}
