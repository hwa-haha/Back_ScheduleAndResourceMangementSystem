import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UpdateDailySummaryCommand } from './update-daily-summary.command';
import { IUpdateDailySummaryResponse } from '../../../interfaces/response/update-daily-summary-response.interface';
import { DomainDailyEventSummaryService } from '../../../../../domain/daily-event-summary/daily-event-summary.service';
import { DomainDailySummaryChangeHistoryService } from '../../../../../domain/daily-summary-change-history/daily-summary-change-history.service';
import { DomainAttendanceTypeService } from '../../../../../domain/attendance-type/attendance-type.service';
import { WorkTimePolicyService } from '../../../services/work-time-policy.service';
import { DailySummaryJudgmentService } from '../../../services/daily-summary-judgment.service';
import { DailyEventSummary } from '../../../../../domain/daily-event-summary/daily-event-summary.entity';
import { format } from 'date-fns';

/**
 * 일간 요약 수정 Command Handler
 *
 * 일간 요약의 출근시간, 퇴근시간, 근태유형을 수정하고 수정이력을 생성합니다.
 */
@CommandHandler(UpdateDailySummaryCommand)
export class UpdateDailySummaryHandler implements ICommandHandler<
    UpdateDailySummaryCommand,
    IUpdateDailySummaryResponse
> {
    private readonly logger = new Logger(UpdateDailySummaryHandler.name);

    constructor(
        private readonly dailyEventSummaryService: DomainDailyEventSummaryService,
        private readonly dailySummaryChangeHistoryService: DomainDailySummaryChangeHistoryService,
        private readonly attendanceTypeService: DomainAttendanceTypeService,
        private readonly workTimePolicyService: WorkTimePolicyService,
        private readonly dailySummaryJudgmentService: DailySummaryJudgmentService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(command: UpdateDailySummaryCommand): Promise<IUpdateDailySummaryResponse> {
        const { dailySummaryId, enter, leave, attendanceTypeIds, note, performedBy } = command.data;

        this.logger.log(`일간 요약 수정 시작: dailySummaryId=${dailySummaryId}`);

        // 출퇴근 시간 수정 또는 근태유형 수정 중 하나만 가능
        const isTimeUpdate = enter !== undefined || leave !== undefined;
        const isAttendanceTypeUpdate = attendanceTypeIds !== undefined;

        if (isTimeUpdate && isAttendanceTypeUpdate) {
            throw new BadRequestException('출퇴근 시간 수정과 근태유형 수정은 동시에 할 수 없습니다.');
        }

        // 근태유형은 최대 2개까지
        if (isAttendanceTypeUpdate && attendanceTypeIds!.length > 2) {
            throw new BadRequestException('근태유형은 최대 2개까지 설정 가능합니다.');
        }

        return await this.dataSource.transaction(async (manager) => {
            // 1. 일간 요약 조회
            const dailySummary = await manager.findOne(DailyEventSummary, {
                where: { id: dailySummaryId },
            });

            if (!dailySummary) {
                throw new NotFoundException(`일간 요약을 찾을 수 없습니다. (id: ${dailySummaryId})`);
            }
            let changeContent = '';
            let updatedEnter: string | null = dailySummary.enter;
            let updatedLeave: string | null = dailySummary.leave;
            let originalRealEnter: string | null = dailySummary.real_enter;
            let originalRealLeave: string | null = dailySummary.real_leave;
            let workTime: number | null = null;
            let usedAttendances = dailySummary.used_attendances || undefined;

            // 기존 상태 확인
            const hasExistingAttendanceTypes =
                dailySummary.used_attendances && dailySummary.used_attendances.length > 0;
            const existingAttendanceTypeTitles = hasExistingAttendanceTypes
                ? dailySummary.used_attendances!.map((ua) => ua.title).join(', ')
                : null;

            // 2-1. 출퇴근 시간 수정인 경우
            if (isTimeUpdate) {
                const changeParts: string[] = [];

                // 기존에 근태유형이 있었다면 근태유형 → 출퇴근시간으로 변경 표시
                if (hasExistingAttendanceTypes) {
                    changeParts.push(`근태유형(${existingAttendanceTypeTitles}) → 출퇴근시간`);
                }

                // enter 변경 확인
                if (enter !== undefined && enter !== dailySummary.enter) {
                    const oldValue = dailySummary.enter || '미설정';
                    const newValue = enter;
                    changeParts.push(`출근시간: ${oldValue} → ${newValue}`);
                    updatedEnter = enter;
                    originalRealEnter = enter;
                }

                // leave 변경 확인
                if (leave !== undefined && leave !== dailySummary.leave) {
                    const oldValue = dailySummary.leave || '미설정';
                    const newValue = leave;
                    changeParts.push(`퇴근시간: ${oldValue} → ${newValue}`);
                    updatedLeave = leave;
                    originalRealLeave = leave;
                }

                changeContent = changeParts.join(', ');
                // 출퇴근 시간 변경 시 real_enter, real_leave도 동일하게 변경

                // 근무시간 계산 (enter와 leave가 모두 있어야 계산 가능)
                if (updatedEnter && updatedLeave) {
                    workTime = this.근무시간을계산한다(updatedEnter, updatedLeave, []);
                } else {
                    // enter 또는 leave 중 하나만 있는 경우, 기존 used_attendances를 활용하여 계산
                    workTime = this.근무시간을계산한다(
                        updatedEnter,
                        updatedLeave,
                        this.usedAttendances를UsedAttendance형태로변환(usedAttendances),
                    );
                }

                // 결근, 지각, 조퇴 판정을 다시 계산 (공통 서비스 사용)
                const 판정결과 = await this.dailySummaryJudgmentService.결근지각조퇴판정한다(
                    dailySummary,
                    originalRealEnter,
                    originalRealLeave,
                    usedAttendances,
                    manager,
                );

                // 일간 요약 업데이트
                dailySummary.업데이트한다(
                    undefined, // monthly_event_summary_id
                    undefined, // is_holiday
                    updatedEnter,
                    updatedLeave,
                    originalRealEnter, // real_enter: 출퇴근 시간과 동일하게 변경
                    originalRealLeave, // real_leave: 출퇴근 시간과 동일하게 변경
                    undefined, // is_checked
                    판정결과.isLate, // is_late
                    판정결과.isEarlyLeave, // is_early_leave
                    판정결과.isAbsent, // is_absent
                    판정결과.hasAttendanceConflict, // has_attendance_conflict
                    판정결과.hasAttendanceOverlap, // has_attendance_overlap
                    workTime,
                    undefined, // note: 요청에서 받은 메모
                    undefined, // used_attendances (기존 값 유지)
                );
            }

            // 2-2. 근태유형 수정인 경우
            if (isAttendanceTypeUpdate) {
                // 근태유형이 빈 배열인 경우 처리
                const isEmptyAttendanceTypeIds = attendanceTypeIds!.length === 0;

                // 근태 유형 조회 (최대 2개)
                const attendanceTypes = isEmptyAttendanceTypeIds
                    ? []
                    : await Promise.all(attendanceTypeIds!.map((id) => this.attendanceTypeService.ID로조회한다(id)));

                // used_attendances 업데이트
                usedAttendances = attendanceTypes.map((attendanceType) => ({
                    attendanceTypeId: attendanceType.id,
                    title: attendanceType.title,
                    workTime: attendanceType.workTime,
                    isRecognizedWorkTime: attendanceType.isRecognizedWorkTime,
                    startWorkTime: attendanceType.startWorkTime,
                    endWorkTime: attendanceType.endWorkTime,
                    deductedAnnualLeave: attendanceType.deductedAnnualLeave,
                }));

                // 근태유형 기반으로 enter, leave 계산
                // 근태유형 변경 시에는 real_enter, real_leave를 고려하지 않고 근태유형만으로 계산
                const finalTimes = this.출입기록과근태기반출입시간을계산한다(
                    dailySummary.real_enter,
                    dailySummary.real_leave,
                    attendanceTypes,
                );

                updatedEnter = finalTimes.enter;
                updatedLeave = finalTimes.leave;

                // 근무시간 계산 (generate-daily-summaries.handler.ts의 로직과 동일)
                // recognizedAttendances 형태로 변환
                const recognizedAttendances = attendanceTypes
                    .filter((at) => this.workTimePolicyService.isRecognizedWorkTime(at))
                    .map((at) => ({ attendanceType: { work_time: at.workTime } }));

                workTime = this.근무시간을계산한다(updatedEnter, updatedLeave, recognizedAttendances);

                // 변경 내용 생성
                const changeParts: string[] = [];

                // 빈 배열인 경우: 근태유형 제거
                if (isEmptyAttendanceTypeIds) {
                    // 기존에 출퇴근 시간이 있었다면 출퇴근시간 → 근태유형 제거로 변경 표시
                    if (dailySummary.enter || dailySummary.leave) {
                        const existingTime = `${dailySummary.enter || '미설정'} ~ ${dailySummary.leave || '미설정'}`;
                        changeParts.push(`출퇴근시간(${existingTime}) → 근태유형 제거`);
                    }

                    // 기존 근태유형이 있었다면 제거 표시
                    if (hasExistingAttendanceTypes) {
                        changeParts.push(`근태유형: ${existingAttendanceTypeTitles} → 제거`);
                    }
                } else {
                    // 근태유형이 있는 경우
                    const newAttendanceTypeTitles = attendanceTypes.map((at) => at.title).join(', ');

                    // 기존에 출퇴근 시간이 있었다면 출퇴근시간 → 근태유형으로 변경 표시
                    if (dailySummary.enter || dailySummary.leave) {
                        const existingTime = `${dailySummary.enter || '미설정'} ~ ${dailySummary.leave || '미설정'}`;
                        changeParts.push(`출퇴근시간(${existingTime}) → 근태유형`);
                    }

                    // 근태유형 변경 표시
                    if (hasExistingAttendanceTypes) {
                        // 기존 근태유형과 새 근태유형 비교
                        const existingIds = new Set(dailySummary.used_attendances!.map((ua) => ua.attendanceTypeId));
                        const newIds = new Set(attendanceTypes.map((at) => at.id));

                        // 변경된 근태유형만 표시
                        const addedTypes = attendanceTypes.filter((at) => !existingIds.has(at.id));
                        const removedTypes = dailySummary.used_attendances!.filter(
                            (ua) => !newIds.has(ua.attendanceTypeId),
                        );

                        if (removedTypes.length > 0 || addedTypes.length > 0) {
                            const removedTitles = removedTypes.map((ua) => ua.title).join(', ');
                            const addedTitles = addedTypes.map((at) => at.title).join(', ');
                            if (removedTitles && addedTitles) {
                                changeParts.push(`근태유형: ${removedTitles} → ${addedTitles}`);
                            } else if (removedTitles) {
                                changeParts.push(`근태유형: ${removedTitles} → 제거`);
                            } else if (addedTitles) {
                                changeParts.push(`근태유형: 추가 → ${addedTitles}`);
                            }
                        }
                    } else {
                        // 기존 근태유형이 없었던 경우
                        changeParts.push(`근태유형: 추가 → ${newAttendanceTypeTitles}`);
                    }
                }

                changeContent = changeParts.join(', ');

                // 결근, 지각, 조퇴 판정을 다시 계산 (공통 서비스 사용)
                const 판정결과 = await this.dailySummaryJudgmentService.결근지각조퇴판정한다(
                    dailySummary,
                    originalRealEnter,
                    originalRealLeave,
                    usedAttendances,
                    manager,
                );

                // 일간 요약 업데이트
                dailySummary.업데이트한다(
                    undefined, // monthly_event_summary_id
                    undefined, // is_holiday
                    updatedEnter,
                    updatedLeave,
                    undefined, // real_enter
                    undefined, // real_leave
                    undefined, // is_checked
                    판정결과.isLate, // is_late
                    판정결과.isEarlyLeave, // is_early_leave
                    판정결과.isAbsent, // is_absent
                    판정결과.hasAttendanceConflict, // has_attendance_conflict
                    판정결과.hasAttendanceOverlap, // has_attendance_overlap
                    workTime,
                    undefined, // note
                    usedAttendances,
                );
            }

            dailySummary.수정자설정한다(performedBy);
            dailySummary.메타데이터업데이트한다(performedBy);

            // 비고 업데이트 (모든 경우에 대해)
            if (note !== undefined) {
                const oldNote = dailySummary.note;
                const newNote = note;
                if (oldNote !== newNote) {
                    changeContent += `${changeContent.length > 0 ? ', ' : ''}비고: ${oldNote} → ${newNote}`;
                }
                dailySummary.비고업데이트한다(note ?? '');
            }

            const updatedSummary = await manager.save(dailySummary);

            // 3. 수정이력 생성 (reason에는 note 값을 넣음)
            await this.dailySummaryChangeHistoryService.생성한다(
                {
                    dailyEventSummaryId: dailySummaryId,
                    date: dailySummary.date,
                    content: changeContent,
                    changedBy: performedBy,
                    reason: note ?? undefined,
                },
                manager,
            );

            this.logger.log(`일간 요약 수정 완료: dailySummaryId=${dailySummaryId}`);

            return {
                dailySummary: updatedSummary.DTO변환한다(),
            };
        });
    }

    /**
     * 근무시간을 계산한다 (분 단위)
     *
     * generate-daily-summaries.handler.ts의 로직과 동일하게 구현
     * 1. 출입 기록이 있는 경우: enter와 leave 시간 차이에서 법정 휴식시간 제외
     * 2. 근태 유형만 있는 경우: 근태 유형의 work_time 합계 사용
     */
    private 근무시간을계산한다(
        enter: string | null,
        leave: string | null,
        recognizedAttendances: Array<{ attendanceType?: { work_time?: number } }>,
    ): number | null {
        // 출입 기록이 있는 경우: 시간 차이에서 법정 휴식시간 제외
        if (enter && leave) {
            const enterTime = this.시간문자열을분으로변환(enter);
            const leaveTime = this.시간문자열을분으로변환(leave);
            const totalWorkMinutes = leaveTime - enterTime;

            // 법정 휴식시간 계산
            const requiredRestMinutes = this.법정휴식시간을계산한다(totalWorkMinutes);

            // 총 근로시간에서 법정 휴식시간 제외
            const workTime = totalWorkMinutes - requiredRestMinutes;
            return workTime > 0 ? workTime : 0;
        }

        // 출입 기록이 없고 근태 유형만 있는 경우: 근태 유형의 work_time 합계
        if (recognizedAttendances.length > 0) {
            const totalWorkTime = recognizedAttendances.reduce((sum, ua) => {
                return sum + (ua.attendanceType?.work_time || 0);
            }, 0);
            return totalWorkTime > 0 ? totalWorkTime : null;
        }

        return null;
    }

    /**
     * 출입기록과 근태기반으로 출입시간을 계산한다
     *
     * generate-daily-summaries.handler.ts의 출입기록과근태기반출입시간을계산한다 로직과 동일
     */
    private 출입기록과근태기반출입시간을계산한다(
        realEnterTime: string | null,
        realLeaveTime: string | null,
        attendanceTypes: any[],
    ): {
        enter: string | null;
        leave: string | null;
    } {
        // 시간 비교를 위한 함수 (HH:MM:SS 형식)
        const compareTime = (time1: string, time2: string): number => {
            return time1.localeCompare(time2);
        };

        // 출근 시간 후보 목록
        const enterTimeCandidates: string[] = [];
        if (realEnterTime) {
            enterTimeCandidates.push(realEnterTime);
        }

        // 근태 유형에서 출근 시간 추출
        attendanceTypes.forEach((attendanceType) => {
            const startTime = attendanceType.startWorkTime;
            if (startTime) {
                // HH:MM 형식인 경우 HH:MM:00 형식으로 변환
                // 이미 HH:MM:SS 형식인 경우 그대로 사용
                const formattedStartTime = startTime.length === 5 ? startTime + ':00' : startTime;
                enterTimeCandidates.push(formattedStartTime);
            }
        });

        // 퇴근 시간 후보 목록
        const leaveTimeCandidates: string[] = [];
        if (realLeaveTime) {
            leaveTimeCandidates.push(realLeaveTime);
        }

        // 근태 유형에서 퇴근 시간 추출
        attendanceTypes.forEach((attendanceType) => {
            const endTime = attendanceType.endWorkTime;
            if (endTime) {
                // HH:MM 형식인 경우 HH:MM:00 형식으로 변환
                // 이미 HH:MM:SS 형식인 경우 그대로 사용
                const formattedEndTime = endTime.length === 5 ? endTime + ':00' : endTime;
                leaveTimeCandidates.push(formattedEndTime);
            }
        });

        // 가장 이른 출근 시간 선택
        let enterTime: string | null = null;
        if (enterTimeCandidates.length > 0) {
            enterTimeCandidates.sort(compareTime);
            enterTime = enterTimeCandidates[0];
        }

        // 가장 늦은 퇴근 시간 선택
        let leaveTime: string | null = null;
        if (leaveTimeCandidates.length > 0) {
            leaveTimeCandidates.sort(compareTime);
            leaveTime = leaveTimeCandidates[leaveTimeCandidates.length - 1];
        }

        return {
            enter: enterTime,
            leave: leaveTime,
        };
    }

    /**
     * used_attendances를 UsedAttendance 형태로 변환한다
     *
     * 근무시간 계산 시 사용하기 위한 헬퍼 함수
     */
    private usedAttendances를UsedAttendance형태로변환(
        usedAttendances:
            | Array<{
                  attendanceTypeId: string;
                  title: string;
                  workTime?: number;
                  isRecognizedWorkTime?: boolean;
                  startWorkTime?: string | null;
                  endWorkTime?: string | null;
                  deductedAnnualLeave?: number;
              }>
            | null
            | undefined,
    ): Array<{ attendanceType?: { work_time?: number } }> {
        if (!usedAttendances || usedAttendances.length === 0) {
            return [];
        }

        return usedAttendances.map((ua) => ({
            attendanceType: {
                work_time: ua.workTime,
            },
        }));
    }

    /**
     * 시간 문자열을 분으로 변환한다
     */
    private 시간문자열을분으로변환(timeStr: string): number {
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        return hours * 60 + minutes;
    }

    /**
     * 법정 휴식시간을 계산한다
     */
    private 법정휴식시간을계산한다(totalWorkMinutes: number): number {
        const FOUR_HOURS = 4 * 60; // 240분
        const EIGHT_HOURS = 8 * 60; // 480분

        if (totalWorkMinutes < FOUR_HOURS) {
            // 4시간 미만: 의무 없음
            return 0;
        } else if (totalWorkMinutes < EIGHT_HOURS) {
            // 4시간 이상 ~ 8시간 미만: 30분 이상
            return 30;
        } else {
            // 8시간 이상: 1시간 이상
            return 60;
        }
    }
}
