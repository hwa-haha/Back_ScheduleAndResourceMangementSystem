import { Injectable, Logger } from '@nestjs/common';
import { LoginDto, LoginResponseDto } from './dtos';
import { DataSource } from 'typeorm';
import { LoginResponse, SSOClient } from '@lumir-company/sso-sdk';

/**
 * 인증 관리 비즈니스 서비스
 *
 * 인증 관련 비즈니스 로직을 처리합니다:
 * - SSO 로그인 처리
 * - JWT 토큰 생성
 */
@Injectable()
export class AuthManagementService {
    private readonly logger = new Logger(AuthManagementService.name);
    private readonly ssoClient: SSOClient;
    private initializationPromise: Promise<void> | null = null;

    constructor(private readonly dataSource: DataSource) {
        this.ssoClient = new SSOClient({
            clientId: process.env.SSO_CLIENT_ID,
            clientSecret: process.env.SSO_CLIENT_SECRET,
            baseUrl: process.env.SSO_API_URL,
        });
    }

    /**
     * SSO 클라이언트 초기화 (Lazy initialization)
     */
    private async ensureInitialized(): Promise<void> {
        if (!this.initializationPromise) {
            this.initializationPromise = (async () => {
                try {
                    this.logger.log('SSO 클라이언트 초기화 시작');
                    await this.ssoClient.initialize();
                    this.logger.log('SSO 클라이언트 초기화 완료');
                } catch (error) {
                    this.logger.error('SSO 클라이언트 초기화 실패', error);
                    this.initializationPromise = null;
                    throw error;
                }
            })();
        }
        return this.initializationPromise;
    }

    /**
     * 로그인 처리
     */
    async login(loginDto: LoginDto): Promise<LoginResponseDto> {
        await this.ensureInitialized();
        this.logger.log(`로그인 시도: ${loginDto.email}`);

        try {
            const ssoResponse: LoginResponse = await this.ssoClient.sso.login(loginDto.email, loginDto.password);

            this.logger.log(`SSO 로그인 성공: ${loginDto.email}`);

            const extraInfo = await this.직원_추가정보를_조회한다(ssoResponse.id);

            return {
                accessToken: ssoResponse.accessToken,
                email: ssoResponse.email,
                name: ssoResponse.name,
                department: ssoResponse.department ?? '',
                position: ssoResponse.position ?? '',
                rank: ssoResponse.rank ?? '',
                positionTitle: ssoResponse.position ?? '',
                roles: extraInfo?.roles ?? ['USER'],
            };
        } catch (error) {
            this.logger.error(`로그인 실패: ${loginDto.email}`, error);
            throw error;
        }
    }

    /**
     * employee_extra_info에서 LSMS 전용 추가 정보를 조회한다
     */
    private async 직원_추가정보를_조회한다(employeeId: string): Promise<{ roles: string[] } | null> {
        const rows = await this.dataSource.query(
            `SELECT roles FROM employee_extra_info WHERE employee_id = $1 LIMIT 1`,
            [employeeId],
        );
        return rows[0] ?? null;
    }
}
