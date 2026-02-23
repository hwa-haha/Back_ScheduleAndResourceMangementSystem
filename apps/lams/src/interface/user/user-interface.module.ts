import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserBusinessModule } from '../../business/user-business/user-business.module';

/**
 * 업무관리시스템 유저 인터페이스 모듈
 *
 * 유저용 API: 확인할 근태 이슈, 확정된 전월 근태보고서 조회
 */
@Module({
    imports: [UserBusinessModule],
    controllers: [UserController],
    providers: [],
    exports: [],
})
export class UserInterfaceModule {}
