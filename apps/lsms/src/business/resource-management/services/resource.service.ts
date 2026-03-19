import { Injectable, BadRequestException } from '@nestjs/common';
import { ResourceType } from '../../../../libs/enums/resource-type.enum';
import { Employee } from '@libs/modules/employee/employee.entity';

// Context Services
import { ResourceContextService } from '../../../context/resource/services/resource.context.service';
import { ReservationContextService } from '../../../context/reservation/services/reservation.context.service';
import { ConsumableContextService } from '../../../context/resource/services/consumable.context.service';

// DTOs
import {
    ResourceResponseDto,
    ResourceGroupWithResourcesAndReservationsResponseDto,
    CreateResourceResponseDto,
    MyManagementResourcesResponseDto,
} from '../dtos/resource/resource-response.dto';
import { ResourceAvailabilityDto, TimeSlotDto } from '../dtos/resource/available-time-response.dto';
import { ResourceQueryDto } from '../dtos/resource/resource-query.dto';
import { CreateResourceInfoDto } from '../dtos/resource/create-resource.dto';
import { UpdateResourceInfoDto, UpdateResourceOrdersDto } from '../dtos/resource/update-resource.dto';
import { CheckAvailabilityQueryDto } from '../dtos/resource/check-availability.dto';
import { ResourceMonthAvailabilityQueryDto } from '../dtos/resource/resource-month-availability-query.dto';
import {
    ResourceMonthAvailabilityResponseDto,
    DailyAvailabilityDto,
} from '../dtos/resource/resource-month-availability-response.dto';
@Injectable()
export class ResourceService {
    constructor(
        private readonly resourceContextService: ResourceContextService,
        private readonly reservationContextService: ReservationContextService,
        private readonly consumableContextService: ConsumableContextService,
    ) {}
    // Admin Resource Controller
    async createResourceWithInfos(createResourceInfo: CreateResourceInfoDto): Promise<CreateResourceResponseDto> {
        return this.resourceContextService.자원과_상세정보를_생성한다(createResourceInfo);
    }

    async findResources(type: ResourceType): Promise<ResourceResponseDto[]> {
        return this.resourceContextService.자원_목록을_조회한다(type);
    }

    async findResourcesByResourceGroupId(resourceGroupId: string): Promise<ResourceResponseDto[]> {
        return this.resourceContextService.그룹별_자원_목록을_조회한다(resourceGroupId);
    }

    // 내가 자원관리자인 자원들의 목록을 그룹별로 조회
    async findMyManagementResources(employeeId: string): Promise<MyManagementResourcesResponseDto> {
        // 내가 관리하는 자원목록을 조회한다.
        const myResources = await this.resourceContextService.내가_관리하는_자원목록을_조회한다(employeeId);

        // 자원들의 그룹별로 자원을 분류한다.
        const groupedResources = await this.resourceContextService.자원들을_그룹별로_분류한다(myResources);

        // 자원들의 그룹타입별로 그룹을 분류한다.
        const typeGroupedResources = await this.resourceContextService.그룹들을_그룹타입별로_분류한다(groupedResources);

        // 계층 구조로 변환하여 반환
        return this.resourceContextService.타입그룹_계층구조로_변환한다(typeGroupedResources);
    }

    async findResourceDetailForAdmin(resourceId: string): Promise<ResourceResponseDto> {
        return this.resourceContextService.자원_상세정보를_조회한다(resourceId);
    }

    async reorderResources(updateResourceOrdersDto: UpdateResourceOrdersDto): Promise<void> {
        return this.resourceContextService.자원_순서를_변경한다(updateResourceOrdersDto);
    }

    async updateResource(
        resourceId: string,
        updateResourceInfoDto: UpdateResourceInfoDto,
    ): Promise<ResourceResponseDto> {
        return this.resourceContextService.자원을_수정한다(resourceId, updateResourceInfoDto);
    }

    async deleteResource(resourceId: string): Promise<void> {
        return this.resourceContextService.자원을_삭제한다(resourceId);
    }

    // User Resource Controller (임시로 기본 메서드들 사용)
    async findResourcesByTypeAndDateWithReservations(
        user: Employee,
        type: ResourceType,
        startDate: string,
        endDate: string,
        isMine: boolean,
    ): Promise<ResourceGroupWithResourcesAndReservationsResponseDto[]> {
        // TODO: 컨텍스트 서비스에 해당 메서드 추가 필요
        return [];
    }

    async checkAvailabilityMonth(
        query: ResourceMonthAvailabilityQueryDto,
    ): Promise<ResourceMonthAvailabilityResponseDto> {
        const { resourceId, year, month, startTime, endTime } = query;

        // 현재 날짜 정보 (UTC 기준)
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // getMonth()는 0부터 시작
        const currentDay = today.getDate();

        // 해당 월의 마지막 날 계산
        const lastDay = new Date(year, month, 0).getDate();

        const dailyAvailability: DailyAvailabilityDto[] = [];

        // 해당 월의 모든 날짜에 대해 예약 가능 여부 확인
        for (let day = 1; day <= lastDay; day++) {
            // 날짜 포맷팅 (YYYY-MM-DD)
            const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

            // 오늘 이전 날짜는 검증하지 않고 예약 불가능으로 처리
            if (year === currentYear && month === currentMonth && day < currentDay) {
                dailyAvailability.push({
                    date: dateString,
                    day,
                    available: false,
                });
                continue;
            }

            // 시작/종료 시간이 있는 경우 datetime 생성, 없으면 하루 전체
            const startDateTime = startTime ? `${dateString}T${startTime}:00+09:00` : `${dateString}T00:00:00+09:00`;
            const endDateTime = endTime ? `${dateString}T${endTime}:00+09:00` : `${dateString}T23:59:59+09:00`;

            try {
                // 해당 날짜/시간에 예약 가능한지 확인
                const isAvailable = await this.checkAvailability(resourceId, startDateTime, endDateTime);

                dailyAvailability.push({
                    date: dateString,
                    day,
                    available: isAvailable,
                });
            } catch (error) {
                // 에러 발생 시 예약 불가능으로 처리
                console.error(`Error checking availability for ${dateString}:`, error);
                dailyAvailability.push({
                    date: dateString,
                    day,
                    available: false,
                });
            }
        }

        return {
            dailyAvailability,
        };
    }

    /**
     * 자원 가용 시간 조회 (표준 파이프라인 적용)
     */
    async findAvailableTime(query: ResourceQueryDto): Promise<ResourceAvailabilityDto[]> {
        const {
            resourceType,
            resourceGroupId,
            startDate,
            endDate,
            startTime,
            endTime,
            am,
            pm,
            timeUnit,
            slotIntervalMinutes,
            reservationId,
        } = query;

        // 과거 날짜 조회 방지 (UTC 기준으로 yyyy-mm-dd 비교)
        const now = new Date();
        const queryStartDate = new Date(`${startDate}T00:00:00Z`);
        const todayString = now.toISOString().slice(0, 10); // UTC 기준 yyyy-mm-dd
        const queryDateString = queryStartDate.toISOString().slice(0, 10); // UTC 기준 yyyy-mm-dd

        if (queryDateString < todayString) {
            return [];
        }

        // 2. 그래프 조회: 파라미터 검증 및 자원 목록 조회
        this.validateAvailabilityQuery(query);
        const resources = await this.resourceContextService.그룹별_사용가능한_자원_목록을_조회한다(
            resourceGroupId,
            resourceType,
        );

        if (resources.length === 0) {
            return [];
        }

        // 3. 정책 판단: 자원 타입별 처리 방식 결정
        const isAccommodation = resourceType === ResourceType.ACCOMMODATION;
        const isSameDay = startDate === endDate;
        const isTimeSlotRequest = !isAccommodation && isSameDay && timeUnit;

        const result: ResourceAvailabilityDto[] = [];

        // 4. 실행/전이: 가용성 계산
        for (const resource of resources) {
            // 해당 자원의 예약 정보 조회
            const dateRangeStart = startTime
                ? new Date(`${startDate}T${startTime}+09:00`)
                : new Date(`${startDate}T00:00:00+09:00`);
            const dateRangeEnd = endTime
                ? new Date(`${endDate}T${endTime}+09:00`)
                : new Date(`${endDate}T23:59:59+09:00`);

            const reservations = await this.reservationContextService.자원의_날짜범위_예약을_조회한다(
                resource.resourceId,
                dateRangeStart,
                dateRangeEnd,
                reservationId,
            );
            if (isTimeSlotRequest) {
                // 시간 슬롯 방식: 슬롯 간격으로 가용 시간 계산
                const availabilityDto = await this.calculateTimeSlotAvailability(
                    resource,
                    startDate!,
                    endDate!,
                    startTime,
                    endTime,
                    am,
                    pm,
                    timeUnit!,
                    slotIntervalMinutes,
                    reservations,
                );
                availabilityDto.resourceGroupName = resource.resourceGroup.title;
                result.push(availabilityDto);
            } else if (isAccommodation || !isSameDay) {
                // 날짜 단위 방식: 전체 날짜/시간 범위에서 충돌 여부만 확인
                const hasConflict = this.checkDateRangeConflict(reservations, dateRangeStart, dateRangeEnd);

                if (!hasConflict) {
                    const availabilityDto = new ResourceAvailabilityDto();
                    availabilityDto.resourceId = resource.resourceId;
                    availabilityDto.resourceName = resource.name;
                    availabilityDto.resourceGroupName = resource.resourceGroup.title;
                    if (resource.location) {
                        const location = resource.location as any;
                        availabilityDto.resourceLocation =
                            location.address + (location.detailAddress ? ` ${location.detailAddress}` : '');
                    }

                    result.push(availabilityDto);
                }
            } else {
                throw new BadRequestException('시간 조회 조건이 올바르지 않습니다.');
            }
        }

        // 5. 후처리: 없음

        // 6. 응답 DTO 변환: 이미 완료됨
        return result;
    }

    /**
     * 가용성 조회 파라미터 검증
     */
    private validateAvailabilityQuery(query: ResourceQueryDto): void {
        const { startDate, endDate, startTime, endTime, am, pm, timeUnit } = query;

        // 1. 날짜 필수 검증
        if (!startDate && !endDate) {
            throw new BadRequestException('시작날짜 또는 종료날짜가 필요합니다.');
        }

        // 2. 날짜 범위 검증
        if (startDate && endDate && startDate > endDate) {
            throw new BadRequestException('시작날짜가 종료날짜보다 늦을 수 없습니다.');
        }

        // 3. 시간 옵션 충돌 검증
        const isTimeRange = startTime && endTime;
        const isTimeSelected = (am !== undefined || pm !== undefined) && timeUnit;

        if (isTimeRange && isTimeSelected) {
            throw new BadRequestException('시간 범위와 시간대 선택을 동시에 할 수 없습니다.');
        }
    }

    /**
     * 시간 슬롯 기반 가용성 계산
     */
    private async calculateTimeSlotAvailability(
        resource: any,
        startDate: string,
        endDate: string,
        startTime?: string,
        endTime?: string,
        am?: boolean,
        pm?: boolean,
        timeUnit?: number,
        slotIntervalMinutes: number = 30,
        reservations: any[] = [],
    ): Promise<ResourceAvailabilityDto> {
        const availabilityDto = new ResourceAvailabilityDto();
        availabilityDto.resourceId = resource.resourceId;
        availabilityDto.resourceName = resource.name;

        const isToday = startDate === new Date().toISOString().slice(0, 10);

        const timeRange = this.resourceContextService.현재시간_기준_가용시간대를_계산한다(
            resource.type,
            isToday,
            startTime,
            endTime,
        );

        const availableSlots = this.calculateAvailableTimeSlots(
            startDate,
            timeRange.startTime,
            timeRange.endTime,
            timeUnit!,
            am,
            pm,
            slotIntervalMinutes,
            reservations,
        );

        availabilityDto.availableTimeSlots = availableSlots;
        return availabilityDto;
    }

    /**
     * 시간 슬롯별 가용성 계산
     */
    private calculateAvailableTimeSlots(
        dateStr: string,
        startTime: string,
        endTime: string,
        timeUnit: number,
        am?: boolean,
        pm?: boolean,
        slotIntervalMinutes: number = 30,
        reservations: any[] = [],
    ): TimeSlotDto[] {
        const availableSlots: TimeSlotDto[] = [];

        // 오전/오후 필터링
        let actualStartTime = startTime;
        let actualEndTime = endTime;

        if (am && !pm) {
            actualEndTime = '12:00:00';
        } else if (!am && pm) {
            actualStartTime = '12:00:00';
        }

        const startDateTime = new Date(`${dateStr}T${actualStartTime}+09:00`);
        const endDateTime = new Date(`${dateStr}T${actualEndTime}+09:00`);

        const slotStart = new Date(startDateTime);

        while (slotStart < endDateTime) {
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotEnd.getMinutes() + timeUnit);

            // 슬롯이 종료 시간을 초과하면 다음 슬롯으로
            if (slotEnd > endDateTime) {
                slotStart.setMinutes(slotStart.getMinutes() + slotIntervalMinutes);
                continue;
            }

            // 예약 충돌 확인
            const isAvailable = this.reservationContextService.시간슬롯별_예약가능여부를_계산한다(
                reservations,
                slotStart,
                slotEnd,
            );

            if (isAvailable) {
                availableSlots.push({
                    startTime: slotStart.toISOString(),
                    endTime: slotEnd.toISOString(),
                });
            }

            // 다음 30분 슬롯으로 이동
            slotStart.setMinutes(slotStart.getMinutes() + slotIntervalMinutes);
        }

        return availableSlots;
    }

    /**
     * 날짜 범위 충돌 확인
     */
    private checkDateRangeConflict(reservations: any[], requestStart: Date, requestEnd: Date): boolean {
        return reservations.some((reservation) => {
            const reservationStart = new Date(reservation.startDate);
            const reservationEnd = new Date(reservation.endDate);

            return (
                (requestStart >= reservationStart && requestStart < reservationEnd) ||
                (requestEnd > reservationStart && requestEnd <= reservationEnd) ||
                (requestStart < reservationStart && requestEnd > reservationEnd)
            );
        });
    }

    async checkAvailability(
        resourceId: string,
        startDate: string,
        endDate: string,
        reservationId?: string,
    ): Promise<boolean> {
        const result = await this.resourceContextService.자원의_해당시간_예약을_확인한다(
            resourceId,
            startDate,
            endDate,
            reservationId,
        );
        return !result;
    }

    async findResourceDetailForUser(employeeId: string, resourceId: string): Promise<ResourceResponseDto> {
        return this.resourceContextService.자원_상세정보를_조회한다(resourceId);
    }
}
