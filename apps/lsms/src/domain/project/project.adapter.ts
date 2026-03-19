import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import {
    ProjectHierarchyResponseDto,
    ProjectDataDto,
    GetProjectsByIdsRequestDto,
    GetProjectsByIdsResponseDto,
} from './dto';
import { EmployeeResponseDto } from '../../../../../libs/temp/employee/dtos/employee-response.dto';
import { EmployeesResponseDto } from '../../../../../libs/temp/employee/dtos/employees-response.dto';
import { FcmSubscribeRequestDto } from '../../../../../libs/temp/employee/dtos/fcm-subscribe-request.dto';
import { FcmSubscribeResponseDto } from '../../../../../libs/temp/employee/dtos/fcm-subscribe-response.dto';
import { FcmTokenResponseDto } from '../../../../../libs/temp/employee/dtos/fcm-token-response.dto';

@Injectable()
export class ProjectMicroserviceAdapter {
    private readonly logger = new Logger(ProjectMicroserviceAdapter.name);
    private readonly projectServiceUrl: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        // 환경변수에서 프로젝트 API URL과 직원 API URL 가져오기
        this.projectServiceUrl = this.configService.get<string>('PROJECT_API_URL') || 'https://lpms-backend.vercel.app';
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

    // ====== PROJECT API METHODS ======

    /**
     * 프로젝트 계층구조 조회
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @param flatten 1차원 배열 여부 (true: 1차원 배열, false: 계층 구조)
     * @returns 프로젝트 계층구조
     */
    async getProjectHierarchy(flatten?: boolean, authorization?: string): Promise<ProjectHierarchyResponseDto> {
        try {
            this.logger.log(`프로젝트 계층구조 조회 요청: flatten=${flatten}`);

            const params = new URLSearchParams();
            if (flatten !== undefined) {
                params.append('flatten', flatten.toString());
            }

            const url = `${this.projectServiceUrl}/api/common/project/hierarchy?${params.toString()}`;

            const response = await firstValueFrom(
                this.httpService
                    .get<ProjectHierarchyResponseDto>(url, {
                        headers: this.getHeaders(authorization),
                    })
                    .pipe(
                        map((res) => res.data),
                        catchError((error: AxiosError) => {
                            this.logger.error(`프로젝트 계층구조 조회 실패: ${error.message}`, error.stack);

                            if (error.response?.status === 404) {
                                throw new NotFoundException('프로젝트 계층구조 파일을 찾을 수 없습니다.');
                            }

                            throw new BadRequestException('프로젝트 계층구조 조회 중 오류가 발생했습니다.');
                        }),
                    ),
            );

            this.logger.log(`프로젝트 계층구조 조회 성공`);
            return response;
        } catch (error) {
            this.logger.error(`프로젝트 계층구조 조회 중 예외 발생: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 여러 프로젝트 ID로 조회 (GET)
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @param ids 쉼표로 구분된 프로젝트 ID 문자열
     * @returns 프로젝트 목록
     */
    async getProjectsByIdsGet(ids: string, authorization?: string): Promise<GetProjectsByIdsResponseDto> {
        try {
            this.logger.log(`프로젝트 ID로 조회 요청 (GET): ids=${ids}`);

            const params = new URLSearchParams();
            params.append('ids', ids);

            const url = `${this.projectServiceUrl}/api/common/project/by-ids?${params.toString()}`;

            const response = await firstValueFrom(
                this.httpService
                    .get<GetProjectsByIdsResponseDto>(url, {
                        headers: this.getHeaders(authorization),
                    })
                    .pipe(
                        map((res) => res.data),
                        catchError((error: AxiosError) => {
                            this.logger.error(`프로젝트 ID로 조회 실패 (GET): ${error.message}`, error.stack);

                            if (error.response?.status === 400) {
                                throw new BadRequestException('잘못된 요청 (ids 파라미터 누락 또는 유효하지 않음)');
                            }

                            throw new BadRequestException('프로젝트 조회 중 오류가 발생했습니다.');
                        }),
                    ),
            );

            this.logger.log(`프로젝트 ID로 조회 성공 (GET): ${response.projects.length}개 조회됨`);
            return response;
        } catch (error) {
            this.logger.error(`프로젝트 ID로 조회 중 예외 발생 (GET): ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 여러 프로젝트 ID로 조회 (POST)
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @param requestDto 프로젝트 ID 배열
     * @returns 프로젝트 목록
     */
    async getProjectsByIdsPost(
        requestDto: GetProjectsByIdsRequestDto,
        authorization?: string,
    ): Promise<GetProjectsByIdsResponseDto> {
        try {
            this.logger.log(`프로젝트 ID로 조회 요청 (POST): ${requestDto.ids.length}개`);

            const url = `${this.projectServiceUrl}/api/common/project/by-ids`;

            const response = await firstValueFrom(
                this.httpService
                    .post<GetProjectsByIdsResponseDto>(url, requestDto, {
                        headers: this.getHeaders(authorization),
                    })
                    .pipe(
                        map((res) => res.data),
                        catchError((error: AxiosError) => {
                            this.logger.error(`프로젝트 ID로 조회 실패 (POST): ${error.message}`, error.stack);

                            if (error.response?.status === 400) {
                                throw new BadRequestException('잘못된 요청 (ids 배열 누락 또는 유효하지 않음)');
                            }

                            throw new BadRequestException('프로젝트 조회 중 오류가 발생했습니다.');
                        }),
                    ),
            );

            this.logger.log(`프로젝트 ID로 조회 성공 (POST): ${response.projects.length}개 조회됨`);
            return response;
        } catch (error) {
            this.logger.error(`프로젝트 ID로 조회 중 예외 발생 (POST): ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * 프로젝트 계층구조 파일 다운로드
     * @param authorization 요청에서 전달받은 Authorization 헤더
     * @returns 프로젝트 계층구조 JSON 파일 바이너리 데이터
     */
    async downloadProjectHierarchy(authorization?: string): Promise<Buffer> {
        try {
            this.logger.log('프로젝트 계층구조 파일 다운로드 요청');

            const url = `${this.projectServiceUrl}/api/common/project/hierarchy/download`;

            const response = await firstValueFrom(
                this.httpService
                    .get(url, {
                        headers: this.getHeaders(authorization),
                        responseType: 'arraybuffer',
                    })
                    .pipe(
                        map((res) => Buffer.from(res.data)),
                        catchError((error: AxiosError) => {
                            this.logger.error(`프로젝트 계층구조 파일 다운로드 실패: ${error.message}`, error.stack);

                            if (error.response?.status === 404) {
                                throw new NotFoundException('프로젝트 계층구조 파일을 찾을 수 없습니다.');
                            }

                            throw new BadRequestException('프로젝트 계층구조 파일 다운로드 중 오류가 발생했습니다.');
                        }),
                    ),
            );

            this.logger.log('프로젝트 계층구조 파일 다운로드 성공');
            return response;
        } catch (error) {
            this.logger.error(`프로젝트 계층구조 파일 다운로드 중 예외 발생: ${error.message}`, error.stack);
            throw error;
        }
    }
}
