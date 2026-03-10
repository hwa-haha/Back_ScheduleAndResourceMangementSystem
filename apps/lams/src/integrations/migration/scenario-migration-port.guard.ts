import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

const SCENARIO_CONTROLLER_DISABLED_PORT = 3102;

/**
 * APP_PORT가 3102일 때 시나리오 마이그레이션 API 접근을 막는다.
 * ConfigService를 사용하므로 process.env 대신 앱 설정이 적용된 후 동작한다.
 */
@Injectable()
export class ScenarioMigrationPortGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const port = this.configService.get<string | number>('APP_PORT');
        if (String(port) === String(SCENARIO_CONTROLLER_DISABLED_PORT)) {
            throw new NotFoundException('해당 API는 이 포트에서 비활성화되어 있습니다.');
        }
        return true;
    }
}
