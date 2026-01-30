import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

/**
 * 월간 요약 조회 요청 DTO
 */
export class GetMonthlySummariesRequestDto {
    @ApiProperty({
        description: '연도',
        example: '2026',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    year: string;

    @ApiProperty({
        description: '월',
        example: '01',
        required: true,
    })
    @Transform(({ value }) => (typeof value === 'string' && value.length === 1 ? value.padStart(2, '0') : value))
    @IsString()
    @IsNotEmpty()
    month: string;

    @ApiProperty({
        description: '부서 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true,
    })
    @IsUUID()
    @IsNotEmpty()
    departmentId: string;
}

/**
 * 일간 요약 수정이력 응답 DTO
 */
export class DailyEventSummaryHistoryDto {
    @ApiProperty({ description: 'ID' })
    id: string;

    @ApiProperty({ description: '일간 요약 ID' })
    dailyEventSummaryId: string;

    @ApiProperty({ description: '날짜' })
    date: string;

    @ApiProperty({ description: '변경 내역' })
    content: string;

    @ApiProperty({ description: '변경자' })
    changedBy: string;

    @ApiProperty({ description: '변경 시간' })
    changedAt: Date;

    @ApiProperty({ description: '변경 사유', nullable: true })
    reason: string | null;

    @ApiProperty({ description: '스냅샷 ID', nullable: true })
    snapshotId: string | null;

    @ApiProperty({ description: '생성 일시' })
    createdAt: Date;

    @ApiProperty({ description: '수정 일시' })
    updatedAt: Date;

    @ApiProperty({ description: '삭제 일시', nullable: true })
    deletedAt?: Date;

    @ApiProperty({ description: '생성자 ID', nullable: true })
    createdBy?: string;

    @ApiProperty({ description: '수정자 ID', nullable: true })
    updatedBy?: string;

    @ApiProperty({ description: '버전' })
    version: number;
}

/**
 * 일간 요약 응답 DTO (수정이력 포함)
 */
export class DailyEventSummaryWithHistoryDto {
    @ApiProperty({ description: 'ID' })
    id: string;

    @ApiProperty({ description: '날짜' })
    date: string;

    @ApiProperty({ description: '직원 ID', nullable: true })
    employeeId: string | null;

    @ApiProperty({ description: '월간 요약 ID', nullable: true })
    monthlyEventSummaryId: string | null;

    @ApiProperty({ description: '공휴일 여부' })
    isHoliday: boolean;

    @ApiProperty({ description: '출근 시간', nullable: true })
    enter: string | null;

    @ApiProperty({ description: '퇴근 시간', nullable: true })
    leave: string | null;

    @ApiProperty({ description: '실제 출근 시간', nullable: true })
    realEnter: string | null;

    @ApiProperty({ description: '실제 퇴근 시간', nullable: true })
    realLeave: string | null;

    @ApiProperty({ description: '검토 완료 여부' })
    isChecked: boolean;

    @ApiProperty({ description: '지각 여부' })
    isLate: boolean;

    @ApiProperty({ description: '조퇴 여부' })
    isEarlyLeave: boolean;

    @ApiProperty({ description: '결근 여부' })
    isAbsent: boolean;

    @ApiProperty({ description: '근무 시간 (분)', nullable: true })
    workTime: number | null;

    @ApiProperty({ description: '비고', nullable: true })
    note: string | null;

    @ApiProperty({ description: '사용된 근태 유형 정보', nullable: true, type: 'array' })
    usedAttendances: Array<{
        attendanceTypeId: string;
        title: string;
        workTime?: number;
        isRecognizedWorkTime?: boolean;
        startWorkTime?: string | null;
        endWorkTime?: string | null;
        deductedAnnualLeave?: number;
    }> | null;

    @ApiProperty({ description: '수정이력', type: [DailyEventSummaryHistoryDto], required: false })
    history?: DailyEventSummaryHistoryDto[];

    @ApiProperty({ description: '근태 이슈 목록', type: 'array', required: false })
    issues?: Array<{
        id: string;
        employeeId: string;
        dailyEventSummaryId: string | null;
        date: string;
        problematicEnterTime: string | null;
        problematicLeaveTime: string | null;
        correctedEnterTime: string | null;
        correctedLeaveTime: string | null;
        problematicAttendanceTypeIds: string[] | null;
        correctedAttendanceTypeIds: string[] | null;
        status: string;
        description: string | null;
        confirmedBy: string | null;
        confirmedAt: Date | null;
        resolvedAt: Date | null;
        rejectionReason: string | null;
        createdAt: Date;
        updatedAt: Date;
        deletedAt?: Date;
        createdBy?: string;
        updatedBy?: string;
        version: number;
    }>;
}

/**
 * 월간 요약 응답 DTO (일간 요약 포함)
 */
export class MonthlyEventSummaryDto {
    @ApiProperty({ description: 'ID' })
    id: string;

    @ApiProperty({ description: '사원 번호' })
    employeeNumber: string;

    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '사원 이름', nullable: true })
    employeeName: string | null;

    @ApiProperty({ description: '연월 (YYYY-MM)' })
    yyyymm: string;

    @ApiProperty({ description: '비고', nullable: true })
    note: string | null;

    @ApiProperty({ description: '월간 근태 요약 노트' })
    additionalNote: string;

    @ApiProperty({ description: '근무 일수' })
    workDaysCount: number;

    @ApiProperty({ description: '총 업무 가능 시간 (분)', nullable: true })
    totalWorkableTime: number | null;

    @ApiProperty({ description: '총 근무 시간 (분)' })
    totalWorkTime: number;

    @ApiProperty({ description: '평균 근무 시간 (분)' })
    avgWorkTimes: number;

    @ApiProperty({ description: '근태 유형별 횟수', type: 'object' })
    attendanceTypeCount: Record<string, number>;

    @ApiProperty({ description: '주별 근무시간 요약', nullable: true, type: 'array' })
    weeklyWorkTimeSummary: any[] | null;

    @ApiProperty({ description: '지각 상세정보', nullable: true, type: 'array' })
    lateDetails: any[] | null;

    @ApiProperty({ description: '결근 상세정보', nullable: true, type: 'array' })
    absenceDetails: any[] | null;

    @ApiProperty({ description: '조퇴 상세정보', nullable: true, type: 'array' })
    earlyLeaveDetails: any[] | null;

    @ApiProperty({ description: '일간 요약 목록 (수정이력 포함)', type: [DailyEventSummaryWithHistoryDto] })
    dailySummaries: DailyEventSummaryWithHistoryDto[];
}

/**
 * 월간 요약 조회 응답 DTO
 */
export class GetMonthlySummariesResponseDto {
    @ApiProperty({ description: '월간 요약 목록 (일간 요약 포함)', type: [MonthlyEventSummaryDto] })
    monthlySummaries: MonthlyEventSummaryDto[];
}
