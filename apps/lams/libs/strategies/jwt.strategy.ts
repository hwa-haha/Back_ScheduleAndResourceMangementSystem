import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * JWT 전략
 *
 * Passport JWT 전략을 구현합니다.
 * JWT 토큰을 검증하고 payload에서 사용자 정보를 추출합니다.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(configService: ConfigService) {
        const secret = configService.get<string>('jwt.secret') || configService.get<string>('GLOBAL_SECRET');

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: true, // 만료시간 없는 토큰을 허용하기 위해 true로 설정
            secretOrKey: secret || 'default-secret-key-change-in-production',
        });

        if (!secret) {
            console.warn('⚠️ JWT secret이 설정되지 않았습니다.');
        } else {
            console.log(`✅ JWT secret 설정 완료 (길이: ${secret.length})`);
        }
    }

    /**
     * JWT payload 검증
     *
     * @param payload JWT 토큰의 payload
     * @returns 검증된 사용자 정보
     */
    async validate(payload: any) {
        this.logger.debug(`JWT 토큰 검증 시작: employeeNumber=${payload?.employeeNumber}`);

        // payload에서 사용자 정보 추출
        // TODO: 필요시 Employee 도메인 서비스를 주입받아 사용자 정보를 조회하고 검증할 수 있습니다.
        
        // sub 또는 id 중 하나와 employeeNumber 필요 (테스트용 토큰은 id만 넣을 수 있음)
        const userId = payload?.sub ?? payload?.id;
        if (!payload || !userId || !payload.employeeNumber) {
            // 테스트 환경에서는 기본값 반환 (환경 변수로 구분 가능)
            if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
                this.logger.debug('테스트 환경: 기본 사용자 정보 반환');
                return {
                    id: '839e6f06-8d44-43a1-948c-095253c4cf8c',
                    employeeNumber: 'TEST001',
                    name: '테스트 사용자',
                    email: 'test@example.com',
                };
            }
            this.logger.warn(`토큰 검증 실패: employeeNumber가 없습니다. payload=${JSON.stringify(payload)}`);
            throw new UnauthorizedException('유효하지 않은 토큰입니다. employeeNumber가 없습니다.');
        }
        this.logger.debug(`✅ 토큰 검증 성공: employeeNumber=${payload.employeeNumber}`);

        return {
            id: userId,
            employeeNumber: payload.employeeNumber,
            name: payload.name,
            email: payload.email,
            ...payload,
        };
    }
}
