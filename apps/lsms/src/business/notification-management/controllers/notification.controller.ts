import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { User } from '../../../../libs/decorators/user.decorator';
import { Employee } from '../../../domain/employee/employee.entity';
import { ResourceType } from '../../../../libs/enums/resource-type.enum';

// Business Layer DTOs (중앙집중식 import)
import {
    PaginationQueryDto,
    NotificationListResponseDto,
    PushSubscriptionDto,
    NotificationTypeResponseDto,
    SendNotificationDto,
    PushNotificationDto,
} from '../../../business.dto.index';
import { SubscriptionQueryDto } from '../dtos/subscription-query.dto';

// Business Service
import { NotificationManagementService } from '../notification-management.service';

@ApiTags('v2 알림 ')
@Controller('v2/notifications')
@ApiBearerAuth()
export class NotificationController {
    constructor(private readonly notificationManagementService: NotificationManagementService) {}

    @Post('subscribe')
    @ApiOperation({ summary: '웹 푸시 구독' })
    @ApiOkResponse({
        status: 200,
        description: '웹 푸시 구독 성공',
        type: Boolean,
    })
    async subscribe(
        // @Req() request: Request,
        @User() user: Employee,
        @Body() subscription: PushSubscriptionDto,
    ): Promise<boolean> {
        // const authorization = Array.isArray(request.headers.authorization)
        //     ? request.headers.authorization[0]
        //     : request.headers.authorization || '';
        return await this.notificationManagementService.웹푸시를_구독한다(user.employeeId, subscription);
    }

    @Post('subscribe/success')
    @ApiOperation({ summary: '웹 푸시 구독 성공' })
    @ApiOkResponse({
        status: 200,
        description: '웹 푸시 구독 성공',
    })
    async sendSuccess(@Body() body: PushNotificationDto) {
        await this.notificationManagementService.푸시_알림을_직접_전송한다([body.subscription.fcm.token], body.payload);
    }

    // @Post('send/reminder')
    // @ApiOperation({ summary: '예약 리마인더 알림 전송' })
    // @ApiOkResponse({
    //     status: 200,
    //     description: '예약 리마인더 알림 전송 성공',
    // })
    // async sendReminder(@Body() sendNotificationDto: SendNotificationDto) {
    //     await this.notificationManagementService.리마인더_알림을_전송한다(
    //         sendNotificationDto.notificationData,
    //         sendNotificationDto.notificationTarget,
    //     );
    // }

    @Post('send')
    @ApiOperation({ summary: '알림 전송' })
    @ApiOkResponse({
        status: 200,
        description: '알림 전송 성공',
    })
    async send(@Body() sendNotificationDto: SendNotificationDto) {
        await this.notificationManagementService.알림을_전송한다(
            sendNotificationDto.notificationType,
            sendNotificationDto.notificationData,
            sendNotificationDto.notificationTarget,
            sendNotificationDto.linkUrl,
        );
    }

    @Get('types')
    @ApiOperation({ summary: '알림 타입 목록 조회' })
    @ApiOkResponse({
        description: '알림 타입 목록 조회 성공',
        type: [NotificationTypeResponseDto],
    })
    async getNotificationTypes(): Promise<NotificationTypeResponseDto[]> {
        return await this.notificationManagementService.알림_타입_목록을_조회한다();
    }

    @Get()
    @ApiOperation({ summary: '알람 목록 조회' })
    @ApiOkResponse({
        description: '알람 목록 조회 성공',
        type: NotificationListResponseDto,
    })
    @ApiQuery({
        name: 'page',
        type: Number,
        required: false,
    })
    @ApiQuery({
        name: 'limit',
        type: Number,
        required: false,
    })
    @ApiQuery({
        name: 'resourceType',
        enum: ResourceType,
        required: false,
        description: '자원 타입별 필터링 (차량, 회의실, 숙박시설, 장비)',
    })
    async findAllByEmployeeId(
        @User('employeeId') employeeId: string,
        @Query() query: PaginationQueryDto,
        @Query('resourceType') resourceType?: ResourceType,
    ): Promise<NotificationListResponseDto> {
        return await this.notificationManagementService.내_알림_목록을_조회한다(employeeId, query, resourceType);
    }

    @Patch(':notificationId/read')
    @ApiOperation({ summary: '알람 읽음 처리' })
    @ApiOkResponse({
        status: 200,
        description: '알람 읽음 처리 성공',
    })
    async markAsRead(@User() user: Employee, @Param('notificationId') notificationId: string) {
        await this.notificationManagementService.알림을_읽음_처리한다(user.employeeId, notificationId);
    }

    @Patch('mark-all-read')
    @ApiOperation({ summary: '모든 알람 읽음 처리' })
    @ApiOkResponse({
        status: 200,
        description: '모든 알람 읽음 처리 성공',
    })
    async markAllAsRead(@User('employeeId') employeeId: string) {
        await this.notificationManagementService.모든_알림을_읽음_처리한다(employeeId);
    }

    @Get('subscriptions')
    @ApiOperation({ summary: '구독 정보 조회' })
    @ApiOkResponse({
        status: 200,
        description: '구독 정보 조회 성공',
    })
    async findSubscription(@Query() query: SubscriptionQueryDto) {
        return await this.notificationManagementService.구독_목록을_조회한다(query.employeeIds);
    }
}
