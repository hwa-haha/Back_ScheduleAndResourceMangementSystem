import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 연도, 월별 직원 근태상세 조회 요청 DTO
 */
export class GetEmployeeAttendanceDetailRequestDto {
    @ApiProperty({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    employeeId: string;

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
}

/**
 * 사용된 근태 내역 정보
 */
export class UsedAttendanceDto {
    @ApiProperty({ description: '사용된 근태 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    usedAttendanceId: string;

    @ApiProperty({ description: '근태 유형 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    attendanceTypeId: string;

    @ApiProperty({ description: '근태 유형 제목', example: '오후반차' })
    title: string;
}

/**
 * 일별 근태 상세 정보
 */
export class DailyAttendanceDetailDto {
    @ApiProperty({ description: '일일 요약 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    dailyEventSummaryId: string;

    @ApiProperty({ description: '날짜 (yyyy-MM-dd)', example: '2024-01-15' })
    date: string;

    @ApiProperty({ description: '공휴일 여부', example: false })
    isHoliday: boolean;

    @ApiProperty({ description: '출근 시간 (예정)', example: '09:00', nullable: true })
    enter: string | null;

    @ApiProperty({ description: '퇴근 시간 (예정)', example: '18:00', nullable: true })
    leave: string | null;

    @ApiProperty({ description: '실제 출근 시간', example: '09:00', nullable: true })
    realEnter: string | null;

    @ApiProperty({ description: '실제 퇴근 시간', example: '18:00', nullable: true })
    realLeave: string | null;

    @ApiProperty({ description: '확인 여부', example: true })
    isChecked: boolean;

    @ApiProperty({ description: '지각 여부', example: false })
    isLate: boolean;

    @ApiProperty({ description: '조퇴 여부', example: false })
    isEarlyLeave: boolean;

    @ApiProperty({ description: '결근 여부', example: false })
    isAbsent: boolean;

    @ApiProperty({ description: '근무시간 (분)', example: 480, nullable: true })
    workTime: number | null;

    @ApiProperty({ description: '비고', example: '', nullable: true })
    note: string | null;

    @ApiProperty({
        description: '사용된 근태 내역 목록',
        type: [UsedAttendanceDto],
    })
    usedAttendances: UsedAttendanceDto[];
}

/**
 * 주차별 근무시간 요약
 */
export class WeeklyWorkTimeSummaryDto {
    @ApiProperty({ description: '주차 번호', example: 45 })
    weekNumber: number;

    @ApiProperty({ description: '시작일 (yyyy-MM-dd)', example: '2024-01-01' })
    startDate: string;

    @ApiProperty({ description: '종료일 (yyyy-MM-dd)', example: '2024-01-07' })
    endDate: string;

    @ApiProperty({ description: '주간 근무시간 (분)', example: 2400 })
    weeklyWorkTime: number;
}

/**
 * 생일 휴가 상세 정보
 */
export class BirthDayLeaveDetailDto {
    @ApiProperty({ description: '사용된 근태 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    usedAttendanceId: string;

    @ApiProperty({ description: '사용일 (yyyy-MM-dd)', example: '2024-10-13' })
    usedAt: string;

    @ApiProperty({ description: '생성일시', example: '2024-11-06T00:11:19.006Z' })
    createdAt: string;

    @ApiProperty({ description: '수정일시', example: '2024-11-06T00:11:19.006Z' })
    updatedAt: string;

    @ApiProperty({
        description: '근태 유형 정보',
        example: {
            attendanceTypeId: '123e4567-e89b-12d3-a456-426614174000',
            title: '생일오전반차',
            workTime: 240,
            isRecognizedWorkTime: true,
            startWorkTime: '09:00',
            endWorkTime: '14:00',
            deductedAnnualLeave: 0.5,
        },
    })
    attendanceType: Record<string, any>;
}

/**
 * 연차 데이터 정보
 */
export class AnnualLeaveDataDto {
    @ApiProperty({ description: '연차 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    annualLeaveId: string;

    @ApiProperty({ description: '연도', example: 2024 })
    year: number;

    @ApiProperty({ description: '회계연도 총 연차', example: 15.0 })
    fiscalYearTotalLeave: number;

    @ApiProperty({ description: '현재 회계연도 연차', example: 15.0 })
    currentFiscalYearLeave: number;

    @ApiProperty({ description: '입사일 기준 총 연차', example: 15.0 })
    entryDateBasedTotalLeave: number;

    @ApiProperty({ description: '사용한 연차', example: 5.0 })
    usedAnnualLeave: number;

    @ApiProperty({ description: '잔여 연차', example: 10.0 })
    remainedAnnualLeave: number;

    @ApiProperty({ description: '생일 휴가 상태', example: '생일 휴가 사용됨', nullable: true })
    birthDayLeaveStatus: string | null;

    @ApiProperty({
        description: '생일 휴가 상세 목록',
        type: [BirthDayLeaveDetailDto],
        nullable: true,
    })
    birthDayLeaveDetails?: BirthDayLeaveDetailDto[] | null;

    @ApiProperty({ description: '비고', example: null, nullable: true })
    note: string | null;

    @ApiProperty({ description: '생성일시', example: '2024-12-17T07:34:10.304Z' })
    createdAt: string;

    @ApiProperty({ description: '수정일시', example: '2024-12-17T07:34:10.304Z' })
    updatedAt: string;

    @ApiProperty({ description: '조정 여부', example: false })
    isAdjusted: boolean;
}

/**
 * 근태 유형별 카운트
 */
export class AttendanceTypeCountDto {
    @ApiProperty({ description: '연차', example: 0 })
    연차?: number;

    @ApiProperty({ description: '오전반차', example: 0 })
    오전반차?: number;

    @ApiProperty({ description: '오후반차', example: 2 })
    오후반차?: number;

    @ApiProperty({ description: '공가', example: 0 })
    공가?: number;

    @ApiProperty({ description: '출장', example: 0 })
    출장?: number;

    @ApiProperty({ description: '교육', example: 0 })
    교육?: number;

    @ApiProperty({ description: '지각', example: 1 })
    지각?: number;

    @ApiProperty({ description: '결근', example: 0 })
    결근?: number;

    @ApiProperty({ description: '조퇴', example: 0 })
    조퇴?: number;

    // 기타 근태 유형들도 동적으로 포함될 수 있음
    [key: string]: number | undefined;
}

/**
 * 월별 근태 통계
 */
export class MonthlyAttendanceStatisticsDto {
    @ApiProperty({ description: '월간 요약 ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    monthlyEventSummaryId: string;

    @ApiProperty({ description: '비고', example: '1회 지각', nullable: true })
    note: string | null;

    @ApiProperty({ description: '추가 비고', example: '', nullable: true })
    additionalNote: string | null;

    @ApiProperty({ description: '근무일수', example: 20 })
    workDaysCount: number;

    @ApiProperty({ description: '총 근무 가능 시간 (분)', example: 12480 })
    totalWorkableTime: number;

    @ApiProperty({ description: '총 근무 시간 (분)', example: 10113 })
    totalWorkTime: number;

    @ApiProperty({ description: '평균 근무 시간 (분)', example: 505.65 })
    avgWorkTimes: number;

    @ApiProperty({
        description: '근태 유형별 카운트',
        type: AttendanceTypeCountDto,
    })
    attendanceTypeCount: AttendanceTypeCountDto;

    @ApiProperty({
        description: '주차별 근무시간 요약',
        type: [WeeklyWorkTimeSummaryDto],
    })
    weeklyWorkTimeSummary: WeeklyWorkTimeSummaryDto[];

    @ApiProperty({
        description: '연차 데이터',
        type: AnnualLeaveDataDto,
        nullable: true,
    })
    annualLeaveData?: AnnualLeaveDataDto | null;
}

/**
 * 연도, 월별 직원 근태상세 조회 응답 DTO
 */
export class GetEmployeeAttendanceDetailResponseDto {
    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '직원 이름', example: '홍길동' })
    employeeName: string;

    @ApiProperty({ description: '직원 번호', example: 'E001' })
    employeeNumber: string;

    @ApiProperty({ description: '연월 (yyyy-MM)', example: '2024-01' })
    yyyymm: string;

    @ApiProperty({
        description: '월별 근태 통계',
        type: MonthlyAttendanceStatisticsDto,
    })
    statistics: MonthlyAttendanceStatisticsDto;

    @ApiProperty({
        description: '일별 근태 상세 목록',
        type: [DailyAttendanceDetailDto],
    })
    dailyDetails: DailyAttendanceDetailDto[];

    @ApiProperty({
        description: '지각 상세 목록',
        type: [DailyAttendanceDetailDto],
    })
    lateDetails: DailyAttendanceDetailDto[];

    @ApiProperty({
        description: '결근 상세 목록',
        type: [DailyAttendanceDetailDto],
    })
    absenceDetails: DailyAttendanceDetailDto[];

    @ApiProperty({
        description: '조퇴 상세 목록',
        type: [DailyAttendanceDetailDto],
    })
    earlyLeaveDetails: DailyAttendanceDetailDto[];
}
