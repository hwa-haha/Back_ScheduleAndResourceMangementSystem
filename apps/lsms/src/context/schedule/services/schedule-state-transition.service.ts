import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { Schedule } from '../../../domain/schedule/schedule.entity';
import { ScheduleDepartment } from '../../../domain/schedule-department/schedule-department.entity';
import { Reservation } from '../../../domain/reservation/reservation.entity';
import { ScheduleParticipant } from '../../../domain/schedule-participant/schedule-participant.entity';
import { ParticipantsType, ReservationStatus } from '../../../../libs/enums/reservation-type.enum';
import { ScheduleStatus } from '../../../../libs/enums/schedule-type.enum';
import { DomainScheduleService } from '../../../domain/schedule/schedule.service';
import { DomainReservationService } from '../../../domain/reservation/reservation.service';
import { DomainScheduleRelationService } from '../../../domain/schedule-relation/schedule-relation.service';
import { DomainScheduleParticipantService } from '../../../domain/schedule-participant/schedule-participant.service';
import { DomainScheduleDepartmentService } from '../../../domain/schedule-department/schedule-department.service';
import { DateUtil } from '../../../../libs/utils/date.util';
import { Resource } from '../../../domain/resource/resource.entity';
import { ResourceType } from '../../../../libs/enums/resource-type.enum';

export interface ScheduleCancelResult {
    schedule: Schedule;
    reservation?: Reservation;
    cancelledAt: Date;
}

export interface ScheduleCompleteResult {
    schedule: Schedule;
    reservation?: Reservation;
    completedAt: Date;
}

export interface ScheduleExtendResult {
    schedule: Schedule;
    reservation?: Reservation;
    originalEndDate: Date;
    newEndDate: Date;
}

export interface ScheduleUpdateResult {
    schedule: Schedule;
    reservation?: Reservation;
    changes: string[];
    participantChanges?: {
        previousParticipants: ScheduleParticipant[];
        newParticipants: ScheduleParticipant[];
    };
}

export interface ScheduleInfoUpdateResult {
    schedule: Schedule;
    participantChanges?: {
        previousParticipants: ScheduleParticipant[];
        newParticipants: ScheduleParticipant[];
    };
}

@Injectable()
export class ScheduleStateTransitionService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly domainScheduleService: DomainScheduleService,
        private readonly domainReservationService: DomainReservationService,
        private readonly domainScheduleRelationService: DomainScheduleRelationService,
        private readonly domainScheduleParticipantService: DomainScheduleParticipantService,
        private readonly domainScheduleDepartmentService: DomainScheduleDepartmentService,
    ) {}

    async 일정을_취소한다(
        schedule: Schedule,
        reservation: Reservation | undefined,
        cancelReason?: string,
        queryRunner?: QueryRunner,
    ): Promise<boolean> {
        const shouldManageTransaction = !queryRunner;
        if (shouldManageTransaction) {
            queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
        }

        try {
            if (reservation) {
                await this.domainReservationService.update(
                    reservation.reservationId,
                    { status: ReservationStatus.CANCELLED },
                    { queryRunner },
                );
            }

            // const updatedDescription = schedule.description
            //     ? `${schedule.description}\n\n[${DateUtil.format(cancelledAt, 'YYYY-MM-DD HH:mm')}] 일정이 취소되었습니다.${cancelReason ? ` 사유: ${cancelReason}` : ''}`
            //     : `[${DateUtil.format(cancelledAt, 'YYYY-MM-DD HH:mm')}] 일정이 취소되었습니다.${cancelReason ? ` 사유: ${cancelReason}` : ''}`;

            await this.domainScheduleService.softDelete(schedule.scheduleId, { queryRunner });

            if (shouldManageTransaction) {
                await queryRunner.commitTransaction();
            }

            return true;
        } catch (error) {
            if (shouldManageTransaction) {
                await queryRunner.rollbackTransaction();
            }
            return false;
        } finally {
            if (shouldManageTransaction) {
                await queryRunner.release();
            }
        }
    }

    async 일정을_완료한다(
        schedule: Schedule,
        reservation: Reservation | undefined,
        resource: Resource | undefined,
        queryRunner?: QueryRunner,
    ): Promise<boolean> {
        const shouldManageTransaction = !queryRunner;
        if (shouldManageTransaction) {
            queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
        }

        try {
            const completedAt = new Date();
            // 현재 시간을 30분 단위로 올림하여 새로운 종료시간 계산
            const newEndTime = new Date(completedAt);
            const minutes = newEndTime.getMinutes();

            if (minutes === 0) {
                // 정각이면 그대로 유지
                newEndTime.setSeconds(0, 0);
            } else if (minutes <= 30) {
                // 1~30분이면 30분으로 설정
                newEndTime.setMinutes(30, 0, 0);
            } else {
                // 31~59분이면 다음 시간 0분으로 설정
                newEndTime.setHours(newEndTime.getHours() + 1, 0, 0, 0);
            }
            // 기존 종료시간보다 이른 경우에만 종료시간 수정
            const shouldUpdateEndTime = newEndTime < schedule.endDate;
            const actualEndTime = shouldUpdateEndTime ? newEndTime : schedule.endDate;
            const status =
                resource?.type === ResourceType.VEHICLE ? ReservationStatus.CLOSING : ReservationStatus.CLOSED;
            if (reservation && shouldUpdateEndTime) {
                // 예약의 종료시간도 함께 수정
                await this.domainReservationService.update(
                    reservation.reservationId,
                    {
                        status: status,
                        endDate: actualEndTime,
                    },
                    { queryRunner },
                );

                reservation = await this.domainReservationService.findOne({
                    where: { reservationId: reservation.reservationId },
                });
            } else if (reservation) {
                await this.domainReservationService.update(
                    reservation.reservationId,
                    { status: status },
                    { queryRunner },
                );

                reservation = await this.domainReservationService.findOne({
                    where: { reservationId: reservation.reservationId },
                });
            }

            await this.domainScheduleService.update(
                schedule.scheduleId,
                {
                    status: ScheduleStatus.COMPLETED,
                    ...(shouldUpdateEndTime && { endDate: actualEndTime }),
                },
                { queryRunner },
            );

            if (shouldManageTransaction) {
                await queryRunner.commitTransaction();
            }

            const updatedSchedule = await this.domainScheduleService.findOne({
                where: { scheduleId: schedule.scheduleId },
            });
            return true;
        } catch (error) {
            console.error(error);
            if (shouldManageTransaction) {
                await queryRunner.rollbackTransaction();
            }
            return false;
        } finally {
            if (shouldManageTransaction) {
                await queryRunner.release();
            }
        }
    }

    async 일정을_연장한다(
        schedule: Schedule,
        reservation: Reservation | undefined,
        newEndDate: Date,
        extendReason?: string,
        queryRunner?: QueryRunner,
    ): Promise<ScheduleExtendResult> {
        const shouldManageTransaction = !queryRunner;
        if (shouldManageTransaction) {
            queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
        }

        try {
            const originalEndDate = schedule.endDate;

            if (reservation) {
                await this.domainReservationService.update(
                    reservation.reservationId,
                    { endDate: newEndDate },
                    { queryRunner },
                );

                reservation = await this.domainReservationService.findOne({
                    where: { reservationId: reservation.reservationId },
                });
            }

            await this.domainScheduleService.update(schedule.scheduleId, { endDate: newEndDate }, { queryRunner });

            if (shouldManageTransaction) {
                await queryRunner.commitTransaction();
            }

            const updatedSchedule = await this.domainScheduleService.findOne({
                where: { scheduleId: schedule.scheduleId },
            });

            return { schedule: updatedSchedule!, reservation, originalEndDate, newEndDate };
        } catch (error) {
            if (shouldManageTransaction) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        } finally {
            if (shouldManageTransaction) {
                await queryRunner.release();
            }
        }
    }

    async 일정을_수정한다(
        schedule: Schedule,
        reservation: Reservation | undefined,
        updateData: {
            title?: string;
            description?: string;
            startDate?: Date;
            endDate?: Date;
            notifyBeforeStart?: boolean;
            notifyMinutesBeforeStart?: number[];
        },
        updateReason?: string,
        queryRunner?: QueryRunner,
    ): Promise<ScheduleUpdateResult> {
        const shouldManageTransaction = !queryRunner;
        if (shouldManageTransaction) {
            queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
        }

        try {
            const changes: Record<string, { from: any; to: any }> = {};
            const scheduleUpdates: any = {};

            if (updateData.title !== undefined && updateData.title !== schedule.title) {
                changes.title = { from: schedule.title, to: updateData.title };
                scheduleUpdates.title = updateData.title;
            }

            if (updateData.startDate !== undefined && updateData.startDate.getTime() !== schedule.startDate.getTime()) {
                changes.startDate = { from: schedule.startDate, to: updateData.startDate };
                scheduleUpdates.startDate = updateData.startDate;
            }

            if (updateData.endDate !== undefined && updateData.endDate.getTime() !== schedule.endDate.getTime()) {
                changes.endDate = { from: schedule.endDate, to: updateData.endDate };
                scheduleUpdates.endDate = updateData.endDate;
            }

            if (updateData.description !== undefined) {
                scheduleUpdates.description = updateData.description;
            }

            if (Object.keys(changes).length > 0) {
                const changeLog = `[${DateUtil.format(DateUtil.now().toDate(), 'YYYY-MM-DD HH:mm')}] 일정이 수정되었습니다.${updateReason ? ` 사유: ${updateReason}` : ''}`;
                const currentDescription =
                    scheduleUpdates.description !== undefined ? scheduleUpdates.description : schedule.description;
                scheduleUpdates.description = currentDescription ? `${currentDescription}\n\n${changeLog}` : changeLog;
            }

            if (Object.keys(scheduleUpdates).length > 0) {
                await this.domainScheduleService.update(schedule.scheduleId, scheduleUpdates, { queryRunner });
            }

            if (shouldManageTransaction) {
                await queryRunner.commitTransaction();
            }

            const updatedSchedule = await this.domainScheduleService.findOne({
                where: { scheduleId: schedule.scheduleId },
            });

            return {
                schedule: updatedSchedule!,
                reservation,
                changes: Object.keys(changes).map((key) => `${key}: ${changes[key].from} → ${changes[key].to}`),
            };
        } catch (error) {
            if (shouldManageTransaction) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        } finally {
            if (shouldManageTransaction) {
                await queryRunner.release();
            }
        }
    }

    /**
     * 일정을 시나리오별로 수정한다
     */
    async 일정을_시나리오별로_수정한다(
        schedule: Schedule,
        reservation: Reservation,
        changes: ScheduleUpdateChanges,
        queryRunner?: QueryRunner,
    ): Promise<ScheduleUpdateResult> {
        const shouldManageTransaction = !queryRunner;
        queryRunner = queryRunner || this.dataSource.createQueryRunner();

        if (shouldManageTransaction) {
            await queryRunner.connect();
            await queryRunner.startTransaction();
        }

        try {
            const updateResult: ScheduleUpdateResult = {
                schedule,
                reservation,
                changes: [],
            };

            // 시나리오 1: 날짜 수정
            if (changes.dateChanges) {
                await this.일정_날짜를_수정한다(schedule, reservation, changes.dateChanges, queryRunner);
                updateResult.changes.push('날짜 수정');
            }

            // 시나리오 2: 정보 수정
            if (changes.infoChanges) {
                const infoUpdateResult = await this.일정_정보를_수정한다(schedule, changes.infoChanges, queryRunner);
                updateResult.changes.push('정보 수정');

                // 참여자 변경사항이 있으면 알림 정보를 포함
                if (infoUpdateResult.participantChanges) {
                    updateResult.participantChanges = infoUpdateResult.participantChanges;
                    updateResult.changes.push('참여자 수정');
                }
            }

            // 시나리오 3: 자원 수정
            if (changes.resourceChanges) {
                await this.일정_자원을_수정한다(schedule, reservation, changes.resourceChanges, queryRunner);
                updateResult.changes.push('자원 수정');
            }

            if (shouldManageTransaction) {
                await queryRunner.commitTransaction();
            }

            return updateResult;
        } catch (error) {
            if (shouldManageTransaction) {
                await queryRunner.rollbackTransaction();
            }
            throw error;
        } finally {
            if (shouldManageTransaction) {
                await queryRunner.release();
            }
        }
    }

    /**
     * 일정 날짜를 수정한다 (schedule + reservation 둘 다 수정)
     */
    private async 일정_날짜를_수정한다(
        schedule: Schedule,
        reservation: Reservation,
        dateChanges: DateChanges,
        queryRunner: QueryRunner,
    ): Promise<void> {
        const newStartDate = dateChanges.startDate || schedule.startDate;
        const newEndDate = dateChanges.endDate || schedule.endDate;

        // 1. 일정(Schedule) 수정
        await this.domainScheduleService.update(
            schedule.scheduleId,
            {
                startDate: newStartDate,
                endDate: newEndDate,
            },
            { queryRunner },
        );

        // 2. 예약(Reservation) 수정 (있는 경우)
        if (reservation) {
            await this.domainReservationService.update(
                reservation.reservationId,
                {
                    startDate: newStartDate,
                    endDate: newEndDate,
                },
                { queryRunner },
            );
        }

        // 엔티티 상태 업데이트
        schedule.startDate = newStartDate;
        schedule.endDate = newEndDate;
        if (reservation) {
            reservation.startDate = newStartDate;
            reservation.endDate = newEndDate;
        }
    }

    /**
     * 일정 정보를 수정한다 (schedule만 수정)
     */
    private async 일정_정보를_수정한다(
        schedule: Schedule,
        infoChanges: InfoChanges,
        queryRunner: QueryRunner,
    ): Promise<ScheduleInfoUpdateResult> {
        const updateData: any = {};
        let participantChanges: ScheduleInfoUpdateResult['participantChanges'];

        // 선택적으로 업데이트할 필드들
        if (infoChanges.title !== undefined) updateData.title = infoChanges.title;
        if (infoChanges.description !== undefined) updateData.description = infoChanges.description;
        if (infoChanges.notifyBeforeStart !== undefined) updateData.notifyBeforeStart = infoChanges.notifyBeforeStart;
        if (infoChanges.notifyMinutesBeforeStart !== undefined)
            updateData.notifyMinutesBeforeStart = infoChanges.notifyMinutesBeforeStart;
        if (infoChanges.location !== undefined) updateData.location = infoChanges.location;
        if (infoChanges.scheduleType !== undefined) updateData.scheduleType = infoChanges.scheduleType;

        // projectId는 schedule-relations 테이블 업데이트
        if (infoChanges.projectId !== undefined) {
            await this.프로젝트_관계를_업데이트한다(schedule.scheduleId, infoChanges.projectId, queryRunner);
        }

        // departmentIds는 schedule_departments 테이블 일괄 업데이트
        if (infoChanges.departmentIds !== undefined) {
            await this.부서_관계들을_일괄_업데이트한다(schedule.scheduleId, infoChanges.departmentIds, queryRunner);
        }

        // 일정 정보 업데이트 (projectId 제외)
        if (Object.keys(updateData).length > 0) {
            await this.domainScheduleService.update(schedule.scheduleId, updateData, { queryRunner });
            // await this.domainReservationService.update(reservation.reservationId, updateData, { queryRunner });

            // 엔티티 상태 업데이트
            Object.assign(schedule, updateData);
        }

        // 참여자 업데이트 (별도 처리)
        if (infoChanges.participants && Array.isArray(infoChanges.participants)) {
            participantChanges = await this.참여자를_업데이트한다(
                schedule.scheduleId,
                infoChanges.participants,
                queryRunner,
            );
        }

        return {
            schedule,
            participantChanges,
        };
    }

    /**
     * 프로젝트 관계를 업데이트한다
     */
    private async 프로젝트_관계를_업데이트한다(
        scheduleId: string,
        newProjectId: string,
        queryRunner: QueryRunner,
    ): Promise<void> {
        // 기존 관계 조회
        const existingRelation = await this.domainScheduleRelationService.findByScheduleId(scheduleId);

        await this.domainScheduleRelationService.update(
            existingRelation.scheduleRelationId,
            { projectId: newProjectId },
            { queryRunner },
        );
    }

    /**
     * 부서 관계들을 일괄 업데이트한다 (새로운 schedule_departments 테이블 사용)
     */
    private async 부서_관계들을_일괄_업데이트한다(
        scheduleId: string,
        newDepartmentIds: string[],
        queryRunner: QueryRunner,
    ): Promise<void> {
        // 1. 기존 부서 관계 모두 삭제
        const existingRelations = await this.domainScheduleDepartmentService.findAll({
            where: { scheduleId },
            queryRunner,
        });

        for (const relation of existingRelations) {
            await this.domainScheduleDepartmentService.delete(relation.scheduleDepartmentId, {
                queryRunner,
            });
        }

        // 2. 새로운 부서 관계들 생성
        if (newDepartmentIds && newDepartmentIds.length > 0) {
            const repo = queryRunner
                ? queryRunner.manager.getRepository(ScheduleDepartment)
                : this.dataSource.getRepository(ScheduleDepartment);
            for (const departmentId of newDepartmentIds) {
                const entity = repo.create({ scheduleId, departmentId });
                await repo.save(entity);
            }
        }
    }

    /**
     * 참여자를 업데이트한다 (기존 삭제 후 새로 생성)
     */
    private async 참여자를_업데이트한다(
        scheduleId: string,
        newParticipants: string[],
        queryRunner: QueryRunner,
    ): Promise<{ previousParticipants: ScheduleParticipant[]; newParticipants: ScheduleParticipant[] }> {
        // 1. 기존 참여자 조회 (알림용)
        const previousParticipants = await this.domainScheduleParticipantService.findByScheduleId(scheduleId);

        // 2. 기존 참여자 삭제
        if (previousParticipants.length > 0) {
            for (const participant of previousParticipants) {
                if (participant.type === ParticipantsType.PARTICIPANT) {
                    await this.domainScheduleParticipantService.delete(participant.participantId, { queryRunner });
                }
            }
        }

        // 3. 새 참여자 생성
        const createdParticipants: ScheduleParticipant[] = [];
        for (const participant of newParticipants) {
            const newParticipant = await this.domainScheduleParticipantService.save(
                {
                    scheduleId,
                    employeeId: participant,
                    type: ParticipantsType.PARTICIPANT,
                },
                { queryRunner },
            );
            createdParticipants.push(newParticipant);
        }

        return {
            previousParticipants,
            newParticipants: createdParticipants,
        };
    }

    /**
     * 일정 자원을 수정한다 (기존 reservation 취소 후 새 reservation 생성)
     */
    private async 일정_자원을_수정한다(
        schedule: Schedule,
        reservation: Reservation,
        resourceChanges: ResourceChanges,
        queryRunner: QueryRunner,
    ): Promise<void> {
        if (!reservation) {
            throw new Error('자원 수정을 위해서는 기존 예약이 있어야 합니다.');
        }

        // 기존 예약의 resourceId만 업데이트
        await this.domainReservationService.update(
            reservation.reservationId,
            {
                resourceId: resourceChanges.newResourceId,
            },
            { queryRunner },
        );

        // 엔티티 상태 업데이트
        reservation.resourceId = resourceChanges.newResourceId;
    }
}

// 타입 정의들
export interface ScheduleUpdateChanges {
    dateChanges?: DateChanges;
    infoChanges?: InfoChanges;
    resourceChanges?: ResourceChanges;
}

export interface DateChanges {
    startDate?: Date;
    endDate?: Date;
}

export interface InfoChanges {
    title?: string;
    description?: string;
    notifyBeforeStart?: boolean;
    notifyMinutesBeforeStart?: number[];
    location?: string;
    scheduleType?: any;
    scheduleDepartment?: string;
    projectId?: string;
    departmentIds?: string[];
    participants?: string[];
}

export interface ResourceChanges {
    newResourceId: string;
}
