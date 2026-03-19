import { Injectable } from '@nestjs/common';
import { Employee } from '@libs/modules/employee/employee.entity';
import { ReservationVehicle } from '../../../domain/reservation-vehicle/reservation-vehicle.entity';
import { ResourceType } from '../../../../libs/enums/resource-type.enum';
import { ParticipantsType, ReservationStatus } from '../../../../libs/enums/reservation-type.enum';
import { DateUtil } from '../../../../libs/utils/date.util';
import { PaginationQueryDto } from '../../../../libs/dtos/pagination-query.dto';
import { PaginationData } from '../../../../libs/dtos/pagination-response.dto';
import { ReturnVehicleDto, UpdateReservationStatusDto, MarkVehicleUnusedDto } from '../dtos/update-reservation.dto';
import { ReservationListQueryDto } from '../dtos/reservation-list-query.dto';
import { ReservationListResponseDto } from '../dtos/reservation-list-response.dto';
import { ReservationResponseDto, ReservationWithRelationsResponseDto } from '../dtos/reservation-response.dto';
import { NotificationContextService } from '../../../context/notification/services/notification.context.service';
import { ReservationContextService } from '../../../context/reservation/services/reservation.context.service';
import { ReservationNotificationContextService } from '../../../context/notification/services/reservation-notification.context.service';
import { ScheduleQueryContextService } from '../../../context/schedule/services/schedule-query.context.service';

@Injectable()
export class ReservationService {
    constructor(
        private readonly reservationContextService: ReservationContextService,
        private readonly notificationContextService: NotificationContextService,
        private readonly scheduleQueryContextService: ScheduleQueryContextService,
        private readonly reservationNotificationContextService: ReservationNotificationContextService,
    ) {}

    async findReservationList(query: ReservationListQueryDto): Promise<ReservationListResponseDto> {
        const { startDate, endDate, resourceType, resourceId, status, keyword, sortOrder, page, limit } = query;

        // reservation 에서 sortOrder 에 맞는 데이터를 조회한다.
        // 조건부로 startDate, endDate, resourceType, status가 있다면 사용한다.

        // 1. 기본 예약 목록 조회 (schedule participants 제외)
        const basicReservations = await this.reservationContextService.예약목록을_조회한다(
            startDate,
            endDate,
            resourceType,
            resourceId,
            status,
            sortOrder,
        );

        if (basicReservations.length === 0) {
            return {
                reservations: [],
                totalCount: 0,
                filteredCount: 0,
                totalPages: 0,
                hasNext: false,
                hasPrevious: false,
            };
        }

        // 2. 모든 예약의 reservationId 수집
        const reservationIds = basicReservations.map((item) => item.reservationId);

        // 3. 각 예약별로 schedule ID 조회
        const scheduleIds = await this.scheduleQueryContextService.예약의_일정ID들을_조회한다(reservationIds);
        console.log(scheduleIds);
        // 4. 키워드 검색 적용
        const filteredScheduleIds = await this.scheduleQueryContextService.키워드로_일정ID들을_조회한다(
            scheduleIds,
            keyword,
        );
        console.log(filteredScheduleIds);
        // 5. 페이지네이션 적용
        const { paginatedIds, totalCount, filteredCount, totalPages, hasNext, hasPrevious } =
            this.scheduleQueryContextService.페이지네이션_일정ID들을_계산한다(filteredScheduleIds, page, limit);
        // 5. schedule과 participants 정보를 벌크로 조회
        const scheduleDataList = await this.scheduleQueryContextService.복수_일정과_관계정보들을_조회한다(
            paginatedIds,
            {
                withReservation: true,
                withResource: true,
                withParticipants: true,
            },
        );

        // 6. schedule ID별로 participants 매핑
        const participantsByScheduleId = new Map<string, any[]>();
        scheduleDataList.forEach((scheduleData) => {
            if (scheduleData.participants) {
                participantsByScheduleId.set(
                    scheduleData.schedule.scheduleId,
                    scheduleData.participants.map((participant) => {
                        const emp = participant.employee as any;
                        return {
                            ...participant,
                            employee: {
                                employeeId: participant.employeeId,
                                name: emp?.name,
                                employeeNumber: emp?.employeeNumber,
                                department: emp?.department ?? '',
                                position: emp?.position ?? '',
                                rank: emp?.rank?.rankTitle ?? emp?.rank ?? '',
                                positionTitle: emp?.positionTitle ?? '',
                            },
                        };
                    }),
                );
            }
        });
        const reservationsByScheduleId = scheduleDataList.map((scheduleData) => scheduleData.reservation.reservationId);
        const reservationVehiclesByScheduleId =
            await this.reservationContextService.예약_차량_목록을_조회한다(reservationsByScheduleId);
        const reservationVehiclesByScheduleIdMap = new Map<string, ReservationVehicle[]>();
        reservationVehiclesByScheduleId.forEach((reservationVehicle) => {
            reservationVehiclesByScheduleIdMap.set(reservationVehicle.reservationId, [reservationVehicle]);
        });

        const reservationResponseDtos = scheduleDataList.map(({ schedule, reservation, resource }) => {
            reservation.participants = participantsByScheduleId.get(schedule.scheduleId);
            reservation.reservationVehicles = reservationVehiclesByScheduleIdMap.get(reservation.reservationId) || [];
            reservation.resource = resource;
            return new ReservationWithRelationsResponseDto({
                ...reservation,
            });
        });
        return {
            reservations: reservationResponseDtos.sort((a, b) => b.startDate.localeCompare(a.startDate)),
            totalCount,
            filteredCount,
            totalPages,
            hasNext,
            hasPrevious,
        };
    }

    async findCheckReservationList(
        query: PaginationQueryDto,
    ): Promise<PaginationData<ReservationWithRelationsResponseDto>> {
        // 1. 기본 예약 목록 조회 (schedule participants 제외)
        const basicReservations = await this.reservationContextService.확인필요_예약목록을_조회한다(query);

        if (basicReservations.items.length === 0) {
            return basicReservations;
        }

        // 2. 모든 예약의 reservationId 수집
        const reservationIds = basicReservations.items.map((item) => item.reservationId);

        // 3. 각 예약별로 schedule ID 조회
        const scheduleIdMap = new Map<string, string>();
        const scheduleIdPromises = reservationIds.map(async (reservationId) => {
            const scheduleIds = await this.scheduleQueryContextService.예약의_일정ID들을_조회한다(reservationId);
            if (scheduleIds.length > 0) {
                scheduleIdMap.set(reservationId, scheduleIds[0]); // 첫 번째 schedule ID 사용
            }
        });

        await Promise.all(scheduleIdPromises);

        if (scheduleIdMap.size === 0) {
            return basicReservations;
        }

        // 5. schedule ID가 있는 예약들만 처리
        const scheduleIds = Array.from(scheduleIdMap.values());

        // 6. schedule과 participants 정보를 벌크로 조회
        const scheduleDataList = await this.scheduleQueryContextService.복수_일정과_관계정보들을_조회한다(scheduleIds, {
            withParticipants: true,
        });

        // 7. schedule ID별로 participants 매핑
        const participantsByScheduleId = new Map<string, any[]>();
        scheduleDataList.forEach((scheduleData) => {
            if (scheduleData.participants) {
                participantsByScheduleId.set(scheduleData.schedule.scheduleId, scheduleData.participants);
            }
        });

        // 8. reservation별로 participants 매핑하여 최종 결과 생성
        const enhancedItems = basicReservations.items.map((reservation) => {
            const scheduleId = scheduleIdMap.get(reservation.reservationId);
            if (scheduleId && participantsByScheduleId.has(scheduleId)) {
                const scheduleParticipants = participantsByScheduleId.get(scheduleId) || [];

                // schedule participants를 reservation participants 형태로 변환
                const allParticipants = scheduleParticipants.map((participant) => {
                    const emp = participant.employee as any;
                    return {
                        participantId: participant.participantId,
                        reservationId: reservation.reservationId,
                        employeeId: participant.employeeId,
                        type: participant.type,
                        employee: emp
                            ? {
                                  employeeId: emp.id,
                                  name: emp.name,
                                  employeeNumber: emp.employeeNumber,
                                  department: emp.department ?? '',
                                  position: emp.position ?? '',
                                  rank: emp.rank?.rankTitle ?? emp.rank ?? '',
                                  positionTitle: emp.positionTitle ?? '',
                              }
                            : undefined,
                        reservation: reservation,
                    };
                });

                // reservers와 participants로 분리
                const reservers = allParticipants.filter((p) => p.type === ParticipantsType.RESERVER);
                const participants = allParticipants.filter((p) => p.type === ParticipantsType.PARTICIPANT);

                // reservation 객체에 participants 추가
                const reservationWithParticipants = {
                    ...reservation,
                    reservers,
                    participants,
                };

                return reservationWithParticipants;
            } else {
                // schedule relation이 없는 경우 기존 방식으로 처리
                return reservation;
            }
        });

        return {
            items: enhancedItems,
            meta: basicReservations.meta,
        };
    }

    async findOne(user: Employee, reservationId: string): Promise<ReservationWithRelationsResponseDto> {
        // 1. 기본 예약 상세 조회 (schedule participants 제외)
        const basicReservation = await this.reservationContextService.예약_상세를_조회한다(user, reservationId);

        // 2. schedule ID 조회
        const scheduleIds = await this.scheduleQueryContextService.예약의_일정ID들을_조회한다(reservationId);

        if (scheduleIds.length === 0) {
            // schedule relation이 없는 경우 기존 방식으로 처리
            const notifications = await this.notificationContextService.차량반납_알림을_조회한다(reservationId);
            return { ...basicReservation, notifications };
        }

        // 3. schedule과 participants 정보 조회
        const scheduleData = await this.scheduleQueryContextService.일정과_관계정보들을_조회한다(scheduleIds[0], {
            withParticipants: true,
        });

        if (scheduleData && scheduleData.participants) {
            // 4. schedule participants를 reservation participants 형태로 변환
            const allParticipants = scheduleData.participants.map((participant) => {
                const emp = participant.employee as any;
                return {
                    participantId: participant.participantId,
                    reservationId: reservationId,
                    employeeId: participant.employeeId,
                    type: participant.type,
                    employee: emp
                        ? {
                              employeeId: emp.id,
                              name: emp.name,
                              employeeNumber: emp.employeeNumber,
                              department: emp.department ?? '',
                              position: emp.position ?? '',
                              rank: emp.rank?.rankTitle ?? emp.rank ?? '',
                              positionTitle: emp.positionTitle ?? '',
                          }
                        : undefined,
                    reservation: basicReservation,
                };
            });

            // 5. reservers와 participants로 분리
            const reservers = allParticipants.filter((p) => p.type === ParticipantsType.RESERVER);
            const participants = allParticipants.filter((p) => p.type === ParticipantsType.PARTICIPANT);

            // 6. reservation 객체에 participants 추가
            const reservationWithParticipants = {
                ...basicReservation,
                reservers,
                participants,
            };

            // 7. isMine, returnable, modifiable 로직 추가
            const isMine = reservers.some((reserver) => reserver.employeeId === user.id);

            const returnable =
                (reservationWithParticipants.resource as any).type === ResourceType.VEHICLE
                    ? isMine &&
                      reservationWithParticipants.reservationVehicles?.some(
                          (reservationVehicle) => !reservationVehicle.isReturned,
                      ) &&
                      reservationWithParticipants.startDate <= DateUtil.now().format()
                    : null;

            const modifiable =
                [ReservationStatus.PENDING, ReservationStatus.CONFIRMED].includes(basicReservation.status) &&
                isMine &&
                reservationWithParticipants.endDate > DateUtil.now().format();

            // 8. notifications 추가
            const notifications = await this.notificationContextService.차량반납_알림을_조회한다(reservationId);
            return {
                ...reservationWithParticipants,
                isMine,
                returnable,
                modifiable,
                notifications,
            };
        } else {
            // schedule participants가 없는 경우 기본 로직으로 처리
            const isMine = false; // participants 정보가 없으므로 false
            const returnable = null; // participants 정보가 없으므로 null
            const modifiable = false; // participants 정보가 없으므로 false

            const notifications = await this.notificationContextService.차량반납_알림을_조회한다(reservationId);
            return {
                ...basicReservation,
                isMine,
                returnable,
                modifiable,
                notifications,
            };
        }
    }

    async updateStatus(reservationId: string, updateDto: UpdateReservationStatusDto): Promise<ReservationResponseDto> {
        const updatedReservation = await this.reservationContextService.예약상태를_변경한다(reservationId, updateDto);

        // const notiTarget = [
        //     ...updatedReservation.resource.resourceManagers.map((manager) => manager.employeeId),
        //     ...updatedReservation.participants.map((reserver) => reserver.employeeId),
        // ];

        // if (updatedReservation.resource.notifyReservationChange && updateDto.status !== ReservationStatus.CLOSED) {
        //     try {
        //         let notificationType: NotificationType;
        //         switch (updateDto.status) {
        //             case ReservationStatus.CONFIRMED:
        //                 notificationType = NotificationType.RESERVATION_STATUS_CONFIRMED;
        //                 break;
        //             case ReservationStatus.CANCELLED:
        //                 notificationType = NotificationType.RESERVATION_STATUS_CANCELLED;
        //                 break;
        //             case ReservationStatus.REJECTED:
        //                 notificationType = NotificationType.RESERVATION_STATUS_REJECTED;
        //                 break;
        //         }

        //         await this.notificationService.createNotification(
        //             notificationType,
        //             {
        //                 reservationId: updatedReservation.reservationId,
        //                 reservationTitle: updatedReservation.title,
        //                 reservationDate: DateUtil.toAlarmRangeString(
        //                     DateUtil.format(updatedReservation.startDate),
        //                     DateUtil.format(updatedReservation.endDate),
        //                 ),
        //                 resourceId: updatedReservation.resource.resourceId,
        //                 resourceName: updatedReservation.resource.name,
        //                 resourceType: updatedReservation.resource.type,
        //             },
        //             notiTarget,
        //         );
        //     } catch (error) {
        //         console.log(error);
        //         console.log('Notification creation failed in updateStatus');
        //     }
        // }

        return updatedReservation;
    }

    async returnVehicle(user: Employee, reservationId: string, returnDto: ReturnVehicleDto): Promise<boolean> {
        const result = await this.reservationContextService.차량을_반납한다(user, reservationId, returnDto);

        // 예약의 스케쥴 정보를 조회한다.
        const scheduleIds = await this.scheduleQueryContextService.예약의_일정ID들을_조회한다(reservationId);
        // 일정과_관계정보들을_조회한다
        const { schedule, resource, reservation } = await this.scheduleQueryContextService.일정과_관계정보들을_조회한다(
            scheduleIds[0],
            {
                withReservation: true,
                withResource: true,
            },
        );

        await this.reservationNotificationContextService.차량반납_알림을_전송한다({ schedule, reservation, resource }, [
            user.id,
        ]);
        return result;
    }

    async markVehicleUnused(
        user: Employee,
        reservationId: string,
        markUnusedDto: MarkVehicleUnusedDto,
    ): Promise<boolean> {
        const result = await this.reservationContextService.차량을_미사용처리한다(
            user,
            reservationId,
            markUnusedDto.remarks,
        );

        // // 예약의 스케쥴 정보를 조회한다.
        // const scheduleIds = await this.scheduleQueryContextService.예약의_일정ID들을_조회한다(reservationId);
        // // 일정과_관계정보들을_조회한다
        // const { schedule, resource, reservation } = await this.scheduleQueryContextService.일정과_관계정보들을_조회한다(
        //     scheduleIds[0],
        //     {
        //         withReservation: true,
        //         withResource: true,
        //     },
        // );

        // 미사용 처리 알림 전송 (필요에 따라 추가)
        // await this.reservationNotificationContextService.차량미사용_알림을_전송한다({ schedule, reservation, resource }, [
        //     user.id,
        // ]);

        return result;
    }
}
