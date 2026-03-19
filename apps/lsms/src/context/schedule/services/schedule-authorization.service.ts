import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Employee } from '@libs/modules/employee/employee.entity';
import { Schedule } from '../../../domain/schedule/schedule.entity';
import { ScheduleParticipant } from '../../../domain/schedule-participant/schedule-participant.entity';
import { ParticipantsType } from '../../../../libs/enums/reservation-type.enum';
import { DomainScheduleService } from '../../../domain/schedule/schedule.service';
import { DomainScheduleParticipantService } from '../../../domain/schedule-participant/schedule-participant.service';

export enum ScheduleAction {
    VIEW = 'VIEW',
    CREATE = 'CREATE',
    CANCEL = 'CANCEL',
    COMPLETE = 'COMPLETE',
    EXTEND = 'EXTEND',
    UPDATE = 'UPDATE',
}

export interface AuthorizationResult {
    isAuthorized: boolean;
    reason?: string;
    userRole?: ParticipantsType;
}

@Injectable()
export class ScheduleAuthorizationService {
    constructor(
        private readonly domainScheduleService: DomainScheduleService,
        private readonly domainScheduleParticipantService: DomainScheduleParticipantService,
    ) {}

    /**
     * 일정에 대한 사용자 권한을 체크합니다
     */
    async 일정_권한을_확인한다(
        user: Employee,
        scheduleId: string,
        action: ScheduleAction,
    ): Promise<AuthorizationResult> {
        // 1. 일정 존재 여부 확인
        const schedule = await this.domainScheduleService.findByScheduleId(scheduleId);
        if (!schedule) {
            throw new NotFoundException(`일정을 찾을 수 없습니다. ID: ${scheduleId}`);
        }

        // 2. 사용자의 일정 참여 정보 조회
        const reserver = await this.domainScheduleParticipantService.findReserverByScheduleId(
            user.id,
            scheduleId,
        );

        if (!reserver) {
            return {
                isAuthorized: false,
                reason: '해당 일정의 예약자가 아닙니다.',
            };
        }

        const userRole = reserver.type;

        // 3. 액션별 권한 체크
        const authResult = this._액션별_권한을_체크한다(userRole, action, schedule);

        return {
            ...authResult,
            userRole,
        };
    }

    /**
     * 사용자가 일정의 예약자인지 확인합니다
     */
    async 예약자인지_확인한다(user: Employee, scheduleId: string): Promise<boolean> {
        return await this.domainScheduleParticipantService.checkReserverByScheduleId(user.id, scheduleId);
    }

    /**
     * 사용자가 일정의 참가자인지 확인합니다 (예약자 포함)
     */
    async 참가자인지_확인한다(user: Employee, scheduleId: string): Promise<boolean> {
        const participants = await this.domainScheduleParticipantService.findByEmployeeIdAndScheduleIds(
            user.id,
            [scheduleId],
        );

        return participants.length > 0;
    }

    /**
     * 일정 생성 권한을 체크합니다
     */
    async 일정_생성_권한을_확인한다(user: Employee): Promise<AuthorizationResult> {
        // 일반적으로 모든 직원이 일정 생성 가능
        // 추가적인 권한 체크가 필요한 경우 여기에 구현

        // TODO: 특정 권한이 필요한 경우 체크 로직 추가
        // 예: 회사 전체 일정은 관리자만 생성 가능 등

        return {
            isAuthorized: true,
        };
    }

    /**
     * 시스템 관리자인지 확인합니다
     */
    시스템관리자인지_확인한다(user: Employee): boolean {
        // TODO: 실제 권한 체크 로직 구현 (Role Entity 등)
        return user.email?.includes('admin') || false; // 임시 로직
    }

    /**
     * 액션별 권한 체크 로직
     */
    private _액션별_권한을_체크한다(
        userRole: ParticipantsType,
        action: ScheduleAction,
        schedule: Schedule,
    ): Pick<AuthorizationResult, 'isAuthorized' | 'reason'> {
        switch (action) {
            case ScheduleAction.VIEW:
                // 참가자라면 누구나 조회 가능
                return { isAuthorized: true };

            case ScheduleAction.CREATE:
                // 모든 직원이 일정 생성 가능
                return { isAuthorized: true };

            case ScheduleAction.CANCEL:
                // 예약자만 취소 가능
                if (userRole !== ParticipantsType.RESERVER) {
                    return {
                        isAuthorized: false,
                        reason: '일정 취소는 예약자만 가능합니다.',
                    };
                }
                return { isAuthorized: true };

            case ScheduleAction.COMPLETE:
                // 예약자만 완료 가능
                if (userRole !== ParticipantsType.RESERVER) {
                    return {
                        isAuthorized: false,
                        reason: '일정 완료는 예약자만 가능합니다.',
                    };
                }
                return { isAuthorized: true };

            case ScheduleAction.EXTEND:
                // 예약자만 연장 가능
                if (userRole !== ParticipantsType.RESERVER) {
                    return {
                        isAuthorized: false,
                        reason: '일정 연장은 예약자만 가능합니다.',
                    };
                }
                return { isAuthorized: true };

            case ScheduleAction.UPDATE:
                // 예약자만 수정 가능
                if (userRole !== ParticipantsType.RESERVER) {
                    return {
                        isAuthorized: false,
                        reason: '일정 수정은 예약자만 가능합니다.',
                    };
                }
                return { isAuthorized: true };

            default:
                return {
                    isAuthorized: false,
                    reason: '알 수 없는 액션입니다.',
                };
        }
    }

    /**
     * 권한 체크 실패 시 예외를 던집니다
     */
    권한_체크_실패시_예외를_던진다(authResult: AuthorizationResult): void {
        if (!authResult.isAuthorized) {
            throw new UnauthorizedException(authResult.reason || '권한이 없습니다.');
        }
    }
}
