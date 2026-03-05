import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    private readonly logger = new Logger(JwtAuthGuard.name);

    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            this.logger.debug('Public 엔드포인트 - 인증 건너뜀');
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;
        this.logger.debug(
            `인증 시도: ${request.method} ${request.url}, Authorization: ${authHeader ? '있음' : '없음'}`,
        );

        // super.canActivate는 Promise를 반환하므로 그대로 반환
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
            this.logger.warn(`인증 실패: err=${err?.message}, info=${info?.message}, user=${user ? '있음' : '없음'}`);
            throw err || new UnauthorizedException('인증에 실패했습니다.');
        }
        return user;
    }
}
