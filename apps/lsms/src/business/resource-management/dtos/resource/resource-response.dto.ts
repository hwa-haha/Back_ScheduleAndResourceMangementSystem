import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { VehicleInfoResponseDto } from '../vehicle/vehicle-response.dto';
import { AccommodationInfoResponseDto } from '../accommodation/accommodation-info-response.dto';
import { MeetingRoomInfoResponseDto } from '../meeting-room/meeting-room-info-response.dto';
import { ResourceType } from '../../../../../libs/enums/resource-type.enum';
import { ResourceLocation, ResourceLocationURL } from './create-resource.dto';
import { ReservationResponseDto } from '../../../reservation-management/dtos/reservation-response.dto';
import { EmployeeResponseDto } from '../../../employee-management/dtos/employee-response.dto';
import { Resource } from '../../../../domain/resource/resource.entity';
import { FileResponseDto } from '../../../../context/file/dtos/file-response.dto';
import { EquipmentInfoResponseDto } from '../equipment/equipment-info-response.dto';

export class CreateResourceResponseDto {
    @ApiProperty()
    resourceId: string;

    @ApiProperty({ enum: ResourceType })
    type: ResourceType;

    @ApiProperty()
    typeInfoId: string;
}

export class ResourceManagerResponseDto {
    @ApiProperty()
    resourceManagerId: string;

    @ApiProperty()
    resourceId: string;

    @ApiProperty()
    employeeId: string;

    @ApiProperty()
    employee: EmployeeResponseDto;
}

export class ResourceGroupResponseDto {
    @ApiProperty()
    resourceGroupId?: string;

    @ApiProperty()
    title: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty({ enum: ResourceType, required: false })
    type?: ResourceType;

    @ApiProperty()
    order: number;

    @ApiProperty({ required: false })
    parentResourceGroupId?: string;
}

export class ResourceResponseDto {
    constructor(resource?: Resource) {
        this.resourceId = resource?.resourceId;
        this.resourceGroupId = resource?.resourceGroupId;
        this.name = resource?.name;
        this.description = resource?.description;
        this.location = resource?.location;
        this.locationURLs = resource?.locationURLs;
        this.images = resource?.images;
        this.type = resource?.type;
        this.isAvailable = resource?.isAvailable;
        this.unavailableReason = resource?.unavailableReason;
        this.notifyParticipantChange = resource?.notifyParticipantChange;
        this.notifyReservationChange = resource?.notifyReservationChange;
        this.order = resource?.order;
        this.managers = resource?.resourceManagers as any;
        this.resourceGroup = resource?.resourceGroup;
        this.imageFiles = resource?.images ? resource['imageFiles'] : [];

        if (resource?.vehicleInfo) {
            this.typeInfo = resource.vehicleInfo as unknown as VehicleInfoResponseDto;
        } else if (resource?.meetingRoomInfo) {
            this.typeInfo = resource.meetingRoomInfo as unknown as MeetingRoomInfoResponseDto;
        } else if (resource?.accommodationInfo) {
            this.typeInfo = resource.accommodationInfo as unknown as AccommodationInfoResponseDto;
        } else if (resource?.equipmentInfo) {
            this.typeInfo = resource.equipmentInfo as unknown as EquipmentInfoResponseDto;
        }
    }

    @ApiProperty({ required: false })
    resourceId?: string;

    @ApiProperty({ required: false })
    resourceGroupId?: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty({ required: false, type: ResourceLocation })
    location?: ResourceLocation;

    @ApiProperty({ required: false, type: ResourceLocationURL })
    locationURLs?: ResourceLocationURL;

    @ApiProperty({ required: false, type: [String] })
    images?: string[];

    @ApiProperty({ required: false, type: [FileResponseDto] })
    imageFiles?: FileResponseDto[];

    @ApiProperty({ enum: ResourceType })
    type?: ResourceType;

    @ApiProperty()
    isAvailable?: boolean;

    @ApiProperty({ required: false })
    unavailableReason?: string;

    @ApiProperty()
    notifyParticipantChange?: boolean;

    @ApiProperty()
    notifyReservationChange?: boolean;

    @ApiProperty()
    order: number;

    @ApiProperty({
        required: false,
        oneOf: [
            { $ref: getSchemaPath(VehicleInfoResponseDto) },
            { $ref: getSchemaPath(MeetingRoomInfoResponseDto) },
            { $ref: getSchemaPath(AccommodationInfoResponseDto) },
            { $ref: getSchemaPath(EquipmentInfoResponseDto) },
        ],
    })
    typeInfo?:
        | VehicleInfoResponseDto
        | MeetingRoomInfoResponseDto
        | AccommodationInfoResponseDto
        | EquipmentInfoResponseDto;

    @ApiProperty({ required: false, type: [ResourceManagerResponseDto] })
    managers?: ResourceManagerResponseDto[];

    @ApiProperty({ required: false })
    resourceGroup?: ResourceGroupResponseDto;
}

export class ResourceSelectResponseDto {
    @ApiProperty()
    resourceId?: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ required: false, type: [String] })
    images?: string[];

    @ApiProperty()
    isAvailable?: boolean;

    @ApiProperty({ required: false })
    unavailableReason?: string;

    @ApiProperty()
    resourceGroupId?: string;

    @ApiProperty()
    order: number;
}

export class ResourceWithReservationsResponseDto extends ResourceResponseDto {
    constructor(resource?: Resource) {
        super(resource);
        this.reservations = resource?.reservations.map((reservation) => new ReservationResponseDto(reservation));
    }

    @ApiProperty({ required: false, type: [ReservationResponseDto] })
    reservations?: ReservationResponseDto[];
}

export class ChildResourceGroupResponseDto extends ResourceGroupResponseDto {
    @ApiProperty({ type: () => ResourceSelectResponseDto, required: false })
    resources?: ResourceSelectResponseDto[];
}

export class ResourceGroupWithResourcesResponseDto extends ResourceGroupResponseDto {
    @ApiProperty({
        type: [ChildResourceGroupResponseDto],
        required: false,
    })
    children?: ChildResourceGroupResponseDto[];
}

export class ResourceGroupWithResourcesAndReservationsResponseDto extends ResourceGroupResponseDto {
    @ApiProperty({
        type: [ResourceWithReservationsResponseDto],
        required: false,
    })
    resources?: ResourceWithReservationsResponseDto[];
}

export class ResourceGroupWithResourcesDto extends ResourceGroupResponseDto {
    @ApiProperty({
        type: [ResourceResponseDto],
        required: false,
    })
    resources?: ResourceResponseDto[];
}

export class ResourceTypeGroupDto {
    @ApiProperty({ enum: ResourceType, description: '자원 타입', required: false })
    type?: ResourceType;

    @ApiProperty({
        type: [ResourceGroupWithResourcesDto],
        description: '해당 타입의 그룹 목록',
        required: false,
    })
    groups?: ResourceGroupWithResourcesDto[];

    @ApiProperty({
        type: [ResourceResponseDto],
        description: '그룹이 없는 자원들',
        required: false,
    })
    ungroupedResources?: ResourceResponseDto[];
}

export class ManagementResourceResponseDto {
    constructor(resource?: any) {
        // 기본 자원 정보
        this.resourceId = resource?.resourceId;
        this.resourceGroupId = resource?.resourceGroupId;
        this.name = resource?.name;
        this.type = resource?.type;
        this.order = resource?.order;

        // // 타입별 상세 정보 설정
        // if (resource?.vehicleInfo) {
        //     this.vehicleInfo = resource.vehicleInfo;
        //     this.typeInfo = resource.vehicleInfo as unknown as VehicleInfoResponseDto;
        // }
        // if (resource?.meetingRoomInfo) {
        //     this.meetingRoomInfo = resource.meetingRoomInfo;
        //     this.typeInfo = resource.meetingRoomInfo as unknown as MeetingRoomInfoResponseDto;
        // }
        // if (resource?.accommodationInfo) {
        //     this.accommodationInfo = resource.accommodationInfo;
        //     this.typeInfo = resource.accommodationInfo as unknown as AccommodationInfoResponseDto;
        // }
        // if (resource?.equipmentInfo) {
        //     this.equipmentInfo = resource.equipmentInfo;
        //     this.typeInfo = resource.equipmentInfo as unknown as EquipmentInfoResponseDto;
        // }

        // 타입별 확장 정보 설정
        if (resource?.type === ResourceType.VEHICLE) {
            // 차량 타입의 경우 정비 관련 정보 추가
            if (resource?.isReplacementRequired !== undefined) {
                this.isReplacementRequired = resource.isReplacementRequired;
            }
            if (resource?.replacementRequiredConsumables !== undefined) {
                this.replacementRequiredConsumables = resource.replacementRequiredConsumables;
            }
        }
        // 향후 다른 타입들의 확장 정보도 여기에 추가 가능
    }

    @ApiProperty({ required: false })
    resourceId?: string;

    @ApiProperty({ required: false })
    resourceGroupId?: string;

    @ApiProperty()
    name: string;

    @ApiProperty({ enum: ResourceType })
    type?: ResourceType;

    @ApiProperty()
    order: number;

    // @ApiProperty({
    //     required: false,
    //     oneOf: [
    //         { $ref: getSchemaPath(VehicleInfoResponseDto) },
    //         { $ref: getSchemaPath(MeetingRoomInfoResponseDto) },
    //         { $ref: getSchemaPath(AccommodationInfoResponseDto) },
    //         { $ref: getSchemaPath(EquipmentInfoResponseDto) },
    //     ],
    // })
    // typeInfo?:
    //     | VehicleInfoResponseDto
    //     | MeetingRoomInfoResponseDto
    //     | AccommodationInfoResponseDto
    //     | EquipmentInfoResponseDto;

    // // 실제 타입별 정보들 (내부 사용, Swagger에 노출되지 않음)
    // vehicleInfo?: any;
    // meetingRoomInfo?: any;
    // accommodationInfo?: any;
    // equipmentInfo?: any;

    // 차량 타입 전용 필드들
    @ApiProperty({
        description: '교체가 필요한 소모품이 있는지 여부 (차량 타입만 해당)',
        required: false,
    })
    isReplacementRequired?: boolean;

    @ApiProperty({
        description: '교체가 필요한 소모품 이름들 (차량 타입만 해당)',
        type: [String],
        required: false,
    })
    replacementRequiredConsumables?: string[];

    // 향후 다른 타입들의 확장 필드들도 여기에 추가 가능
    // 예: 회의실 예약 관련 정보, 숙박시설 체크인/아웃 정보 등
}

export class ManagementResourceGroupDto {
    @ApiProperty({ required: false })
    resourceGroupId?: string;

    @ApiProperty()
    title: string;

    @ApiProperty({ required: false })
    description?: string;

    @ApiProperty({ enum: ResourceType })
    type: ResourceType;

    @ApiProperty()
    order: number;

    @ApiProperty({ required: false })
    parentResourceGroupId?: string;

    @ApiProperty({
        type: [ManagementResourceResponseDto],
        required: false,
    })
    resources?: ManagementResourceResponseDto[];
}

export class ManagementResourceTypeGroupDto {
    @ApiProperty({ enum: ResourceType, description: '자원 타입' })
    type: ResourceType;

    @ApiProperty({
        type: [ManagementResourceGroupDto],
        description: '해당 타입의 그룹 목록',
        required: false,
    })
    groups?: ManagementResourceGroupDto[];

    @ApiProperty({
        type: [ManagementResourceResponseDto],
        description: '그룹이 없는 자원들',
        required: false,
    })
    ungroupedResources?: ManagementResourceResponseDto[];
}

export class MyManagementResourcesResponseDto {
    @ApiProperty({
        type: [ManagementResourceTypeGroupDto],
        description: '타입별로 분류된 자원 그룹들 (확장 정보 포함)',
    })
    resourcesByType: ManagementResourceTypeGroupDto[];
}
