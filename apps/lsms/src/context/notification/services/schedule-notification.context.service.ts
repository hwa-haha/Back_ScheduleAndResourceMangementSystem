import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { NotificationContextService } from './notification.context.service';
import { Schedule } from '../../../domain/schedule/schedule.entity';
import { NotificationType } from '../../../../libs/enums/notification-type.enum';
import { Reservation } from '../../../domain/reservation/reservation.entity';
import { Resource } from '../../../domain/resource/resource.entity';
import { DateUtil } from '../../../../libs/utils/date.util';
import { CreateNotificationDataDto } from '../dtos/create-notification.dto';
import { ReservationStatus } from '../../../../libs/enums/reservation-type.enum';
import { ResourceType } from '../../../../libs/enums/resource-type.enum';
import { ScheduleUpdateResult } from '../../schedule/services/schedule-state-transition.service';
import { UpdateScenarios } from '../../schedule/services/schedule-policy.service';
import { DomainEmployeeNotificationService } from '../../../domain/employee-notification/employee-notification.service';

@Injectable()
export class ScheduleNotificationContextService {
    private readonly logger = new Logger(ScheduleNotificationContextService.name);
    constructor(
        private readonly notificationContextService: NotificationContextService,
        private readonly employeeNotificationService: DomainEmployeeNotificationService,
    ) {}

    async 일정_생성_알림을_전송한다(
        data: { schedule: Schedule; reservation: Reservation; resource: Resource },
        targetEmployeeIds: string[],
        adminEmployeeIds: string[],
    ): Promise<void> {
        const notificationData: CreateNotificationDataDto = {
            schedule: {
                scheduleId: data.schedule.scheduleId,
                scheduleTitle: data.schedule.title,
                startDate: DateUtil.format(data.schedule.startDate, 'YYYY-MM-DD HH:mm'),
                endDate: DateUtil.format(data.schedule.endDate, 'YYYY-MM-DD HH:mm'),
            },
            reservation: {
                reservationId: data.reservation?.reservationId,
            },
            resource: {
                resourceId: data.resource?.resourceId,
                resourceName: data.resource?.name,
                resourceType: data.resource?.type,
            },
        };

        if (
            data.reservation?.status === ReservationStatus.PENDING &&
            data.resource?.type === ResourceType.ACCOMMODATION
        ) {
            await this.notificationContextService.알림_전송_프로세스를_진행한다(
                NotificationType.RESERVATION_STATUS_PENDING,
                notificationData,
                adminEmployeeIds,
            );
        } else if (
            data.reservation?.status === ReservationStatus.CONFIRMED ||
            data.reservation?.status === ReservationStatus.USING
        ) {
            await this.notificationContextService.알림_전송_프로세스를_진행한다(
                NotificationType.RESERVATION_STATUS_CONFIRMED,
                notificationData,
                targetEmployeeIds,
            );
        }
    }

    async 일정_취소_알림을_전송한다(
        data: { schedule: Schedule; reservation: Reservation; resource: Resource },
        targetEmployeeIds: string[],
    ): Promise<void> {
        const notificationData: CreateNotificationDataDto = {
            schedule: {
                scheduleId: data.schedule.scheduleId,
                scheduleTitle: data.schedule.title,
                startDate: DateUtil.format(data.schedule.startDate, 'YYYY-MM-DD HH:mm'),
                endDate: DateUtil.format(data.schedule.endDate, 'YYYY-MM-DD HH:mm'),
            },
            reservation: {
                reservationId: data.reservation?.reservationId,
            },
            resource: {
                resourceId: data.resource?.resourceId,
                resourceName: data.resource?.name,
                resourceType: data.resource?.type,
            },
        };

        await this.notificationContextService.알림_전송_프로세스를_진행한다(
            NotificationType.RESERVATION_STATUS_CANCELLED,
            notificationData,
            targetEmployeeIds,
        );
    }

    async 일정_수정_알림을_전송한다(
        updateScenarios: UpdateScenarios,
        data: { schedule: Schedule; reservation: Reservation; resource: Resource },
        targetEmployeeIds: string[],
    ): Promise<void> {
        const notificationData: CreateNotificationDataDto = {
            schedule: {
                scheduleId: data.schedule.scheduleId,
                scheduleTitle: data.schedule.title,
                startDate: DateUtil.format(data.schedule.startDate, 'YYYY-MM-DD HH:mm'),
                endDate: DateUtil.format(data.schedule.endDate, 'YYYY-MM-DD HH:mm'),
            },
            reservation: {
                reservationId: data.reservation?.reservationId,
            },
            resource: {
                resourceId: data.resource?.resourceId,
                resourceName: data.resource?.name,
                resourceType: data.resource?.type,
            },
        };
        if (updateScenarios.isDateUpdate || updateScenarios.isResourceUpdate) {
            await this.notificationContextService.알림_전송_프로세스를_진행한다(
                NotificationType.RESERVATION_TIME_CHANGED,
                notificationData,
                targetEmployeeIds,
            );
        } else if (updateScenarios.isInfoUpdate && targetEmployeeIds.length > 0) {
            await this.notificationContextService.알림_전송_프로세스를_진행한다(
                NotificationType.RESERVATION_PARTICIPANT_CHANGED,
                notificationData,
                targetEmployeeIds,
            );
        }
    }

    /**
     * 특정 스케줄에 대한 읽지 않은 알림이 있는지 확인
     * @param scheduleId 스케줄 ID
     * @param employeeId 직원 ID
     * @returns 읽지 않은 알림이 있으면 true, 없으면 false
     */
    async 스케줄별_읽지않은_알림을_확인한다(scheduleId: string, employeeId: string): Promise<boolean> {
        try {
            // 해당 직원의 모든 알림을 조회
            const employeeNotifications = await this.employeeNotificationService.findByEmployeeId(employeeId);

            // 읽지 않은 알림 중에서 해당 스케줄과 관련된 것이 있는지 확인
            const hasUnreadScheduleNotification = employeeNotifications.some((empNotification) => {
                // 읽지 않은 알림인지 확인
                if (empNotification.isRead) {
                    return false;
                }

                const notificationData = empNotification.notification?.notificationData;
                if (!notificationData) {
                    return false;
                }

                // 새로운 nested 구조에서 스케줄 ID 확인
                if (notificationData.schedule?.scheduleId === scheduleId) {
                    return true;
                }

                // 기존 flat 구조에서 스케줄 ID 확인 (하위 호환성)
                if (notificationData.scheduleId === scheduleId) {
                    return true;
                }

                return false;
            });

            return hasUnreadScheduleNotification;
        } catch (error) {
            this.logger.error(`스케줄별 읽지않은 알림 확인 중 오류 발생: ${error.message}`, error.stack);
            return false; // 오류 발생 시 false 반환
        }
    }

    /**
     * 여러 스케줄에 대한 읽지 않은 알림을 한 번에 확인 (성능 최적화)
     * @param scheduleIds 스케줄 ID 배열
     * @param employeeId 직원 ID
     * @returns 스케줄 ID를 키로, 읽지 않은 알림 정보를 값으로 하는 Map
     */
    async 여러_스케줄의_읽지않은_알림을_확인한다(
        scheduleIds: string[],
        employeeId: string,
    ): Promise<Map<string, { hasUnreadNotification: boolean; notificationId?: string }>> {
        const resultMap = new Map<string, { hasUnreadNotification: boolean; notificationId?: string }>();

        // 모든 스케줄 ID를 false로 초기화
        scheduleIds.forEach((scheduleId) => {
            resultMap.set(scheduleId, { hasUnreadNotification: false });
        });

        try {
            if (scheduleIds.length === 0) {
                return resultMap;
            }
            // 해당 직원의 모든 읽지 않은 알림을 한 번에 조회
            const employeeNotifications = await this.employeeNotificationService.findByEmployeeId(employeeId);
            // 읽지 않은 알림만 필터링하고 스케줄 ID별로 확인
            employeeNotifications
                .filter((empNotification) => !empNotification.isRead)
                .forEach((empNotification) => {
                    const notificationData = empNotification.notification?.notificationData;
                    if (!notificationData) {
                        return;
                    }

                    let scheduleId: string | undefined;

                    // 새로운 nested 구조에서 스케줄 ID 확인
                    if (notificationData.schedule?.scheduleId) {
                        scheduleId = notificationData.schedule.scheduleId;
                    }
                    // 기존 flat 구조에서 스케줄 ID 확인 (하위 호환성)
                    else if (notificationData.scheduleId) {
                        scheduleId = notificationData.scheduleId;
                    }

                    // 요청된 스케줄 ID 중에 해당하는 것이 있으면 알림 정보 설정
                    if (scheduleId && resultMap.has(scheduleId)) {
                        resultMap.set(scheduleId, {
                            hasUnreadNotification: true,
                            notificationId: empNotification.notification?.notificationId,
                        });
                    }
                });
            return resultMap;
        } catch (error) {
            this.logger.error(`여러 스케줄별 읽지않은 알림 확인 중 오류 발생: ${error.message}`, error.stack);
            return resultMap; // 오류 발생 시 모든 값이 false인 Map 반환
        }
    }
}
