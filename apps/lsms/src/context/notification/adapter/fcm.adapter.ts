import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map, of } from 'rxjs';
import { AxiosError } from 'axios';
import { FcmSendRequestDto } from '../dtos/fcm-send-request.dto';
import { FcmSendResponseDto, FcmBulkSendResponseDto } from '../dtos/fcm-send-response.dto';
import {
    SendPortalNotificationDto,
    PortalNotificationResponseDto,
    RecipientDto,
} from '../dtos/portal-notification.dto';
import { EmployeeTokensDto } from '../../../../../../libs/temp/employee/dtos/fcm-token-response.dto';
import { NotificationType } from '../../../../libs/enums/notification-type.enum';
import { NotificationData } from '../../../domain/notification/notification.entity';

@Injectable()
export class FCMMicroserviceAdapter {
    private readonly logger = new Logger(FCMMicroserviceAdapter.name);
    private readonly fcmServiceUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        // 환경변수에서 FCM API URL 가져오기
        this.fcmServiceUrl = this.configService.get<string>('FCM_API_URL') || 'https://lnms-dev.lumir.space';
    }

    /**
     * 공통 HTTP 헤더 생성
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @returns HTTP 헤더 객체
     */
    private getHeaders(authorization?: string): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (authorization) {
            headers['Authorization'] = authorization;
        }

        return headers;
    }

    /**
     * 포털 알림 전송 (다중 수신자 지원)
     * 비동기적으로 처리되며, 에러 발생 시 로그만 남기고 예외를 던지지 않습니다.
     * @param employeeTokens 직원 토큰 정보 배열
     * @param payload 알림 페이로드 (title, body, linkUrl 등)
     * @param sender 발신자 사번 (employeeNumber, 선택, 시스템 전송 시 미사용)
     * @param authorization Authorization 헤더 (선택)
     * @returns 전송 결과 (Promise, await 없이 호출 가능)
     */
    async sendNotification(
        employeeTokens: EmployeeTokensDto[],
        payload: {
            title: string;
            body: string;
            linkUrl?: string;
            icon?: string;
            notificationType?: NotificationType;
            notificationData?: NotificationData;
        },
        sender?: string,
        authorization?: string,
    ): Promise<PortalNotificationResponseDto> {
        try {
            if (!employeeTokens || employeeTokens.length === 0) {
                this.logger.warn('포털 알림 전송: 직원 토큰 목록이 없습니다.');
                return {
                    success: false,
                    message: '포털 알림 전송 실패',
                    error: '직원 토큰 목록이 없습니다.',
                };
            }

            // EmployeeTokensDto[]를 RecipientDto[]로 변환
            const recipients: RecipientDto[] = employeeTokens
                .filter((emp) => emp.tokens && emp.tokens.length > 0)
                .map((emp) => ({
                    employeeNumber: emp.employeeNumber,
                    tokens: emp.tokens.map((token) => token.fcmToken),
                }));

            if (recipients.length === 0) {
                this.logger.warn('포털 알림 전송: 전송할 FCM 토큰이 없습니다.');
                return {
                    success: false,
                    message: '포털 알림 전송 실패',
                    error: '전송할 FCM 토큰이 없습니다.',
                };
            }

            // 총 토큰 수 계산
            const totalTokens = recipients.reduce((sum, recipient) => sum + recipient.tokens.length, 0);

            this.logger.log(`포털 알림 전송 요청: 수신자 ${recipients.length}명, 총 ${totalTokens}개 토큰`);

            // SendPortalNotificationDto 생성 (시스템에서 보내는 경우 sender 제외)
            const requestDto: SendPortalNotificationDto = {
                title: payload.title,
                content: payload.body,
                recipients,
                sourceSystem: process.env.NODE_ENV === 'production' ? 'RMS-PROD' : 'RMS-DEV',
                linkUrl: payload.linkUrl,
                metadata: {
                    icon: payload.icon || 'https://lumir-erp.vercel.app/%EC%82%BC%EC%A1%B1%EC%98%A4_black.png',
                    linkUrl: payload.linkUrl,
                    notificationType: payload.notificationType,
                    notificationData: payload.notificationData,
                },
            };

            // 알림 서버에 한번만 요청 전송
            const url = `${this.fcmServiceUrl}/api/portal/notifications/send`;

            const response = await firstValueFrom(
                this.httpService
                    .post<PortalNotificationResponseDto>(url, requestDto, {
                        headers: this.getHeaders(authorization),
                    })
                    .pipe(
                        map((res) => res.data),
                        catchError((error: AxiosError) => {
                            this.logger.error(`포털 알림 전송 실패: ${error.message}`, error.stack);

                            let errorMessage = '포털 알림 전송 중 오류가 발생했습니다.';

                            if (error.response?.status === 400) {
                                errorMessage = '요청 데이터 형식이 올바르지 않습니다.';
                            } else if (error.response?.status === 404) {
                                errorMessage = '알림 서비스를 찾을 수 없습니다.';
                            } else if (error.response?.status === 500) {
                                errorMessage = '알림 서버 내부 오류가 발생했습니다.';
                            }

                            return of({
                                success: false,
                                message: '포털 알림 전송 실패',
                                error: errorMessage,
                            });
                        }),
                    ),
            );

            this.logger.log(`포털 알림 전송 완료: ${response.success ? '성공' : '실패'} - ${response.message}`);

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
            this.logger.error(
                `포털 알림 전송 중 예외 발생: ${errorMessage}`,
                error instanceof Error ? error.stack : undefined,
            );

            return {
                success: false,
                message: '포털 알림 전송 실패',
                error: errorMessage,
            };
        }
    }

    /**
     * 다중 FCM 알림 전송
     * @param tokens FCM 토큰 배열
     * @param payload 알림 내용
     * @param authorization Authorization 헤더 (선택)
     * @returns 전송 결과
     */
    async sendBulkNotification(
        tokens: string[],
        payload: { title: string; body: string; link: string; icon: string },
        authorization?: string,
    ): Promise<FcmBulkSendResponseDto[]> {
        try {
            if (!tokens || tokens.length === 0) {
                throw new BadRequestException('FCM tokens are missing');
            }

            this.logger.log(`FCM 다중 알림 전송 요청: ${tokens.length}개 토큰`);

            const responses: FcmBulkSendResponseDto[] = [];

            for (const token of tokens) {
                const requestDto: FcmSendRequestDto = {
                    token,
                    title: payload.title,
                    body: payload.body,
                    link: payload.link,
                    icon: payload.icon,
                };
                const url = `${this.fcmServiceUrl}/api/fcm/test-send`;

                const response = await firstValueFrom(
                    this.httpService
                        .post<FcmBulkSendResponseDto>(url, requestDto, {
                            headers: this.getHeaders(authorization),
                        })
                        .pipe(
                            map((res) => res.data),
                            catchError((error: AxiosError) => {
                                this.logger.error(`FCM 다중 알림 전송 실패: ${error.message}`, error.stack);

                                let errorMessage = 'FCM 다중 알림 전송 중 오류가 발생했습니다.';
                                let errorCode = 'UNKNOWN_ERROR';

                                if (error.response?.status === 400) {
                                    errorMessage = 'FCM 토큰 형식이 올바르지 않습니다.';
                                    errorCode = 'INVALID_TOKEN';
                                } else if (error.response?.status === 404) {
                                    errorMessage = 'FCM 서비스를 찾을 수 없습니다.';
                                    errorCode = 'SERVICE_NOT_FOUND';
                                }

                                // 예외를 던지는 대신 에러 객체를 리턴
                                return of({
                                    success: false,
                                    successCount: 0,
                                    failureCount: 1,
                                    message: 'failed',
                                    errorMessage,
                                    errorCode,
                                    messageId: null,
                                });
                            }),
                        ),
                );

                this.logger.log(
                    `FCM 다중 알림 전송 성공: 성공 ${response.successCount}개, 실패 ${response.failureCount}개`,
                );
                console.log(response);
                responses.push(response);
            }

            return responses;
        } catch (error) {
            this.logger.error(`FCM 다중 알림 전송 중 예외 발생: ${error.message}`, error.stack);
            // 예외를 던지는 대신 에러 응답 배열을 리턴
            return [
                {
                    success: false,
                    successCount: 0,
                    failureCount: tokens.length,
                    message: 'failed',
                    errorMessage: error.message || 'FCM 다중 알림 전송 중 예외가 발생했습니다.',
                    errorCode: error.code || 'EXCEPTION_ERROR',
                    messageId: null,
                },
            ];
        }
    }
}
