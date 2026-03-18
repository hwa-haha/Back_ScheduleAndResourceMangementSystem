import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiExcludeEndpoint, ApiBody } from '@nestjs/swagger';
import { ScheduleManagementService } from '../schedule-management.service';
import { Employee } from '@libs/modules/employee/employee.entity';
import { User } from '../../../../libs/decorators/user.decorator';
import { ScheduleCalendarQueryDto } from '../dtos/schedule-calendar-query.dto';
import { ScheduleCalendarResponseDto } from '../dtos/schedule-calendar-response.dto';
import { MyScheduleQueryDto } from '../dtos/my-schedule-query.dto';
import { MyScheduleResponseDto } from '../dtos/my-schedule-response.dto';
import { ResourceScheduleQueryDto } from '../dtos/resource-schedule-query.dto';
import { ResourceScheduleResponseDto } from '../dtos/resource-schedule-response.dto';
import { ScheduleDetailQueryDto } from '../dtos/schedule-detail-query.dto';
import { ScheduleDetailResponseDto } from '../dtos/schedule-detail-response.dto';
import { ScheduleCreateRequestListDto } from '../dtos/schedule-create-request.dto';
import { ScheduleCreateResponseDto } from '../dtos/schedule-create-response.dto';
import { ScheduleExtendResponseDto } from '../dtos/schedule-extend-response.dto';
import { ScheduleUpdateRequestDto } from '../dtos/schedule-update-request.dto';
import { MyScheduleHistoryQueryDto } from '../dtos/my-schedule-history-query.dto';
import { MyScheduleHistoryResponseDto } from '../dtos/my-schedule-history-response.dto';

@ApiTags('v2 일정')
@Controller('v2/schedule')
@ApiBearerAuth()
export class ScheduleController {
    constructor(private readonly scheduleManagementService: ScheduleManagementService) {}

    @ApiExcludeEndpoint()
    @Get('cron-job/post-processing')
    async cronJobPostProcessing(): Promise<void> {
        return this.scheduleManagementService.postProcessingSchedules();
    }

    /**
     * 일정 캘린더 조회
     * 조회 조건
     * 1. 한달을 기준으로 조회한다 (쿼리로 연.월 을 받는다)
     * 2. 카테고리 필터가 존재한다. (전체, 일정, 프로젝트, 자원 별)
     * 3. 로그인한 유저를 기준으로 한 내 일정만 조회할 수 있다.
     */
    @ApiOperation({
        summary: '일정 캘린더 조회',
        description: '월별 일정 캘린더를 조회합니다. 카테고리 필터 및 내 일정만 조회 옵션을 지원합니다.',
    })
    @ApiOkResponse({
        description: '일정 캘린더 조회 성공',
        type: ScheduleCalendarResponseDto,
    })
    @Get('calendar')
    async findCalendar(
        @User() user: Employee,
        @Query() query: ScheduleCalendarQueryDto,
    ): Promise<ScheduleCalendarResponseDto> {
        return this.scheduleManagementService.findCalendar(user, query);
    }

    /**
     * 내 일정 조회 (통계 + 목록)
     * 조회 조건
     * 1. 현재시간을 기준으로 오늘 날짜 이후의 일정만 조회한다.
     * 2. 필터 - 역할 기준 ( 예약자, 참석자 ) / 카테고리 ( 전체, 일정, 프로젝트, 자원 별 )
     * 3. 제목과 자원명으로 검색할 수 있다.
     * 4. 통계는 검색 및 페이지네이션과 무관하게 필터 조건만 적용하여 계산한다.
     * 5. 일정 목록은 검색 및 페이지네이션이 적용된다.
     */
    @ApiOperation({
        summary: '내 일정 조회 (통계 + 목록)',
        description:
            '로그인한 사용자의 일정 통계와 목록을 함께 조회합니다. 통계는 검색에 영향받지 않으며, 목록은 검색과 페이지네이션이 적용됩니다.',
    })
    @ApiOkResponse({
        description: '내 일정 조회 성공',
        type: MyScheduleResponseDto,
    })
    @Get('my')
    async findMySchedules(@User() user: Employee, @Query() query: MyScheduleQueryDto): Promise<MyScheduleResponseDto> {
        return this.scheduleManagementService.findMySchedules(user, query);
    }

    /**
     * 내 일정 내역 조회
     * 조회 조건
     * 1. 현재시간을 기준으로 오늘 날짜 이후의 일정만 조회한다.
     * 2. 필터 - 역할 기준 ( 예약자, 참석자 ) / 카테고리 ( 전체, 일정, 프로젝트, 자원 별 )
     * 3. 제목과 자원명으로 검색할 수 있다.
     * 4. 일정 목록은 검색 및 페이지네이션이 적용된다.
     */
    @ApiOperation({
        summary: '내 일정 내역 조회',
        description: '로그인한 사용자의 일정 목록을 조회합니다. 목록은 검색과 페이지네이션이 적용됩니다.',
    })
    @ApiOkResponse({
        description: '내 일정 내역 조회 성공',
        type: MyScheduleHistoryResponseDto,
    })
    @Get('my/history')
    async findMyScheduleHistory(
        @User() user: Employee,
        @Query() query: MyScheduleHistoryQueryDto,
    ): Promise<MyScheduleHistoryResponseDto> {
        return this.scheduleManagementService.findMyScheduleHistory(user, query);
    }

    /**
     * 자원별 일정 조회
     * 조회 조건
     * 1. 자원별 일정을 조회한다.
     * 2. 조회 조건 - 자원유형별, 날짜별 로 조회할 수 있다.
     * 2-1. 자원유형별로 날짜의 적용이 다르다.
     * 2-2. 숙소는 월별로 검색하고 그 외는 일별로 검색한다.
     * 3. 조회 결과는 자원그룹별로 그룹핑되어서 조회된다.
     */
    @ApiOperation({
        summary: '자원별 일정 조회',
        description:
            '자원 유형별로 일정을 조회합니다. 숙소는 월별, 그 외는 일별로 조회하며, 자원그룹별로 그룹핑됩니다.',
    })
    @ApiOkResponse({
        description: '자원별 일정 조회 성공',
        type: ResourceScheduleResponseDto,
    })
    @Get('resource')
    async findResourceSchedules(
        @User() user: Employee,
        @Query() query: ResourceScheduleQueryDto,
    ): Promise<ResourceScheduleResponseDto> {
        return this.scheduleManagementService.findResourceSchedules(user, query);
    }

    /**
     * 일정 상세 조회
     * 일정 상세정보에 타입별 정보를 추가하는 식으로 구현한다.
     */
    @ApiOperation({
        summary: '일정 상세 조회',
        description: '일정 상세 정보를 조회합니다.',
    })
    @ApiOkResponse({
        description: '일정 상세 조회 성공',
        type: ScheduleDetailResponseDto,
    })
    @Get('detail')
    async findScheduleDetail(
        @User() user: Employee,
        @Query() query: ScheduleDetailQueryDto,
    ): Promise<ScheduleDetailResponseDto> {
        return this.scheduleManagementService.findScheduleDetail(user, query);
    }

    @Post()
    @ApiOperation({
        summary: '일정 추가',
        description: '여러 일정을 한 번에 생성합니다.',
    })
    @ApiBody({
        description: '일정 생성 요청 목록',
        type: ScheduleCreateRequestListDto,
    })
    @ApiOkResponse({
        description: '일정 추가 성공',
        type: ScheduleCreateResponseDto,
    })
    async createSchedule(
        @User() user: Employee,
        @Body() createScheduleRequestList: ScheduleCreateRequestListDto,
    ): Promise<ScheduleCreateResponseDto> {
        return this.scheduleManagementService.createSchedule(user, createScheduleRequestList);
    }

    /**
     * 일정 삭제 (취소)
     * 일정의 상태를 CANCELLED로 변경합니다.
     */
    @ApiOperation({
        summary: '일정 삭제 (취소)',
        description: '일정을 취소 상태로 변경합니다.',
    })
    @ApiOkResponse({
        description: '일정 취소 성공',
        type: Boolean,
    })
    @Patch(':scheduleId/cancel')
    async cancelSchedule(
        @User() user: Employee,
        @Param('scheduleId') scheduleId: string,
        // @Body() cancelScheduleDto: ScheduleCancelRequestDto,
    ): Promise<boolean> {
        return this.scheduleManagementService.cancelSchedule(user, scheduleId);
    }

    /**
     * 일정 완료 (종료)
     * 일정의 상태를 COMPLETED로 변경하고 관련 정보를 수정합니다.
     */
    @ApiOperation({
        summary: '일정 완료 (종료)',
        description: '일정을 완료 상태로 변경하고 관련 정보를 업데이트합니다.',
    })
    @ApiOkResponse({
        description: '일정 완료 성공',
        type: Boolean,
    })
    @Patch(':scheduleId/complete')
    async completeSchedule(
        @User() user: Employee,
        @Param('scheduleId') scheduleId: string,
        // @Body() completeScheduleDto: ScheduleCompleteRequestDto,
    ): Promise<boolean> {
        return this.scheduleManagementService.completeSchedule(user, scheduleId);
    }

    /**
     * 일정 연장 가능 여부 확인
     * 자원예약이 포함된 일정의 30분 연장 가능 여부를 확인합니다.
     */
    @ApiOperation({
        summary: '일정 연장 가능 여부 확인',
        description:
            '자원예약이 포함된 일정의 30분 연장 가능 여부를 확인합니다. 일정 종료 15분 전부터 확인 가능합니다.',
    })
    @ApiOkResponse({
        description: '일정 연장 가능 여부',
        type: Boolean,
    })
    @Get(':scheduleId/check/extendable')
    async checkScheduleExtendable(@User() user: Employee, @Param('scheduleId') scheduleId: string): Promise<boolean> {
        return this.scheduleManagementService.checkScheduleExtendable(user, scheduleId);
    }

    /**
     * 일정 30분 연장
     * 자원예약이 포함된 일정을 30분 연장합니다.
     */
    @ApiOperation({
        summary: '일정 30분 연장',
        description: '자원예약이 포함된 일정을 현재 종료시간에서 30분 연장합니다.',
    })
    @ApiOkResponse({
        description: '일정 30분 연장 성공',
        type: ScheduleExtendResponseDto,
    })
    @Patch(':scheduleId/extend')
    async extendSchedule30Min(
        @User() user: Employee,
        @Param('scheduleId') scheduleId: string,
    ): Promise<ScheduleExtendResponseDto> {
        return this.scheduleManagementService.extendSchedule30Min(user, scheduleId);
    }

    /**
     * 일정 수정
     * 일정의 날짜, 시간 및 기타 정보를 수정합니다.
     */
    @ApiOperation({
        summary: '일정 수정',
        description: '일정의 날짜, 시간 및 기타 정보를 수정합니다.',
    })
    @ApiOkResponse({
        description: '일정 수정 성공',
        type: Boolean,
    })
    @Patch(':scheduleId')
    async updateSchedule(
        @User() user: Employee,
        @Param('scheduleId') scheduleId: string,
        @Body() updateScheduleDto: ScheduleUpdateRequestDto,
    ): Promise<boolean> {
        console.log('updateScheduleDto', JSON.stringify(updateScheduleDto, null, 2));
        return this.scheduleManagementService.updateSchedule(user, scheduleId, updateScheduleDto);
    }
}
