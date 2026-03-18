import { Controller, Get, Body, Param, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { User } from '../../../../libs/decorators/user.decorator';
import { Employee } from '@libs/modules/employee/employee.entity';
import { ReservationWithRelationsResponseDto, ReservationResponseDto } from '../dtos/reservation-response.dto';
import { PaginationQueryDto } from '../../../../libs/dtos/pagination-query.dto';
import { PaginationData } from '../../../../libs/dtos/pagination-response.dto';
import { ReturnVehicleDto, MarkVehicleUnusedDto } from '../dtos/update-reservation.dto';
import { ReservationService } from '../services/reservation.service';
import { UpdateReservationStatusDto } from '../dtos/update-reservation.dto';
import { ReservationListQueryDto } from '../dtos/reservation-list-query.dto';
import { ReservationListResponseDto } from '../dtos/reservation-list-response.dto';

@ApiTags('v2 예약 ')
@Controller('v2/reservations')
@ApiBearerAuth()
export class ReservationController {
    constructor(private readonly reservationService: ReservationService) {}

    @Get('')
    @ApiOperation({
        summary: '예약 리스트 조회 #관리자/예약관리',
    })
    @ApiOkResponse({
        description: '예약 리스트 조회 성공.',
        type: ReservationListResponseDto,
    })
    async findReservationList(@Query() query: ReservationListQueryDto): Promise<ReservationListResponseDto> {
        return this.reservationService.findReservationList(query);
    }

    @Get('check')
    @ApiOperation({ summary: '확인이 필요한 예약들' })
    @ApiOkResponse({
        description: '확인이 필요한 예약들 조회 성공',
        type: [ReservationWithRelationsResponseDto],
    })
    async findCheckReservationList(
        @Query() query: PaginationQueryDto,
    ): Promise<PaginationData<ReservationWithRelationsResponseDto>> {
        return this.reservationService.findCheckReservationList(query);
    }

    @Get(':reservationId')
    @ApiOperation({ summary: '예약 상세 조회 #사용자/예약상세페이지' })
    @ApiOkResponse({
        description: '예약 상세 조회 성공',
        type: ReservationWithRelationsResponseDto,
    })
    async findOne(
        @User() user: Employee,
        @Param('reservationId') reservationId: string,
    ): Promise<ReservationWithRelationsResponseDto> {
        return this.reservationService.findOne(user, reservationId);
    }

    @Patch(':reservationId/status')
    @ApiOperation({ summary: '예약 상태 수정 #관리자/예약관리/예약상세' })
    @ApiOkResponse({
        description: '예약 상태 수정 성공',
        type: ReservationResponseDto,
    })
    async updateStatus(
        @Param('reservationId') reservationId: string,
        @Body() updateDto: UpdateReservationStatusDto,
    ): Promise<ReservationResponseDto> {
        return this.reservationService.updateStatus(reservationId, updateDto);
    }

    @Patch(':reservationId/return-vehicle')
    @ApiOperation({ summary: '차량 반납 #사용자/자원예약/차량반납' })
    @ApiOkResponse({
        status: 200,
        description: '차량 반납 성공',
    })
    async returnVehicle(
        @User() user: Employee,
        @Param('reservationId') reservationId: string,
        @Body() returnDto: ReturnVehicleDto,
    ): Promise<boolean> {
        return this.reservationService.returnVehicle(user, reservationId, returnDto);
    }

    @Patch(':reservationId/mark-vehicle-unused')
    @ApiOperation({ summary: '차량 미사용 처리 #사용자/자원예약/미사용처리' })
    @ApiOkResponse({
        status: 200,
        description: '차량 미사용 처리 성공',
    })
    async markVehicleUnused(
        @User() user: Employee,
        @Param('reservationId') reservationId: string,
        @Body() markUnusedDto: MarkVehicleUnusedDto,
    ): Promise<boolean> {
        return this.reservationService.markVehicleUnused(user, reservationId, markUnusedDto);
    }
}
