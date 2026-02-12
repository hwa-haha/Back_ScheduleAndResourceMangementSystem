import { DateUtil } from '../utils/date.util';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { DomainRequestLogService } from '../../src/domain/request-log/request-log.service';
import { Environment } from '../../src/domain/request-log/request-log.entity';
import { throwError } from 'rxjs';

@Injectable()
export class RequestInterceptor implements NestInterceptor {
    private readonly logger = new Logger(RequestInterceptor.name);

    constructor(private readonly requestLogService: DomainRequestLogService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const { method, url, body, query, params, headers, user, ip } = request;
        const now = Date.now();
        const traceId = this.generateTraceId();

        // GET 요청은 로깅하지 않음
        const shouldLog = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method);

        console.log(
            `[Request] ${DateUtil.now().toISOString()} ${method} ${url} ${shouldLog ? `[TRACE:${traceId}]` : ''}`,
        );
        if (Object.keys(body || {}).length > 0) {
            console.log('Body:', body);
        }
        if (Object.keys(query || {}).length > 0) {
            console.log('Query:', query);
        }
        if (Object.keys(params || {}).length > 0) {
            console.log('Params:', params);
        }

        return next.handle().pipe(
            tap((responseData) => {
                const duration = Date.now() - now;
                console.log(`[Response Time] ${duration}ms`);

                // 로깅 대상인 경우에만 DB에 저장
                if (shouldLog) {
                    this.saveRequestLog({
                        method,
                        url,
                        body,
                        query,
                        params,
                        headers,
                        user,
                        ip,
                        responseData,
                        statusCode: response.statusCode,
                        duration,
                        traceId,
                        isError: false,
                    });
                }
            }),
            catchError((error) => {
                const duration = Date.now() - now;
                console.error(`[Error] ${method} ${url} - ${duration}ms`, error.message);

                // 에러 발생 시에도 로깅 대상이면 DB에 저장
                if (shouldLog) {
                    this.saveRequestLog({
                        method,
                        url,
                        body,
                        query,
                        params,
                        headers,
                        user,
                        ip,
                        responseData: null,
                        statusCode: error.status || 500,
                        duration,
                        traceId,
                        isError: true,
                        errorMessage: error.message,
                        errorStack: error.stack,
                    });
                }

                return throwError(() => error);
            }),
        );
    }

    private async saveRequestLog(logData: any): Promise<void> {
        try {
            const {
                method,
                url,
                body,
                query,
                params,
                headers,
                user,
                ip,
                responseData,
                statusCode,
                duration,
                traceId,
                isError,
                errorMessage,
                errorStack,
            } = logData;

            // 환경 설정
            const environment = this.getEnvironment();

            // 사용자 정보 추출
            const employeeName = user?.name || null;
            const employeeId = user?.employeeId || null;

            // 요청 데이터 정리 (민감한 정보 제거)
            const sanitizedHeaders = this.sanitizeHeaders(headers);
            const requestBody = body ? JSON.stringify(body) : null;
            const requestParams = { ...query, ...params };
            const requestParamsStr = Object.keys(requestParams).length > 0 ? JSON.stringify(requestParams) : null;
            const requestHeadersStr = JSON.stringify(sanitizedHeaders);
            const responseBodyStr = responseData ? JSON.stringify(responseData) : null;

            await this.requestLogService.createRequestLog({
                method,
                endpoint: url,
                requestBody: requestBody,
                requestParams: requestParamsStr,
                requestHeaders: requestHeadersStr,
                responseBody: responseBodyStr,
                statusCode,
                errorMessage: isError ? errorMessage : null,
                errorStack: isError ? errorStack : null,
                environment,
                employeeName,
                employeeId,
                userAgent: headers['user-agent'] || null,
                ipAddress: ip || headers['x-forwarded-for'] || headers['x-real-ip'] || null,
                duration,
                traceId,
            });
        } catch (error) {
            // 로그 저장 실패 시 에러 로깅만 하고 요청 처리는 계속 진행
            this.logger.error(`요청 로그 저장 실패: ${error.message}`, error.stack);
        }
    }

    private getEnvironment(): Environment {
        const nodeEnv = process.env.NODE_ENV;

        if (nodeEnv === 'production') {
            return Environment.PROD;
        } else if (nodeEnv === 'development') {
            return Environment.DEV;
        } else {
            return Environment.LOCAL;
        }
    }

    private sanitizeHeaders(headers: any): any {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
        const sanitized = { ...headers };

        sensitiveHeaders.forEach((header) => {
            if (sanitized[header]) {
                sanitized[header] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    private generateTraceId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
