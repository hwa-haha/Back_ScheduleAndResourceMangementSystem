import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';
import { AttendanceIssueStatus } from '../../../domain/attendance-issue/attendance-issue.types';

/**
 * 확인할 근태 이슈 목록 조회 요청 DTO (연·월 선택 시 해당 월 구간으로 필터)
 */
export class GetAttendanceIssuesToReviewRequestDto {
    @ApiPropertyOptional({ description: '연도', example: '2026' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{4}$/, { message: '연도는 4자리 숫자입니다.' })
    year?: string;

    @ApiPropertyOptional({ description: '월 (01~12)', example: '02' })
    @IsOptional()
    @IsString()
    @Matches(/^(0[1-9]|1[0-2])$/, { message: '월은 01~12입니다.' })
    month?: string;
}

/**
 * 확인할 근태 이슈 한 건 (attendance-issue 목록 조회와 동일한 구조)
 */
export class AttendanceIssueToReviewItemDto {
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
        type: [String],
    })
    problematicAttendanceTypeIds: string[] | null;

    @ApiPropertyOptional({
        description: '변경할 근태 유형 ID 목록',
        type: [String],
    })
    correctedAttendanceTypeIds: string[] | null;

    @ApiProperty({ description: '상태', enum: AttendanceIssueStatus, example: AttendanceIssueStatus.REQUEST })
    status: AttendanceIssueStatus;

    @ApiPropertyOptional({ description: '이슈 설명', example: '출장으로 인한 지각입니다.' })
    description: string | null;

    @ApiPropertyOptional({ description: '확인자' })
    confirmedBy: string | null;

    @ApiPropertyOptional({ description: '확인 시간' })
    confirmedAt: Date | null;

    @ApiPropertyOptional({ description: '해결 시간' })
    resolvedAt: Date | null;

    @ApiPropertyOptional({ description: '거부 사유' })
    rejectionReason: string | null;

    @ApiProperty({ description: '생성 시간' })
    createdAt: Date;

    @ApiProperty({ description: '수정 시간' })
    updatedAt: Date;

    @ApiPropertyOptional({ description: '삭제 시간 (소프트 삭제)' })
    deletedAt?: Date;

    @ApiPropertyOptional({ description: '생성자' })
    createdBy?: string;

    @ApiPropertyOptional({ description: '수정자' })
    updatedBy?: string;

    @ApiProperty({ description: '버전', example: 1 })
    version: number;
}

/**
 * 확인할 근태 이슈 목록 응답 DTO (업무관리시스템 유저용)
 *
 * attendance-issue-context IGetAttendanceIssuesResponse와 동일 구조 (total, issues)
 */
export class GetAttendanceIssuesToReviewResponseDto {
    @ApiProperty({ description: '근태 이슈 목록', type: [AttendanceIssueToReviewItemDto] })
    issues: AttendanceIssueToReviewItemDto[];

    @ApiProperty({ description: '총 개수', example: 10 })
    total: number;
}
