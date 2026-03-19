import { Injectable } from '@nestjs/common';
import { Employee } from '@libs/modules/employee/employee.entity';
import { ResourceContextService } from '../../context/resource/services/resource.context.service';
import { NotificationContextService } from '../../context/notification/services/notification.context.service';
import { ConsumableContextService } from '../../context/resource/services/consumable.context.service';
import { Role } from '../../../libs/enums/role-type.enum';
import { ParticipantsType, ReservationStatus } from '../../../libs/enums/reservation-type.enum';
import { TaskListResponseDto, TaskResponseDto } from './dtos/task-response.dto';
import { ReservationContextService } from '../../context/reservation/services/reservation.context.service';
import { ScheduleQueryContextService } from '../../context/schedule/services/schedule-query.context.service';

@Injectable()
export class TaskManagementService {
    constructor(
        private readonly resourceContextService: ResourceContextService,
        private readonly reservationContextService: ReservationContextService,
        private readonly notificationContextService: NotificationContextService,
        private readonly scheduleQueryContextService: ScheduleQueryContextService,
        private readonly consumableContextService: ConsumableContextService,
    ) {}

    /**
     * 사용자의 작업 목록을 조회한다
     */
    async getTaskList(user: Employee, type?: string): Promise<TaskListResponseDto> {
        let delayedReturnTasks = [];
        let consumableReplaceTasks = [];

        if (type === '차량반납지연' || type === '전체') {
            // 반납 지연된 예약 조회
            const scheduleIds = await this.scheduleQueryContextService.직원의_역할별_일정ID들을_조회한다(
                user.id,
                ParticipantsType.RESERVER,
            );
            const scheduleRelations = await this.scheduleQueryContextService.복수_일정과_관계정보들을_조회한다(
                scheduleIds,
                {
                    withReservation: true,
                    withResource: true, // 리소스 정보도 함께 조회
                },
            );
            // 메모리에서 지연반납 조건 체크
            const now = new Date();
            const potentialDelayedReservations = scheduleRelations
                .filter(({ reservation }) => reservation && reservation.status === ReservationStatus.CLOSING)
                .map(({ reservation, resource }) => ({ reservation, resource }));

            // 지연반납 확인을 위해 reservationVehicles 정보가 필요한 예약들만 추가 조회
            const delayedReturnReservations = await this.reservationContextService.지연반납_예약_상세정보를_조회한다(
                potentialDelayedReservations.map(({ reservation }) => reservation.reservationId),
            );

            // 실제 지연반납 상태인 예약들만 필터링 및 작업 목록 변환
            delayedReturnTasks = delayedReturnReservations
                .filter(
                    (reservation) =>
                        reservation.reservationVehicles &&
                        reservation.reservationVehicles.some((vehicle) => !vehicle.isReturned),
                )
                .map((reservation) => {
                    // scheduleRelations에서 이미 조회한 resource 정보 활용
                    const scheduleData = scheduleRelations.find(
                        ({ reservation: r }) => r?.reservationId === reservation.reservationId,
                    );
                    const resourceInfo = scheduleData?.resource || reservation.resource;

                    return {
                        type: '반납지연',
                        title: `${resourceInfo.name} 반납 지연 중`,
                        scheduleId: scheduleData?.schedule?.scheduleId,
                        reservationId: reservation.reservationId,
                        resourceId: resourceInfo.resourceId,
                        resourceName: resourceInfo.name,
                        startDate: reservation.startDate,
                        endDate: reservation.endDate,
                    };
                });
        }
        if (type === '소모품교체' || type === '전체') {
            const userAny = user as any;
            const isResourceAdmin = (userAny.roles as string[] | undefined)?.includes(Role.RESOURCE_ADMIN) ?? false;
            const isSystemAdmin = (userAny.roles as string[] | undefined)?.includes(Role.SYSTEM_ADMIN) ?? false;

            let needReplaceConsumable = [];
            if (isResourceAdmin || isSystemAdmin) {
                // 소모품 교체 필요한 자원들 조회
                needReplaceConsumable = await this.교체필요한_소모품을_조회한다(user, isSystemAdmin);
            }
            // 소모품 교체 작업 목록 변환
            consumableReplaceTasks = needReplaceConsumable.map((item) => ({
                type: '소모품교체',
                title: item.title,
                reservationId: null,
                resourceId: item.resourceId,
                resourceName: item.resourceName,
                consumableId: item.consumableId,
                consumableName: item.consumableName,
                startDate: null,
                endDate: null,
            }));
        }

        const items = [...delayedReturnTasks, ...consumableReplaceTasks];

        return {
            totalCount: items.length,
            items,
        };
    }

    /**
     * 관리자용 작업 목록을 조회한다
     */
    async getAdminTaskList(type?: string): Promise<TaskResponseDto[]> {
        const results = [];

        if (type === '차량반납지연' || type === '전체') {
            // 1. 기본 지연반납 차량 목록 조회
            const basicDelayedVehicles = await this.reservationContextService.모든_지연반납_차량을_조회한다();

            // 2. 각 예약에 대해 schedule participants 정보를 조회하여 manager 정보를 가져옴
            const enhancedTasks = await Promise.all(
                basicDelayedVehicles.map(async (task) => {
                    // schedule ID 조회
                    const scheduleIds = await this.scheduleQueryContextService.예약의_일정ID들을_조회한다(
                        task.reservationId,
                    );

                    let manager = null;
                    if (scheduleIds.length > 0) {
                        // schedule과 participants 정보 조회
                        const scheduleData = await this.scheduleQueryContextService.일정과_관계정보들을_조회한다(
                            scheduleIds[0],
                            {
                                withParticipants: true,
                            },
                        );

                        if (scheduleData && scheduleData.participants) {
                            // 예약자(manager) 찾기

                            const reserver = scheduleData.participants.find(
                                (participant) => participant.type === ParticipantsType.RESERVER,
                            );

                            if (reserver && reserver.employee) {
                                const emp = reserver.employee as any;
                                manager = {
                                    employeeId: reserver.employee.id,
                                    name: reserver.employee.name,
                                    employeeNumber: reserver.employee.employeeNumber,
                                    department: emp.department ?? '',
                                    position: emp.position ?? '',
                                    rank: emp.rank?.rankTitle ?? emp.rank ?? '',
                                    positionTitle: emp.positionTitle ?? '',
                                };
                            }
                        }
                    }

                    return {
                        ...task,
                        manager,
                    };
                }),
            );

            results.push(...enhancedTasks);
        }

        if (type === '소모품교체' || type === '전체') {
            const consumableTasks = await this.교체필요한_모든_소모품을_조회한다();
            results.push(...consumableTasks);
        }

        return results;
    }

    /**
     * 교체 필요한 모든 소모품을 조회한다 (관리자용)
     */
    private async 교체필요한_모든_소모품을_조회한다(): Promise<TaskResponseDto[]> {
        // 모든 자원의 소모품 상태 조회
        const resources = await this.resourceContextService.소모품정보와_함께_모든자원을_조회한다();

        const needReplaceConsumables = [];

        for (const resource of resources) {
            // 차량의 모든 소모품에 대해 교체 필요 여부 계산
            const consumableResults = await this.consumableContextService.차량_소모품들의_교체필요여부를_계산한다(
                resource.vehicleInfo,
            );

            for (const { consumable, isReplacementRequired } of consumableResults) {
                if (isReplacementRequired) {
                    // 해당 소모품에 대한 알림 조회
                    const notifications = await this.notificationContextService.소모품교체_알림을_조회한다(
                        resource.resourceId,
                        consumable.name,
                        // latestMaintenance.date,
                    );

                    needReplaceConsumables.push({
                        type: '소모품교체',
                        title: `${consumable.name} 교체 필요`,
                        reservationId: null,
                        resourceId: resource.resourceId,
                        resourceName: resource.name,
                        consumableId: consumable.consumableId,
                        consumableName: consumable.name,
                        startDate: null,
                        endDate: null,
                        manager: resource.resourceManagers?.[0]?.employee ? (() => {
                            const mgrEmp = resource.resourceManagers[0].employee as any;
                            return {
                                employeeId: mgrEmp.id,
                                name: mgrEmp.name,
                                employeeNumber: mgrEmp.employeeNumber,
                                department: mgrEmp.department ?? '',
                                position: mgrEmp.position ?? '',
                                rank: mgrEmp.rank?.rankTitle ?? mgrEmp.rank ?? '',
                                positionTitle: mgrEmp.positionTitle ?? '',
                            };
                        })() : null,
                        notifications: notifications,
                        // 직전 정비시 주행거리
                        lastMaintenanceMileage:
                            consumable.maintenances && consumable.maintenances.length > 0
                                ? consumable.maintenances[0].mileage
                                : consumable.initMileage,
                        // 직전 정비 날짜
                        lastMaintenanceDate:
                            consumable.maintenances && consumable.maintenances.length > 0
                                ? consumable.maintenances[0].date
                                : null,
                        // 총 주행거리
                        totalMileage: resource.vehicleInfo.totalMileage,
                    });
                }
            }
        }

        return needReplaceConsumables;
    }

    /**
     * 교체 필요한 소모품을 조회한다 (사용자별)
     */
    private async 교체필요한_소모품을_조회한다(user: Employee, isSystemAdmin: boolean): Promise<TaskResponseDto[]> {
        const resources = await this.resourceContextService.관리자별_자원을_소모품정보와_함께_조회한다(
            user.id,
            isSystemAdmin,
        );

        const needReplaceConsumables = [];

        for (const resource of resources) {
            // 차량의 모든 소모품에 대해 교체 필요 여부 계산
            const consumableResults = await this.consumableContextService.차량_소모품들의_교체필요여부를_계산한다(
                resource.vehicleInfo,
            );

            for (const { consumable, isReplacementRequired } of consumableResults) {
                if (isReplacementRequired) {
                    needReplaceConsumables.push({
                        type: '소모품교체',
                        title: `${consumable.name} 교체 필요`,
                        reservationId: null,
                        resourceId: resource.resourceId,
                        resourceName: resource.name,
                        consumableId: consumable.consumableId,
                        consumableName: consumable.name,
                        startDate: null,
                        endDate: null,
                    });
                }
            }
        }

        return needReplaceConsumables;
    }
}
