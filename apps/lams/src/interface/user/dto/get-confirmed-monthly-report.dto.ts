import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

/**
 * 전월 근태현황보고서(스냅샷) 확정 여부 조회 요청 DTO
 *
 * 연·월 미지정 시 직전달(전월) 기준으로 조회합니다.
 */
export class GetConfirmedMonthlyReportRequestDto {
    @ApiPropertyOptional({ description: '연도', example: '2026' })
    @IsOptional()
    @IsString()
    @Matches(/^\d{4}$/, { message: '연도는 4자리 숫자입니다.' })
    year?: string;

    @ApiPropertyOptional({ description: '월 (01~12)', example: '01' })
    @IsOptional()
    @IsString()
    @Matches(/^(0[1-9]|1[0-2])$/, { message: '월은 01~12입니다.' })
    month?: string;
}

/** IGetEmployeeAttendanceDetailResponse 내부: 사용된 근태 내역 */
export class UsedAttendanceItemDto {
    @ApiProperty() usedAttendanceId: string;
    @ApiProperty() attendanceTypeId: string;
    @ApiProperty() title: string;
}

/** IGetEmployeeAttendanceDetailResponse 내부: 일별 근태 상세 */
export class DailyAttendanceDetailItemDto {
    @ApiProperty() dailyEventSummaryId: string;
    @ApiProperty() date: string;
    @ApiProperty() isHoliday: boolean;
    @ApiPropertyOptional() enter: string | null;
    @ApiPropertyOptional() leave: string | null;
    @ApiPropertyOptional() realEnter: string | null;
    @ApiPropertyOptional() realLeave: string | null;
    @ApiProperty() isChecked: boolean;
    @ApiProperty() isLate: boolean;
    @ApiProperty() isEarlyLeave: boolean;
    @ApiProperty() isAbsent: boolean;
    @ApiPropertyOptional() workTime: number | null;
    @ApiPropertyOptional() note: string | null;
    @ApiProperty({ type: [UsedAttendanceItemDto] }) usedAttendances: UsedAttendanceItemDto[];
}

/** IGetEmployeeAttendanceDetailResponse 내부: 주간 근무시간 요약 */
export class WeeklyWorkTimeSummaryItemDto {
    @ApiProperty() weekNumber: number;
    @ApiProperty() startDate: string;
    @ApiProperty() endDate: string;
    @ApiProperty() weeklyWorkTime: number;
}

/** IGetEmployeeAttendanceDetailResponse 내부: 근태 유형별 카운트 */
export class AttendanceTypeCountItemDto {
    @ApiProperty() title: string;
    @ApiProperty() count: number;
}

/** IGetEmployeeAttendanceDetailResponse 내부: 생일 휴가 상세 */
export class BirthDayLeaveDetailItemDto {
    @ApiProperty() usedAt: string;
    @ApiProperty() leaveType: string;
}

/** IGetEmployeeAttendanceDetailResponse 내부: 연차 데이터 */
export class AnnualLeaveDataItemDto {
    @ApiProperty() totalAnnualLeave: number;
    @ApiProperty() usedAnnualLeave: number;
    @ApiProperty() remainingAnnualLeave: number;
    @ApiProperty({ type: [BirthDayLeaveDetailItemDto] }) birthDayLeaveDetails: BirthDayLeaveDetailItemDto[];
    @ApiProperty() createdAt: string;
    @ApiProperty() updatedAt: string;
    @ApiProperty() isAdjusted: boolean;
}

/** IGetEmployeeAttendanceDetailResponse 내부: 월간 근태 통계 */
export class MonthlyAttendanceStatisticsItemDto {
    @ApiProperty() monthlyEventSummaryId: string;
    @ApiProperty() workDaysCount: number;
    @ApiProperty() totalWorkableTime: number;
    @ApiProperty() totalWorkTime: number;
    @ApiProperty() avgWorkTimes: number;
    @ApiProperty({ type: [AttendanceTypeCountItemDto] }) attendanceTypeCount: AttendanceTypeCountItemDto[];
    @ApiProperty({ type: [WeeklyWorkTimeSummaryItemDto] }) weeklyWorkTimeSummary: WeeklyWorkTimeSummaryItemDto[];
    @ApiProperty({ type: AnnualLeaveDataItemDto, nullable: true, description: '연차 데이터 (없으면 null)' })
    annualLeaveData: AnnualLeaveDataItemDto | null;
}

/**
 * 전월 나의 근태현황보고서(확정) 응답 DTO (업무관리시스템 유저용)
 *
 * 실제 응답: dashboard-context IGetEmployeeAttendanceDetailResponse (연도·월별 직원 근태상세)와 동일
 */
export class GetConfirmedMonthlyReportResponseDto {
    @ApiProperty({ description: '직원 ID' })
    employeeId: string;

    @ApiProperty({ description: '직원명' })
    employeeName: string;

    @ApiProperty({ description: '사번' })
    employeeNumber: string;

    @ApiProperty({ description: '연월 (yyyyMM)', example: '202602' })
    yyyymm: string;

    @ApiProperty({ description: '월간 근태 통계', type: MonthlyAttendanceStatisticsItemDto })
    monthlyStatistics: MonthlyAttendanceStatisticsItemDto;

    @ApiProperty({ description: '일별 근태 상세 목록', type: [DailyAttendanceDetailItemDto] })
    dailyAttendanceDetails: DailyAttendanceDetailItemDto[];

    @ApiProperty({ description: '지각 상세 목록', type: [DailyAttendanceDetailItemDto] })
    lateDetails: DailyAttendanceDetailItemDto[];

    @ApiProperty({ description: '결근 상세 목록', type: [DailyAttendanceDetailItemDto] })
    absenceDetails: DailyAttendanceDetailItemDto[];

    @ApiProperty({ description: '조퇴 상세 목록', type: [DailyAttendanceDetailItemDto] })
    earlyLeaveDetails: DailyAttendanceDetailItemDto[];
}
