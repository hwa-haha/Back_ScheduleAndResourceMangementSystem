import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const method = request?.method;
        const url = request?.url;
        const authorization = request?.headers?.authorization as string | undefined;
        const hasAuthHeader = Boolean(authorization);
        const [scheme] = authorization?.split(' ') ?? [];
        const isBearerFormat = authorization?.startsWith('Bearer ') ?? false;

        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            console.log(`[JwtAuthGuard] 공개 라우트 통과: ${method} ${url}`);
            return true;
        }

        console.log(
            `[JwtAuthGuard] 인증 검사 시작: ${method} ${url} (Authorization 헤더: ${hasAuthHeader ? '있음' : '없음'})`,
        );
        console.log(
            `[JwtAuthGuard] Authorization 형식 확인: scheme=${scheme ?? '없음'}, bearer형식=${isBearerFormat ? 'Y' : 'N'}`,
        );
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const method = request?.method;
        const url = request?.url;

        if (err || !user) {
            const errorMessage = err?.message ?? '없음';
            const infoMessage = typeof info === 'string' ? info : info?.message ?? '없음';
            console.log(`[JwtAuthGuard] 인증 실패: ${method} ${url} | err=${errorMessage} | info=${infoMessage}`);
        } else {
            console.log(`[JwtAuthGuard] 인증 성공: ${method} ${url} | user=${user?.id ?? user?.employeeId ?? 'unknown'}`);
        }

        return super.handleRequest(err, user, info, context);
    }
}
