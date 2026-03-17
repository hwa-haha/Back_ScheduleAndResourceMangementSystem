import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LIVE_DATA_SOURCE } from './live-database.config';
import {
    ResourceGroup as LiveResourceGroup,
    Resource as LiveResource,
    Reservation as LiveReservation,
    Employee as LiveEmployee,
    Department as LiveDepartment,
    DepartmentEmployee as LiveDepartmentEmployee,
    ResourceManager as LiveResourceManager,
    VehicleInfo as LiveVehicleInfo,
    MeetingRoomInfo as LiveMeetingRoomInfo,
    AccommodationInfo as LiveAccommodationInfo,
    EquipmentInfo as LiveEquipmentInfo,
    NotificationTypeEntity as LiveNotificationTypeEntity,
    File as LiveFile,
    ReservationVehicle as LiveReservationVehicle,
    ReservationSnapshot as LiveReservationSnapshot,
    ReservationParticipant as LiveReservationParticipant,
    Consumable as LiveConsumable,
    Maintenance as LiveMaintenance,
    Notification as LiveNotification,
    EmployeeNotification as LiveEmployeeNotification,
    FileMaintenance as LiveFileMaintenance,
    FileReservationVehicle as LiveFileReservationVehicle,
    FileResource as LiveFileResource,
    FileVehicleInfo as LiveFileVehicleInfo,
    Schedule as LiveSchedule,
    ScheduleRelation as LiveScheduleRelation,
    ScheduleParticipant as LiveScheduleParticipant,
    ScheduleDepartment as LiveScheduleDepartment,
    RequestLog as LiveRequestLog,
} from './entities';
import { DomainResourceGroupService } from '../../domain/resource-group/resource-group.service';
import { DomainResourceService } from '../../domain/resource/resource.service';
import { DomainReservationService } from '../../domain/reservation/reservation.service';
import { DomainEmployeeService } from '../../domain/employee/employee.service';
import { DomainDepartmentService } from '../../domain/department/department.service';
import { DomainDepartmentEmployeeService } from '../../domain/department-employee/department-employee.service';
import { DomainResourceManagerService } from '../../domain/resource-manager/resource-manager.service';
import { DomainVehicleInfoService } from '../../domain/vehicle-info/vehicle-info.service';
import { DomainMeetingRoomInfoService } from '../../domain/meeting-room-info/meeting-room-info.service';
import { DomainAccommodationInfoService } from '../../domain/accommodation-info/accommodation-info.service';
import { DomainEquipmentInfoService } from '../../domain/equipment-info/equipment-info.service';
import { DomainNotificationTypeService } from '../../domain/notification-type/notification-type.service';
import { DomainFileService } from '../../domain/file/file.service';
import { DomainReservationVehicleService } from '../../domain/reservation-vehicle/reservation-vehicle.service';
import { DomainReservationSnapshotService } from '../../domain/reservation-snapshot/reservation-snapshot.service';
import { DomainReservationParticipantService } from '../../domain/reservation-participant/reservation-participant.service';
import { DomainConsumableService } from '../../domain/consumable/consumable.service';
import { DomainMaintenanceService } from '../../domain/maintenance/maintenance.service';
import { DomainNotificationService } from '../../domain/notification/notification.service';
import { DomainEmployeeNotificationService } from '../../domain/employee-notification/employee-notification.service';
import { DomainFileMaintenanceService } from '../../domain/file-maintenance/file-maintenance.service';
import { DomainFileReservationVehicleService } from '../../domain/file-reservation-vehicle/file-reservation-vehicle.service';
import { DomainFileResourceService } from '../../domain/file-resource/file-resource.service';
import { DomainFileVehicleInfoService } from '../../domain/file-vehicle-info/file-vehicle-info.service';
import { DomainScheduleService } from '../../domain/schedule/schedule.service';
import { DomainScheduleRelationService } from '../../domain/schedule-relation/schedule-relation.service';
import { DomainScheduleParticipantService } from '../../domain/schedule-participant/schedule-participant.service';
import { DomainScheduleDepartmentService } from '../../domain/schedule-department/schedule-department.service';
import { DomainRequestLogService } from '../../domain/request-log/request-log.service';

export interface MigrationStatistics {
    departments: number;
    employees: number;
    resourceGroups: number;
    resources: number;
    resourceManagers: number;
    vehicleInfos: number;
    meetingRoomInfos: number;
    accommodationInfos: number;
    equipmentInfos: number;
    notificationTypes: number;
    files: number;
    reservations: number;
    reservationVehicles: number;
    reservationSnapshots: number;
    reservationParticipants: number;
    consumables: number;
    maintenances: number;
    notifications: number;
    employeeNotifications: number;
    fileMaintenances: number;
    fileReservationVehicles: number;
    fileResources: number;
    fileVehicleInfos: number;
    schedules: number;
    scheduleRelations: number;
    scheduleParticipants: number;
    scheduleDepartments: number;
    departmentEmployees: number;
    requestLogs: number;
}

/** 마이그레이션 시 조회 옵션: soft-deleted 포함 (있으면 업데이트, 없으면 삽입) */
const MIGRATION_FIND_OPTIONS = { withDeleted: true };

/** 청크 단위 병렬 처리 크기 (한 번에 이 개수만큼 Promise.all로 upsert) */
const UPSERT_BATCH_SIZE = 150;

/**
 * 라이브 DB → 로컬 도메인 마이그레이션 서비스
 *
 * 라이브 DB에서 데이터를 읽어 도메인(로컬 DB)에 이전합니다.
 * - 이미 존재하는 데이터는 업데이트, 없으면 삽입(upsert)
 * - 조회 시 soft-deleted 데이터 포함
 * FK 의존성 순서로 마이그레이션합니다.
 * View(EmployeeReservationStats 등)는 읽기 전용이므로 제외합니다.
 */
@Injectable()
export class LiveMigrationService implements OnModuleDestroy {
    private readonly logger = new Logger(LiveMigrationService.name);

    constructor(
        @Inject(LIVE_DATA_SOURCE)
        private readonly liveDataSource: DataSource,
        private readonly domainDepartmentService: DomainDepartmentService,
        private readonly domainEmployeeService: DomainEmployeeService,
        private readonly domainResourceGroupService: DomainResourceGroupService,
        private readonly domainResourceService: DomainResourceService,
        private readonly domainResourceManagerService: DomainResourceManagerService,
        private readonly domainVehicleInfoService: DomainVehicleInfoService,
        private readonly domainMeetingRoomInfoService: DomainMeetingRoomInfoService,
        private readonly domainAccommodationInfoService: DomainAccommodationInfoService,
        private readonly domainEquipmentInfoService: DomainEquipmentInfoService,
        private readonly domainNotificationTypeService: DomainNotificationTypeService,
        private readonly domainFileService: DomainFileService,
        private readonly domainReservationService: DomainReservationService,
        private readonly domainReservationVehicleService: DomainReservationVehicleService,
        private readonly domainReservationSnapshotService: DomainReservationSnapshotService,
        private readonly domainReservationParticipantService: DomainReservationParticipantService,
        private readonly domainConsumableService: DomainConsumableService,
        private readonly domainMaintenanceService: DomainMaintenanceService,
        private readonly domainNotificationService: DomainNotificationService,
        private readonly domainEmployeeNotificationService: DomainEmployeeNotificationService,
        private readonly domainFileMaintenanceService: DomainFileMaintenanceService,
        private readonly domainFileReservationVehicleService: DomainFileReservationVehicleService,
        private readonly domainFileResourceService: DomainFileResourceService,
        private readonly domainFileVehicleInfoService: DomainFileVehicleInfoService,
        private readonly domainScheduleService: DomainScheduleService,
        private readonly domainScheduleRelationService: DomainScheduleRelationService,
        private readonly domainScheduleParticipantService: DomainScheduleParticipantService,
        private readonly domainScheduleDepartmentService: DomainScheduleDepartmentService,
        private readonly domainDepartmentEmployeeService: DomainDepartmentEmployeeService,
        private readonly domainRequestLogService: DomainRequestLogService,
    ) {}

    async onModuleInit(): Promise<void> {
        try {
            await this.마이그레이션한다();
        } catch (error) {
            this.logger.error('라이브 DB 연결 실패', error);
            throw error;
        }
    }

    async onModuleDestroy(): Promise<void> {
        if (this.liveDataSource?.isInitialized) {
            await this.liveDataSource.destroy();
            this.logger.log('라이브 DB 연결 종료');
        }
    }

    async 마이그레이션한다(): Promise<{ success: boolean; statistics: MigrationStatistics }> {
        this.logger.log('라이브 DB → 도메인 마이그레이션 시작');

        const statistics: MigrationStatistics = {
            departments: 0,
            employees: 0,
            resourceGroups: 0,
            resources: 0,
            resourceManagers: 0,
            vehicleInfos: 0,
            meetingRoomInfos: 0,
            accommodationInfos: 0,
            equipmentInfos: 0,
            notificationTypes: 0,
            files: 0,
            reservations: 0,
            reservationVehicles: 0,
            reservationSnapshots: 0,
            reservationParticipants: 0,
            consumables: 0,
            maintenances: 0,
            notifications: 0,
            employeeNotifications: 0,
            fileMaintenances: 0,
            fileReservationVehicles: 0,
            fileResources: 0,
            fileVehicleInfos: 0,
            schedules: 0,
            scheduleRelations: 0,
            scheduleParticipants: 0,
            scheduleDepartments: 0,
            departmentEmployees: 0,
            requestLogs: 0,
        };

        try {
            statistics.departments = await this.마이그레이션Department한다();
            this.logger.log(`Department: ${statistics.departments}개`);

            statistics.employees = await this.마이그레이션Employee한다();
            this.logger.log(`Employee: ${statistics.employees}개`);

            statistics.resourceGroups = await this.마이그레이션ResourceGroup한다();
            this.logger.log(`ResourceGroup: ${statistics.resourceGroups}개`);

            statistics.resources = await this.마이그레이션Resource한다();
            this.logger.log(`Resource: ${statistics.resources}개`);

            statistics.resourceManagers = await this.마이그레이션ResourceManager한다();
            this.logger.log(`ResourceManager: ${statistics.resourceManagers}개`);

            statistics.vehicleInfos = await this.마이그레이션VehicleInfo한다();
            this.logger.log(`VehicleInfo: ${statistics.vehicleInfos}개`);

            statistics.meetingRoomInfos = await this.마이그레이션MeetingRoomInfo한다();
            this.logger.log(`MeetingRoomInfo: ${statistics.meetingRoomInfos}개`);

            statistics.accommodationInfos = await this.마이그레이션AccommodationInfo한다();
            this.logger.log(`AccommodationInfo: ${statistics.accommodationInfos}개`);

            statistics.equipmentInfos = await this.마이그레이션EquipmentInfo한다();
            this.logger.log(`EquipmentInfo: ${statistics.equipmentInfos}개`);

            statistics.notificationTypes = await this.마이그레이션NotificationType한다();
            this.logger.log(`NotificationType: ${statistics.notificationTypes}개`);

            statistics.files = await this.마이그레이션File한다();
            this.logger.log(`File: ${statistics.files}개`);

            statistics.reservations = await this.마이그레이션Reservation한다();
            this.logger.log(`Reservation: ${statistics.reservations}개`);

            statistics.reservationVehicles = await this.마이그레이션ReservationVehicle한다();
            this.logger.log(`ReservationVehicle: ${statistics.reservationVehicles}개`);

            statistics.reservationSnapshots = await this.마이그레이션ReservationSnapshot한다();
            this.logger.log(`ReservationSnapshot: ${statistics.reservationSnapshots}개`);

            statistics.reservationParticipants = await this.마이그레이션ReservationParticipant한다();
            this.logger.log(`ReservationParticipant: ${statistics.reservationParticipants}개`);

            statistics.consumables = await this.마이그레이션Consumable한다();
            this.logger.log(`Consumable: ${statistics.consumables}개`);

            statistics.maintenances = await this.마이그레이션Maintenance한다();
            this.logger.log(`Maintenance: ${statistics.maintenances}개`);

            statistics.notifications = await this.마이그레이션Notification한다();
            this.logger.log(`Notification: ${statistics.notifications}개`);

            statistics.employeeNotifications = await this.마이그레이션EmployeeNotification한다();
            this.logger.log(`EmployeeNotification: ${statistics.employeeNotifications}개`);

            statistics.fileMaintenances = await this.마이그레이션FileMaintenance한다();
            this.logger.log(`FileMaintenance: ${statistics.fileMaintenances}개`);

            statistics.fileReservationVehicles = await this.마이그레이션FileReservationVehicle한다();
            this.logger.log(`FileReservationVehicle: ${statistics.fileReservationVehicles}개`);

            statistics.fileResources = await this.마이그레이션FileResource한다();
            this.logger.log(`FileResource: ${statistics.fileResources}개`);

            statistics.fileVehicleInfos = await this.마이그레이션FileVehicleInfo한다();
            this.logger.log(`FileVehicleInfo: ${statistics.fileVehicleInfos}개`);

            statistics.schedules = await this.마이그레이션Schedule한다();
            this.logger.log(`Schedule: ${statistics.schedules}개`);

            statistics.scheduleRelations = await this.마이그레이션ScheduleRelation한다();
            this.logger.log(`ScheduleRelation: ${statistics.scheduleRelations}개`);

            statistics.scheduleParticipants = await this.마이그레이션ScheduleParticipant한다();
            this.logger.log(`ScheduleParticipant: ${statistics.scheduleParticipants}개`);

            statistics.scheduleDepartments = await this.마이그레이션ScheduleDepartment한다();
            this.logger.log(`ScheduleDepartment: ${statistics.scheduleDepartments}개`);

            statistics.departmentEmployees = await this.마이그레이션DepartmentEmployee한다();
            this.logger.log(`DepartmentEmployee: ${statistics.departmentEmployees}개`);

            statistics.requestLogs = await this.마이그레이션RequestLog한다();
            this.logger.log(`RequestLog: ${statistics.requestLogs}개`);

            this.logger.log('✅ 라이브 DB → 도메인 마이그레이션 완료');
            return { success: true, statistics };
        } catch (error) {
            this.logger.error('마이그레이션 실패', error);
            throw error;
        }
    }

    /**
     * 부서는 parentDepartmentId FK 때문에 부모 → 자식 순으로 삽입해야 한다.
     * 계층 순서(루트 먼저, 그 다음 자식)로 정렬한 뒤 저장한다.
     */
    private async 마이그레이션Department한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveDepartment);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const ordered = this.부서계층순정렬(all);
        await this.upsertBulk(
            this.domainDepartmentService,
            'id',
            ordered,
            (row) => ({
                id: row.id,
                departmentName: row.departmentName,
                departmentCode: row.departmentCode,
                type: row.type,
                parentDepartmentId: row.parentDepartmentId ?? undefined,
                order: row.order ?? 0,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            }),
            { sequential: true },
        );
        return ordered.length;
    }

    /** parentDepartmentId 기준 부모가 먼저 오도록 정렬 (루트 → 자식) */
    private 부서계층순정렬(departments: LiveDepartment[]): LiveDepartment[] {
        const result: LiveDepartment[] = [];
        const added = new Set<string>();
        let prevSize = -1;
        while (result.length !== prevSize) {
            prevSize = result.length;
            for (const d of departments) {
                if (added.has(d.id)) continue;
                const parentId = d.parentDepartmentId ?? null;
                if (parentId === null || added.has(parentId)) {
                    result.push(d);
                    added.add(d.id);
                }
            }
        }
        if (result.length !== departments.length) {
            this.logger.warn(
                `부서 계층 정렬: 일부만 정렬됨 (순환 참조 가능성). 전체 ${departments.length}개 중 ${result.length}개`,
            );
            const missing = departments.filter((d) => !added.has(d.id));
            for (const d of missing) result.push(d);
        }
        return result;
    }

    private async 마이그레이션Employee한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveEmployee);
        const rows = await repo.find(MIGRATION_FIND_OPTIONS);
        await this.upsertBulk(this.domainEmployeeService, 'employeeId', rows, (row) => ({
            employeeId: row.employeeId,
            name: row.name,
            employeeNumber: row.employeeNumber,
            department: row.department,
            position: row.position,
            rank: row.rank ?? undefined,
            positionTitle: row.positionTitle ?? undefined,
            email: row.email ?? undefined,
            mobile: row.mobile ?? undefined,
            password: row.password ?? undefined,
            accessToken: row.accessToken ?? undefined,
            expiredAt: row.expiredAt ?? undefined,
            subscriptions: row.subscriptions ?? undefined,
            isPushNotificationEnabled: row.isPushNotificationEnabled ?? true,
            roles: row.roles ?? [],
            status: row.status ?? undefined,
            isHiddenInFilter: row.isHiddenInFilter ?? false,
        }));
        return rows.length;
    }

    /**
     * ResourceGroup은 parentResourceGroupId FK 때문에 부모 → 자식 순으로 삽입한다.
     */
    private async 마이그레이션ResourceGroup한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveResourceGroup);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const ordered = this.리소스그룹계층순정렬(all);
        await this.upsertBulk(
            this.domainResourceGroupService,
            'resourceGroupId',
            ordered,
            (row) => ({
                resourceGroupId: row.resourceGroupId,
                title: row.title,
                description: row.description ?? undefined,
                parentResourceGroupId: row.parentResourceGroupId ?? undefined,
                type: row.type,
                order: row.order ?? 0,
            }),
            { sequential: true },
        );
        return ordered.length;
    }

    private 리소스그룹계층순정렬(groups: LiveResourceGroup[]): LiveResourceGroup[] {
        const result: LiveResourceGroup[] = [];
        const added = new Set<string>();
        let prevSize = -1;
        while (result.length !== prevSize) {
            prevSize = result.length;
            for (const g of groups) {
                if (added.has(g.resourceGroupId)) continue;
                const parentId = g.parentResourceGroupId ?? null;
                if (parentId === null || added.has(parentId)) {
                    result.push(g);
                    added.add(g.resourceGroupId);
                }
            }
        }
        const missing = groups.filter((g) => !added.has(g.resourceGroupId));
        for (const g of missing) result.push(g);
        return result;
    }

    private async 마이그레이션Resource한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveResource);
        const rows = await repo.find({ ...MIGRATION_FIND_OPTIONS, order: { order: 'ASC' } });
        await this.upsertBulk(this.domainResourceService, 'resourceId', rows, (row) => ({
            resourceId: row.resourceId,
            resourceGroupId: row.resourceGroupId ?? undefined,
            name: row.name,
            description: row.description ?? undefined,
            location: row.location ?? undefined,
            locationURLs: row.locationURLs ?? undefined,
            isAvailable: row.isAvailable ?? true,
            unavailableReason: row.unavailableReason ?? undefined,
            images: row.images ?? [],
            notifyParticipantChange: row.notifyParticipantChange ?? true,
            notifyReservationChange: row.notifyReservationChange ?? true,
            type: row.type,
            order: row.order ?? 0,
            deletedAt: row.deletedAt ?? null,
        }));
        return rows.length;
    }

    private async 마이그레이션ResourceManager한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveResourceManager);
        const rows = await repo.find(MIGRATION_FIND_OPTIONS);
        await this.upsertBulk(this.domainResourceManagerService, 'resourceManagerId', rows, (row) => ({
            resourceManagerId: row.resourceManagerId,
            employeeId: row.employeeId,
            resourceId: row.resourceId,
        }));
        return rows.length;
    }

    /** 로컬(도메인) resources 테이블에 존재하는 resourceId 집합. soft-deleted 포함. FK 고아 레코드 마이그레이션 스킵용 */
    private async 로컬ResourceIdSet(): Promise<Set<string>> {
        const list = await this.domainResourceService.findAll(MIGRATION_FIND_OPTIONS);
        return new Set(list.map((r) => (r as { resourceId: string }).resourceId));
    }

    /** 로컬(도메인) files 테이블에 존재하는 fileId 집합. FK 고아 레코드 마이그레이션 스킵용 */
    private async 로컬FileIdSet(): Promise<Set<string>> {
        const list = await this.domainFileService.findAll(MIGRATION_FIND_OPTIONS);
        return new Set(list.map((r) => (r as { fileId: string }).fileId));
    }

    /** 로컬 reservation_vehicles 존재 reservationVehicleId 집합 */
    private async 로컬ReservationVehicleIdSet(): Promise<Set<string>> {
        const list = await this.domainReservationVehicleService.findAll(MIGRATION_FIND_OPTIONS);
        return new Set(list.map((r) => (r as { reservationVehicleId: string }).reservationVehicleId));
    }

    /** 로컬 vehicle_infos 존재 vehicleInfoId 집합 */
    private async 로컬VehicleInfoIdSet(): Promise<Set<string>> {
        const list = await this.domainVehicleInfoService.findAll(MIGRATION_FIND_OPTIONS);
        return new Set(list.map((r) => (r as { vehicleInfoId: string }).vehicleInfoId));
    }

    /** 로컬 maintenances 존재 maintenanceId 집합 */
    private async 로컬MaintenanceIdSet(): Promise<Set<string>> {
        const list = await this.domainMaintenanceService.findAll(MIGRATION_FIND_OPTIONS);
        return new Set(list.map((r) => (r as { maintenanceId: string }).maintenanceId));
    }

    /** 로컬 schedules 존재 scheduleId 집합 */
    private async 로컬ScheduleIdSet(): Promise<Set<string>> {
        const list = await this.domainScheduleService.findAll(MIGRATION_FIND_OPTIONS);
        return new Set(list.map((r) => (r as { scheduleId: string }).scheduleId));
    }

    /** 로컬 reservations 존재 reservationId 집합 */
    private async 로컬ReservationIdSet(): Promise<Set<string>> {
        const list = await this.domainReservationService.findAll(MIGRATION_FIND_OPTIONS);
        return new Set(list.map((r) => (r as { reservationId: string }).reservationId));
    }

    /** 로컬 departments 존재 id 집합 */
    private async 로컬DepartmentIdSet(): Promise<Set<string>> {
        const list = await this.domainDepartmentService.findAll(MIGRATION_FIND_OPTIONS);
        return new Set(list.map((r) => (r as { id: string }).id));
    }

    /** 이미 존재하면 업데이트, 없으면 삽입. 조회 시 soft-deleted 포함 */
    private async upsertOne(
        service: {
            findOne: (opts: any) => Promise<any>;
            update: (id: string, entity: any) => Promise<any>;
            save: (entity: any) => Promise<any>;
        },
        pkKey: string,
        row: Record<string, any>,
        payload: Record<string, any>,
    ): Promise<void> {
        const id = row[pkKey];
        if (id === undefined || id === null) {
            await service.save(payload);
            return;
        }
        const existing = await service.findOne({ where: { [pkKey]: id }, ...MIGRATION_FIND_OPTIONS });
        if (existing) {
            await service.update(String(id), payload);
        } else {
            await service.save(payload);
        }
    }

    /** 청크 단위로 upsert. sequential이 true면 부모→자식 FK 등 순서 보장을 위해 청크 내에서 순차 실행 */
    private async upsertBulk(
        service: {
            findOne: (opts: any) => Promise<any>;
            update: (id: string, entity: any) => Promise<any>;
            save: (entity: any) => Promise<any>;
        },
        pkKey: string,
        rows: Record<string, any>[],
        toPayload: (row: Record<string, any>) => Record<string, any>,
        options?: { sequential?: boolean },
    ): Promise<void> {
        const sequential = options?.sequential ?? false;
        for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
            const chunk = rows.slice(i, i + UPSERT_BATCH_SIZE);
            if (sequential) {
                for (const row of chunk) {
                    await this.upsertOne(service, pkKey, row, toPayload(row));
                }
            } else {
                await Promise.all(chunk.map((row) => this.upsertOne(service, pkKey, row, toPayload(row))));
            }
        }
    }

    private async 마이그레이션VehicleInfo한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveVehicleInfo);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const allowedResourceIds = await this.로컬ResourceIdSet();
        const rows = all.filter((row) => allowedResourceIds.has(row.resourceId));
        if (rows.length < all.length) {
            this.logger.warn(`VehicleInfo: resourceId 미존재로 ${all.length - rows.length}건 스킵`);
        }
        await this.upsertBulk(this.domainVehicleInfoService, 'vehicleInfoId', rows, (row) => ({
            vehicleInfoId: row.vehicleInfoId,
            resourceId: row.resourceId,
            vehicleNumber: row.vehicleNumber ?? undefined,
            leftMileage: row.leftMileage ?? 0,
            totalMileage: row.totalMileage ?? 0,
            insuranceName: row.insuranceName ?? undefined,
            insuranceNumber: row.insuranceNumber ?? undefined,
            parkingLocationImages: row.parkingLocationImages ?? undefined,
            parkingCoordinates: row.parkingCoordinates ?? undefined,
            odometerImages: row.odometerImages ?? undefined,
            indoorImages: row.indoorImages ?? undefined,
        }));
        return rows.length;
    }

    private async 마이그레이션MeetingRoomInfo한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveMeetingRoomInfo);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const allowedResourceIds = await this.로컬ResourceIdSet();
        const rows = all.filter((row) => allowedResourceIds.has(row.resourceId));
        if (rows.length < all.length) {
            this.logger.warn(`MeetingRoomInfo: resourceId 미존재로 ${all.length - rows.length}건 스킵`);
        }
        await this.upsertBulk(this.domainMeetingRoomInfoService, 'meetingRoomInfoId', rows, (row) => ({
            meetingRoomInfoId: row.meetingRoomInfoId,
            resourceId: row.resourceId,
        }));
        return rows.length;
    }

    private async 마이그레이션AccommodationInfo한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveAccommodationInfo);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const allowedResourceIds = await this.로컬ResourceIdSet();
        const rows = all.filter((row) => allowedResourceIds.has(row.resourceId));
        if (rows.length < all.length) {
            this.logger.warn(`AccommodationInfo: resourceId 미존재로 ${all.length - rows.length}건 스킵`);
        }
        await this.upsertBulk(this.domainAccommodationInfoService, 'accommodationInfoId', rows, (row) => ({
            accommodationInfoId: row.accommodationInfoId,
            resourceId: row.resourceId,
            locationURLs: row.locationURLs ?? undefined,
        }));
        return rows.length;
    }

    private async 마이그레이션EquipmentInfo한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveEquipmentInfo);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const allowedResourceIds = await this.로컬ResourceIdSet();
        const rows = all.filter((row) => allowedResourceIds.has(row.resourceId));
        if (rows.length < all.length) {
            this.logger.warn(`EquipmentInfo: resourceId 미존재로 ${all.length - rows.length}건 스킵`);
        }
        await this.upsertBulk(this.domainEquipmentInfoService, 'equipmentInfoId', rows, (row) => ({
            equipmentInfoId: row.equipmentInfoId,
            resourceId: row.resourceId,
        }));
        return rows.length;
    }

    private async 마이그레이션NotificationType한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveNotificationTypeEntity);
        const rows = await repo.find(MIGRATION_FIND_OPTIONS);
        for (const row of rows) {
            const payload = {
                notificationType: row.notificationType,
                requirements: row.requirements,
                defaultTitleTemplate: row.defaultTitleTemplate,
                defaultBodyTemplate: row.defaultBodyTemplate,
                description: row.description,
            };
            const existing = await this.domainNotificationTypeService.findByType(row.notificationType);
            if (existing) {
                await this.domainNotificationTypeService.update(row.notificationType, payload);
            } else {
                await this.domainNotificationTypeService.create(payload);
            }
        }
        return rows.length;
    }

    private async 마이그레이션File한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveFile);
        const rows = await repo.find(MIGRATION_FIND_OPTIONS);
        await this.upsertBulk(this.domainFileService, 'fileId', rows, (row) => ({
            fileId: row.fileId,
            fileName: row.fileName,
            filePath: row.filePath,
            isTemporary: row.isTemporary ?? true,
            createdAt: row.createdAt,
        }));
        return rows.length;
    }

    private async 마이그레이션Reservation한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveReservation);
        const rows = await repo.find({ ...MIGRATION_FIND_OPTIONS, order: { startDate: 'ASC' } });
        await this.upsertBulk(this.domainReservationService, 'reservationId', rows, (row) => ({
            reservationId: row.reservationId,
            resourceId: row.resourceId,
            title: row.title,
            description: row.description ?? undefined,
            startDate: row.startDate,
            endDate: row.endDate,
            status: row.status,
            rejectReason: row.rejectReason ?? undefined,
            isAllDay: row.isAllDay ?? false,
            notifyBeforeStart: row.notifyBeforeStart ?? false,
            notifyMinutesBeforeStart: row.notifyMinutesBeforeStart ?? undefined,
        }));
        return rows.length;
    }

    private async 마이그레이션ReservationVehicle한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveReservationVehicle);
        const rows = await repo.find(MIGRATION_FIND_OPTIONS);
        await this.upsertBulk(this.domainReservationVehicleService, 'reservationVehicleId', rows, (row) => ({
            reservationVehicleId: row.reservationVehicleId,
            reservationId: row.reservationId,
            vehicleInfoId: row.vehicleInfoId,
            startOdometer: row.startOdometer ?? undefined,
            endOdometer: row.endOdometer ?? undefined,
            startFuelLevel: row.startFuelLevel ?? undefined,
            endFuelLevel: row.endFuelLevel ?? undefined,
            location: row.location ?? undefined,
            parkingCoordinates: row.parkingCoordinates ?? undefined,
            remarks: row.remarks ?? undefined,
            isReturned: row.isReturned ?? false,
            returnedBy: row.returnedBy ?? undefined,
            returnedAt: row.returnedAt ?? undefined,
        }));
        return rows.length;
    }

    private async 마이그레이션ReservationSnapshot한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveReservationSnapshot);
        const rows = await repo.find(MIGRATION_FIND_OPTIONS);
        await this.upsertBulk(this.domainReservationSnapshotService, 'snapshotId', rows, (row) => ({
            snapshotId: row.snapshotId,
            employeeId: row.employeeId,
            step: row.step ?? undefined,
            resourceType: row.resourceType ?? undefined,
            droppableGroupData: row.droppableGroupData ?? undefined,
            dateRange: row.dateRange ?? undefined,
            startTime: row.startTime ?? undefined,
            endTime: row.endTime ?? undefined,
            timeRange: row.timeRange ?? undefined,
            timeUnit: row.timeUnit ?? undefined,
            selectedResource: row.selectedResource ?? undefined,
            title: row.title ?? undefined,
            reminderTimes: row.reminderTimes ?? undefined,
            isAllDay: row.isAllDay ?? false,
            notifyBeforeStart: row.notifyBeforeStart ?? false,
            notifyMinutesBeforeStart: row.notifyMinutesBeforeStart ?? undefined,
            attendees: row.attendees ?? undefined,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }));
        return rows.length;
    }

    private async 마이그레이션ReservationParticipant한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveReservationParticipant);
        const rows = await repo.find(MIGRATION_FIND_OPTIONS);
        await this.upsertBulk(this.domainReservationParticipantService, 'participantId', rows, (row) => ({
            participantId: row.participantId,
            reservationId: row.reservationId,
            employeeId: row.employeeId,
            type: row.type,
        }));
        return rows.length;
    }

    private async 마이그레이션Consumable한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveConsumable);
        const rows = await repo.find(MIGRATION_FIND_OPTIONS);
        await this.upsertBulk(this.domainConsumableService, 'consumableId', rows, (row) => ({
            consumableId: row.consumableId,
            vehicleInfoId: row.vehicleInfoId,
            name: row.name,
            replaceCycle: row.replaceCycle ?? 0,
            notifyReplacementCycle: row.notifyReplacementCycle ?? true,
            initMileage: row.initMileage ?? 0,
            deletedAt: row.deletedAt ?? null,
        }));
        return rows.length;
    }

    private async 마이그레이션Maintenance한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveMaintenance);
        const rows = await repo.find(MIGRATION_FIND_OPTIONS);
        await this.upsertBulk(this.domainMaintenanceService, 'maintenanceId', rows, (row) => ({
            maintenanceId: row.maintenanceId,
            consumableId: row.consumableId,
            date: row.date,
            mileage: row.mileage ?? 0,
            cost: row.cost ?? 0,
            images: row.images ?? undefined,
            maintananceBy: row.maintananceBy ?? undefined,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }));
        return rows.length;
    }

    private async 마이그레이션Notification한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveNotification);
        const rows = await repo.find(MIGRATION_FIND_OPTIONS);
        await this.upsertBulk(this.domainNotificationService, 'notificationId', rows, (row) => ({
            notificationId: row.notificationId,
            title: row.title,
            body: row.body ?? undefined,
            notificationType: row.notificationType ?? undefined,
            notificationData: row.notificationData ?? undefined,
            isSent: row.isSent ?? true,
            createdAt: row.createdAt,
        }));
        return rows.length;
    }

    private async 마이그레이션EmployeeNotification한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveEmployeeNotification);
        const rows = await repo.find(MIGRATION_FIND_OPTIONS);
        await this.upsertBulk(this.domainEmployeeNotificationService, 'employeeNotificationId', rows, (row) => ({
            employeeNotificationId: row.employeeNotificationId,
            employeeId: row.employeeId,
            notificationId: row.notificationId,
            isRead: row.isRead ?? false,
        }));
        return rows.length;
    }

    private async 마이그레이션FileMaintenance한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveFileMaintenance);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const [allowedMaintenanceIds, allowedFileIds] = await Promise.all([
            this.로컬MaintenanceIdSet(),
            this.로컬FileIdSet(),
        ]);
        const rows = all.filter(
            (row) => allowedMaintenanceIds.has(row.maintenanceId) && allowedFileIds.has(row.fileId),
        );
        if (rows.length < all.length) {
            this.logger.warn(`FileMaintenance: FK 미존재로 ${all.length - rows.length}건 스킵`);
        }
        await this.upsertBulk(this.domainFileMaintenanceService, 'fileMaintenanceId', rows, (row) => ({
            fileMaintenanceId: row.fileMaintenanceId,
            maintenanceId: row.maintenanceId,
            fileId: row.fileId,
        }));
        return rows.length;
    }

    private async 마이그레이션FileReservationVehicle한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveFileReservationVehicle);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const [allowedReservationVehicleIds, allowedFileIds] = await Promise.all([
            this.로컬ReservationVehicleIdSet(),
            this.로컬FileIdSet(),
        ]);
        const rows = all.filter(
            (row) => allowedReservationVehicleIds.has(row.reservationVehicleId) && allowedFileIds.has(row.fileId),
        );
        if (rows.length < all.length) {
            this.logger.warn(`FileReservationVehicle: FK 미존재로 ${all.length - rows.length}건 스킵`);
        }
        await this.upsertBulk(this.domainFileReservationVehicleService, 'fileReservationVehicleId', rows, (row) => ({
            fileReservationVehicleId: row.fileReservationVehicleId,
            reservationVehicleId: row.reservationVehicleId,
            fileId: row.fileId,
            type: row.type,
        }));
        return rows.length;
    }

    private async 마이그레이션FileResource한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveFileResource);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const [allowedResourceIds, allowedFileIds] = await Promise.all([
            this.로컬ResourceIdSet(),
            this.로컬FileIdSet(),
        ]);
        const rows = all.filter((row) => allowedResourceIds.has(row.resourceId) && allowedFileIds.has(row.fileId));
        if (rows.length < all.length) {
            this.logger.warn(`FileResource: resourceId/fileId 미존재로 ${all.length - rows.length}건 스킵`);
        }
        await this.upsertBulk(this.domainFileResourceService, 'fileResourceId', rows, (row) => ({
            fileResourceId: row.fileResourceId,
            resourceId: row.resourceId,
            fileId: row.fileId,
        }));
        return rows.length;
    }

    private async 마이그레이션FileVehicleInfo한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveFileVehicleInfo);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const [allowedVehicleInfoIds, allowedFileIds] = await Promise.all([
            this.로컬VehicleInfoIdSet(),
            this.로컬FileIdSet(),
        ]);
        const rows = all.filter(
            (row) => allowedVehicleInfoIds.has(row.vehicleInfoId) && allowedFileIds.has(row.fileId),
        );
        if (rows.length < all.length) {
            this.logger.warn(`FileVehicleInfo: FK 미존재로 ${all.length - rows.length}건 스킵`);
        }
        await this.upsertBulk(this.domainFileVehicleInfoService, 'fileVehicleInfoId', rows, (row) => ({
            fileVehicleInfoId: row.fileVehicleInfoId,
            vehicleInfoId: row.vehicleInfoId,
            fileId: row.fileId,
            type: row.type,
        }));
        return rows.length;
    }

    private async 마이그레이션Schedule한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveSchedule);
        const rows = await repo.find({ ...MIGRATION_FIND_OPTIONS, order: { startDate: 'ASC' } });
        await this.upsertBulk(this.domainScheduleService, 'scheduleId', rows, (row) => ({
            scheduleId: row.scheduleId,
            title: row.title,
            description: row.description ?? undefined,
            location: row.location ?? undefined,
            startDate: row.startDate,
            endDate: row.endDate,
            notifyBeforeStart: row.notifyBeforeStart ?? false,
            notifyMinutesBeforeStart: row.notifyMinutesBeforeStart ?? undefined,
            scheduleType: row.scheduleType,
            scheduleDepartment: row.scheduleDepartment ?? undefined,
            status: row.status,
            completionReason: row.completionReason ?? undefined,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            deletedAt: row.deletedAt ?? null,
        }));
        return rows.length;
    }

    private async 마이그레이션ScheduleRelation한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveScheduleRelation);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const [allowedScheduleIds, allowedReservationIds] = await Promise.all([
            this.로컬ScheduleIdSet(),
            this.로컬ReservationIdSet(),
        ]);
        const rows = all.filter((row) => {
            if (!allowedScheduleIds.has(row.scheduleId)) return false;
            if (row.reservationId != null && !allowedReservationIds.has(row.reservationId)) return false;
            return true;
        });
        if (rows.length < all.length) {
            this.logger.warn(`ScheduleRelation: scheduleId/reservationId 미존재로 ${all.length - rows.length}건 스킵`);
        }
        await this.upsertBulk(this.domainScheduleRelationService, 'scheduleRelationId', rows, (row) => ({
            scheduleRelationId: row.scheduleRelationId,
            scheduleId: row.scheduleId,
            reservationId: row.reservationId ?? undefined,
            projectId: row.projectId ?? undefined,
        }));
        return rows.length;
    }

    private async 마이그레이션ScheduleParticipant한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveScheduleParticipant);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const allowedScheduleIds = await this.로컬ScheduleIdSet();
        const rows = all.filter((row) => allowedScheduleIds.has(row.scheduleId));
        if (rows.length < all.length) {
            this.logger.warn(`ScheduleParticipant: scheduleId 미존재로 ${all.length - rows.length}건 스킵`);
        }
        await this.upsertBulk(this.domainScheduleParticipantService, 'participantId', rows, (row) => ({
            participantId: row.participantId,
            scheduleId: row.scheduleId,
            employeeId: row.employeeId,
            type: row.type,
        }));
        return rows.length;
    }

    private async 마이그레이션ScheduleDepartment한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveScheduleDepartment);
        const all = await repo.find(MIGRATION_FIND_OPTIONS);
        const [allowedScheduleIds, allowedDepartmentIds] = await Promise.all([
            this.로컬ScheduleIdSet(),
            this.로컬DepartmentIdSet(),
        ]);
        const rows = all.filter(
            (row) => allowedScheduleIds.has(row.scheduleId) && allowedDepartmentIds.has(row.departmentId),
        );
        if (rows.length < all.length) {
            this.logger.warn(`ScheduleDepartment: scheduleId/departmentId 미존재로 ${all.length - rows.length}건 스킵`);
        }
        await this.upsertBulk(this.domainScheduleDepartmentService, 'scheduleDepartmentId', rows, (row) => ({
            scheduleDepartmentId: row.scheduleDepartmentId,
            scheduleId: row.scheduleId,
            departmentId: row.departmentId,
            createdAt: row.createdAt,
        }));
        return rows.length;
    }

    private async 마이그레이션DepartmentEmployee한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveDepartmentEmployee);
        const rows = await repo.find(MIGRATION_FIND_OPTIONS);
        await this.upsertBulk(this.domainDepartmentEmployeeService, 'id', rows, (row) => ({
            id: row.id,
            departmentId: row.departmentId,
            employeeId: row.employeeId,
            isManager: row.isManager ?? false,
            startDate: row.startDate,
            endDate: row.endDate ?? undefined,
            isActive: row.isActive ?? true,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        }));
        return rows.length;
    }

    private async 마이그레이션RequestLog한다(): Promise<number> {
        const repo = this.liveDataSource.getRepository(LiveRequestLog);
        const rows = await repo.find({ ...MIGRATION_FIND_OPTIONS, order: { requestTime: 'ASC' } });
        await this.upsertBulk(this.domainRequestLogService, 'requestLogId', rows, (row) => ({
            requestLogId: row.requestLogId,
            requestTime: row.requestTime,
            method: row.method,
            endpoint: row.endpoint,
            requestBody: row.requestBody ?? undefined,
            requestParams: row.requestParams ?? undefined,
            requestHeaders: row.requestHeaders ?? undefined,
            responseBody: row.responseBody ?? undefined,
            statusCode: row.statusCode,
            errorMessage: row.errorMessage ?? undefined,
            errorStack: row.errorStack ?? undefined,
            environment: row.environment,
            employeeName: row.employeeName ?? undefined,
            employeeId: row.employeeId ?? undefined,
            userAgent: row.userAgent ?? undefined,
            ipAddress: row.ipAddress ?? undefined,
            duration: row.duration ?? undefined,
            traceId: row.traceId ?? undefined,
        }));
        return rows.length;
    }
}
