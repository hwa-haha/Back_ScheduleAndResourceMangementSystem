import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import {
    EmployeeRequestDto,
    EmployeeResponseDto,
    EmployeesResponseDto,
    FcmSubscribeRequestDto,
    FcmSubscribeResponseDto,
    DeleteFcmTokensRequestDto,
    DeleteFcmTokensResponseDto,
} from '../dtos';
import { EmployeeTokensDto, FcmTokenResponseDto } from '../dtos/fcm-token-response.dto';

@Injectable()
export class EmployeeMicroserviceAdapter {
    private readonly logger = new Logger(EmployeeMicroserviceAdapter.name);
    private readonly employeeServiceUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        // 환경변수에서 SSO API URL 가져오기
        this.employeeServiceUrl = this.configService.get<string>('SSO_API_URL') || 'https://lsso.vercel.app';
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
     * 단일 직원 정보 조회
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @param employeeId 직원 ID
     * @param withDetail 상세 정보 포함 여부
     * @returns 직원 정보
     */
    async getEmployee(
        authorization: string,
        employeeId: string,
        withDetail: boolean = false,
    ): Promise<EmployeeResponseDto> {
        try {
            this.logger.log(`직원 정보 조회 요청: employeeId=${employeeId}, withDetail=${withDetail}`);

            const params = new URLSearchParams();
            params.append('employeeId', employeeId);
            if (withDetail) {
                params.append('withDetail', 'true');
            }

            const url = `${this.employeeServiceUrl}/api/organization/employee?${params.toString()}`;

            const response = await firstValueFrom(
                this.httpService.get<EmployeeResponseDto>(url, { headers: this.getHeaders(authorization) }).pipe(
                    map((res) => res.data),
                    catchError((error: AxiosError) => {
                        this.logger.error(`직원 정보 조회 실패: ${error.message}`, error.stack);

                        if (error.response?.status === 404) {
                            throw new NotFoundException('직원을 찾을 수 없습니다.');
                        }

                        throw new BadRequestException('직원 정보 조회 중 오류가 발생했습니다.');
                    }),
                ),
            );

            this.logger.log(`직원 정보 조회 성공: employeeId=${employeeId}`);
            return response;
        } catch (error) {
            this.logger.error(`직원 정보 조회 중 예외 발생: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 사번으로 직원 정보 조회
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @param employeeNumber 사번
     * @param withDetail 상세 정보 포함 여부
     * @returns 직원 정보
     */
    async getEmployeeByNumber(
        authorization: string,
        employeeNumber: string,
        withDetail: boolean = false,
    ): Promise<EmployeeResponseDto> {
        try {
            this.logger.log(`사번으로 직원 정보 조회 요청: employeeNumber=${employeeNumber}, withDetail=${withDetail}`);

            const params = new URLSearchParams();
            params.append('employeeNumber', employeeNumber);
            if (withDetail) {
                params.append('withDetail', 'true');
            }

            const url = `${this.employeeServiceUrl}/api/organization/employee?${params.toString()}`;

            const response = await firstValueFrom(
                this.httpService.get<EmployeeResponseDto>(url, { headers: this.getHeaders(authorization) }).pipe(
                    map((res) => res.data),
                    catchError((error: AxiosError) => {
                        this.logger.error(`사번으로 직원 정보 조회 실패: ${error.message}`, error.stack);

                        if (error.response?.status === 404) {
                            throw new NotFoundException('해당 사번의 직원을 찾을 수 없습니다.');
                        }

                        throw new BadRequestException('직원 정보 조회 중 오류가 발생했습니다.');
                    }),
                ),
            );

            this.logger.log(`사번으로 직원 정보 조회 성공: employeeNumber=${employeeNumber}`);
            return response;
        } catch (error) {
            this.logger.error(`사번으로 직원 정보 조회 중 예외 발생: ${error.message}`, error.stack);
            throw error;
        }
    }

    // /**
    //  * 직원 목록 조회
    //  * @param authorization 요청에서 전달받은 Authorization 헤더
    //  * @param requestDto 조회 조건
    //  * @returns 직원 목록
    //  */
    // async getEmployees(authorization: string, requestDto: EmployeeRequestDto): Promise<EmployeesResponseDto> {
    //     try {
    //         this.logger.log(`직원 목록 조회 요청:`, requestDto);

    //         const params = new URLSearchParams();

    //         // 단일 ID를 배열 형태로 변환
    //         if (requestDto.employeeId) {
    //             params.append('employeeIds', requestDto.employeeId);
    //         }

    //         // 단일 사번을 배열 형태로 변환
    //         if (requestDto.employeeNumber) {
    //             params.append('employeeNumbers', requestDto.employeeNumber);
    //         }

    //         if (requestDto.withDetail !== undefined) {
    //             params.append('withDetail', requestDto.withDetail.toString());
    //         }

    //         // 기본적으로 퇴사자는 제외
    //         params.append('includeTerminated', 'false');

    //         const url = `${this.employeeServiceUrl}/api/organization/employees?${params.toString()}`;

    //         const response = await firstValueFrom(
    //             this.httpService.get<EmployeesResponseDto>(url, { headers: this.getHeaders(authorization) }).pipe(
    //                 map((res) => res.data),
    //                 catchError((error: AxiosError) => {
    //                     this.logger.error(`직원 목록 조회 실패: ${error.message}`, error.stack);
    //                     throw new BadRequestException('직원 목록 조회 중 오류가 발생했습니다.');
    //                 }),
    //             ),
    //         );

    //         this.logger.log(`직원 목록 조회 성공: 총 ${response.total}명`);
    //         return response;
    //     } catch (error) {
    //         this.logger.error(`직원 목록 조회 중 예외 발생: ${error.message}`, error.stack);
    //         throw error;
    //     }
    // }

    /**
     * 여러 직원 ID로 직원 정보 일괄 조회
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @param employeeIds 직원 ID 목록
     * @param withDetail 상세 정보 포함 여부
     * @returns 직원 목록
     */
    async getEmployeesByIds(
        authorization: string,
        employeeIds: string[],
        withDetail: boolean = false,
    ): Promise<EmployeeResponseDto[]> {
        try {
            this.logger.log(`직원 ID 목록으로 조회 요청: ${employeeIds.length}개, withDetail=${withDetail}`);

            const params = new URLSearchParams();
            // 배열을 쉼표로 구분된 문자열로 변환
            params.append('employeeIds', employeeIds.join(','));

            if (withDetail) {
                params.append('withDetail', 'true');
            }

            // 기본적으로 퇴사자는 제외
            params.append('includeTerminated', 'false');

            const url = `${this.employeeServiceUrl}/api/organization/employees?${params.toString()}`;

            const response = await firstValueFrom(
                this.httpService.get<EmployeesResponseDto>(url, { headers: this.getHeaders(authorization) }).pipe(
                    map((res) => res.data),
                    catchError((error: AxiosError) => {
                        this.logger.error(`직원 ID 목록 조회 실패: ${error.message}`, error.stack);
                        throw new BadRequestException('직원 목록 조회 중 오류가 발생했습니다.');
                    }),
                ),
            );

            this.logger.log(`직원 ID 목록 조회 성공: ${response.employees.length}명 조회됨`);
            // EmployeesResponseDto에서 employees 배열만 반환
            return response.employees;
        } catch (error) {
            this.logger.error(`직원 ID 목록 조회 중 예외 발생: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 여러 사번으로 직원 정보 일괄 조회
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @param employeeNumbers 사번 목록
     * @param withDetail 상세 정보 포함 여부
     * @returns 직원 목록
     */
    async getEmployeesByNumbers(
        authorization: string,
        employeeNumbers: string[],
        withDetail: boolean = false,
    ): Promise<EmployeeResponseDto[]> {
        try {
            this.logger.log(`사번 목록으로 조회 요청: ${employeeNumbers.length}개, withDetail=${withDetail}`);

            const params = new URLSearchParams();
            // 배열을 쉼표로 구분된 문자열로 변환
            params.append('employeeNumbers', employeeNumbers.join(','));

            if (withDetail) {
                params.append('withDetail', 'true');
            }

            // 기본적으로 퇴사자는 제외
            params.append('includeTerminated', 'false');

            const url = `${this.employeeServiceUrl}/api/organization/employees?${params.toString()}`;

            const response = await firstValueFrom(
                this.httpService.get<EmployeesResponseDto>(url, { headers: this.getHeaders(authorization) }).pipe(
                    map((res) => res.data),
                    catchError((error: AxiosError) => {
                        this.logger.error(`사번 목록 조회 실패: ${error.message}`, error.stack);
                        throw new BadRequestException('직원 목록 조회 중 오류가 발생했습니다.');
                    }),
                ),
            );

            this.logger.log(`사번 목록 조회 성공: ${response.employees.length}명 조회됨`);
            // EmployeesResponseDto에서 employees 배열만 반환
            return response.employees;
        } catch (error) {
            this.logger.error(`사번 목록 조회 중 예외 발생: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 전체 직원 목록 조회
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @param withDetail 상세 정보 포함 여부
     * @param includeTerminated 퇴사자 포함 여부
     * @returns 직원 목록
     */
    async getAllEmployees(
        authorization: string,
        withDetail: boolean = true,
        includeTerminated: boolean = true,
    ): Promise<EmployeesResponseDto> {
        try {
            this.logger.log(
                `전체 직원 목록 조회 요청: withDetail=${withDetail}, includeTerminated=${includeTerminated}`,
            );

            const params = new URLSearchParams();

            if (withDetail) {
                params.append('withDetail', 'true');
            }

            params.append('includeTerminated', includeTerminated.toString());

            const url = `${this.employeeServiceUrl}/api/organization/employees?${params.toString()}`;

            const response = await firstValueFrom(
                this.httpService.get<EmployeesResponseDto>(url, { headers: this.getHeaders(authorization) }).pipe(
                    map((res) => res.data),
                    catchError((error: AxiosError) => {
                        this.logger.error(`전체 직원 목록 조회 실패: ${error.message}`, error.stack);
                        throw new BadRequestException('전체 직원 목록 조회 중 오류가 발생했습니다.');
                    }),
                ),
            );

            this.logger.log(`전체 직원 목록 조회 성공: 총 ${response.total}명`);
            return response;
        } catch (error) {
            this.logger.error(`전체 직원 목록 조회 중 예외 발생: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 직원 존재 여부 확인
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @param employeeId 직원 ID
     * @returns 존재 여부
     */
    async checkEmployeeExists(authorization: string, employeeId: string): Promise<boolean> {
        try {
            this.logger.log(`직원 존재 여부 확인: employeeId=${employeeId}`);

            // getEmployee 메서드를 사용해서 존재 여부 확인
            await this.getEmployee(authorization, employeeId, false);

            this.logger.log(`직원 존재 여부 확인 완료: employeeId=${employeeId}, exists=true`);
            return true;
        } catch (error) {
            if (error instanceof NotFoundException) {
                this.logger.log(`직원 존재 여부 확인 완료: employeeId=${employeeId}, exists=false`);
                return false;
            }

            this.logger.error(`직원 존재 여부 확인 중 예외 발생: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * FCM 토큰 구독
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @param employeeId 직원 ID
     * @param fcmSubscribeDto FCM 구독 정보
     * @returns 구독 결과
     */
    async subscribeFcm(
        authorization: string,
        employeeNumber: string,
        fcmSubscribeDto: FcmSubscribeRequestDto,
    ): Promise<FcmSubscribeResponseDto> {
        try {
            this.logger.log(`FCM 토큰 구독 요청: employeeNumber=${employeeNumber}`);

            const url = `${this.employeeServiceUrl}/api/fcm/subscribe`;

            const response = await firstValueFrom(
                this.httpService
                    .post<FcmSubscribeResponseDto>(
                        url,
                        {
                            employeeNumber: employeeNumber,
                            fcmToken: fcmSubscribeDto.fcmToken,
                            deviceType: 'prod-old',
                        },
                        {
                            headers: this.getHeaders(authorization),
                        },
                    )
                    .pipe(
                        map((res) => res.data),
                        catchError((error: AxiosError) => {
                            this.logger.error(`FCM 토큰 구독 실패: ${error.message}`, error.stack);

                            if (error.response?.status === 404) {
                                throw new NotFoundException('직원을 찾을 수 없습니다.');
                            }

                            if (error.response?.status === 400) {
                                throw new BadRequestException('FCM 토큰 형식이 올바르지 않습니다.');
                            }

                            throw new BadRequestException('FCM 토큰 구독 중 오류가 발생했습니다.');
                        }),
                    ),
            );

            this.logger.log(`FCM 토큰 구독 성공: employeeNumber=${employeeNumber}`);
            return response;
        } catch (error) {
            this.logger.error(`FCM 토큰 구독 중 예외 발생: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 본인의 FCM 토큰 조회 (Authorization 헤더로 본인 확인)
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @returns FCM 토큰 정보
     */
    async getFcmToken(authorization: string): Promise<EmployeeTokensDto> {
        try {
            this.logger.log('본인의 FCM 토큰 조회 요청');

            const url = `${this.employeeServiceUrl}/api/fcm/token`;

            const response = await firstValueFrom(
                this.httpService.get<EmployeeTokensDto>(url, { headers: this.getHeaders(authorization) }).pipe(
                    map((res) => res.data),
                    catchError((error: AxiosError) => {
                        this.logger.error(`FCM 토큰 조회 실패: ${error.message}`, error.stack);

                        if (error.response?.status === 404) {
                            throw new NotFoundException('직원을 찾을 수 없습니다.');
                        }

                        throw new BadRequestException('FCM 토큰 조회 중 오류가 발생했습니다.');
                    }),
                ),
            );

            this.logger.log('본인의 FCM 토큰 조회 성공');
            return response;
        } catch (error) {
            this.logger.error(`FCM 토큰 조회 중 예외 발생: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 여러 직원의 FCM 토큰 일괄 조회
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @param employeeNumbers 쉼표로 구분된 직원 사번 목록
     * @returns FCM 토큰 목록
     */
    async getFcmTokens(authorization: string, employeeNumbers: string[]): Promise<FcmTokenResponseDto> {
        try {
            this.logger.log(`FCM 토큰 일괄 조회 요청: employeeNumbers=${employeeNumbers}`);

            const params = new URLSearchParams();
            params.append('employeeNumbers', employeeNumbers.join(','));

            const url = `${this.employeeServiceUrl}/api/fcm/tokens?${params.toString()}`;

            const response = await firstValueFrom(
                this.httpService.get<FcmTokenResponseDto>(url, { headers: this.getHeaders(authorization) }).pipe(
                    map((res) => res.data),
                    catchError((error: AxiosError) => {
                        this.logger.error(`FCM 토큰 일괄 조회 실패: ${error.message}`, error.stack);
                        throw new BadRequestException('FCM 토큰 일괄 조회 중 오류가 발생했습니다.');
                    }),
                ),
            );

            this.logger.log(`FCM 토큰 일괄 조회 성공: ${response.totalTokens}개 조회됨`);
            return response;
        } catch (error) {
            this.logger.error(`FCM 토큰 일괄 조회 중 예외 발생: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 여러 직원의 여러 FCM 토큰 일괄 제거
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @param requestDto 직원별 토큰 정보 배열
     * @returns 삭제 결과
     */
    async deleteFcmTokens(
        authorization: string,
        requestDto: DeleteFcmTokensRequestDto,
    ): Promise<DeleteFcmTokensResponseDto> {
        console.log('deleteFcmTokens', requestDto);
        try {
            const totalTokens = requestDto.employees.reduce((sum, emp) => sum + emp.fcmTokens.length, 0);
            this.logger.log(`FCM 토큰 일괄 제거 요청: ${requestDto.employees.length}명, 총 ${totalTokens}개 토큰`);

            const url = `${this.employeeServiceUrl}/api/fcm/tokens`;

            const response = await firstValueFrom(
                this.httpService
                    .delete<DeleteFcmTokensResponseDto>(url, {
                        headers: this.getHeaders(authorization),
                        data: {
                            employees: requestDto.employees,
                        },
                    })
                    .pipe(
                        map((res) => res.data),
                        catchError((error: AxiosError) => {
                            this.logger.error(`FCM 토큰 일괄 제거 실패: ${error.message}`, error.stack);

                            if (error.response?.status === 400) {
                                const errorData = error.response.data as any;
                                throw new BadRequestException(errorData?.message || '잘못된 요청 형식입니다.');
                            }

                            throw new BadRequestException('FCM 토큰 일괄 제거 중 오류가 발생했습니다.');
                        }),
                    ),
            );

            this.logger.log(`FCM 토큰 일괄 제거 완료: 성공 ${response.successCount}개, 실패 ${response.failCount}개`);
            return response;
        } catch (error) {
            this.logger.error(`FCM 토큰 일괄 제거 중 예외 발생: ${error.message}`, error.stack);
            throw error;
        }
    }
}
