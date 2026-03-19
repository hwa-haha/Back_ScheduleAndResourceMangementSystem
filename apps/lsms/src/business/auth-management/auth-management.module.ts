import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { DomainEmployeeModule } from '@libs/modules/employee/employee.module';
import { JwtStrategy } from '../../../libs/strategies/jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';

// Business Services
import { AuthManagementService } from './auth-management.service';

// Controllers
import { AuthController } from './controllers/auth.controller';

/**
 * 인증 관리 비즈니스 모듈
 *
 * 인증 관련 비즈니스 로직을 처리하는 모듈입니다:
 * - SSO 로그인 API
 * - JWT 토큰 관리
 * - 직원 정보 동기화
 * - 시스템 관리자 인증
 *
 * 특징:
 * - Domain layer만 의존 (MDC 규칙 준수)
 * - v2 API 엔드포인트 제공
 * - SSO API 연동
 * - 비즈니스 플로우 중심의 서비스 설계
 */
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({}), // JWT 서비스 사용을 위해 추가
        DomainEmployeeModule,
    ],
    controllers: [AuthController],
    providers: [AuthManagementService, JwtStrategy],
    exports: [AuthManagementService, JwtStrategy, PassportModule],
})
export class AuthManagementModule {}
