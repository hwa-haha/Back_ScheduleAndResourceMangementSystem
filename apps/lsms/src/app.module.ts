// node_modules
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as path from 'path';

// 프로젝트 내부 라이브러리
import { FIREBASE_CONFIG, DB_CONFIG, JWT_CONFIG } from '../libs/configs/env.config';
import { DatabaseModule } from '@libs/database/database.module';
import { jwtConfig } from '@libs/configs/jwt.config';

import { FileManagementModule } from './business/file-management/file-management.module';
import { ResourceManagementModule } from './business/resource-management/resource-management.module';
import { ReservationManagementModule } from './business/reservation-management/reservation-management.module';
import { ScheduleManagementModule } from './business/schedule-management/schedule-management.module';
import { EmployeeManagementModule } from './business/employee-management/employee-management.module';
import { TaskManagementModule } from './business/task-management/task-management.module';
import { NotificationManagementModule } from './business/notification-management/notification-management.module';
import { StatisticsModule } from './business/statistics/statistics.module';
import { AuthManagementModule } from './business/auth-management/auth-management.module';
import { DomainModule } from './domain/domain.module';
import { RequestInterceptor } from '../libs/interceptors/request.interceptor';
import { MigrationModule } from './intergration/migration/migration.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [path.resolve('.env'), path.resolve('apps', 'lsms', '.env')],
            load: [FIREBASE_CONFIG, DB_CONFIG, JWT_CONFIG],
        }),
        EventEmitterModule.forRoot(),
        JwtModule.registerAsync({
            global: true,
            useFactory: jwtConfig,
            inject: [ConfigService],
        }),
        DatabaseModule,

        /** 도메인 */
        DomainModule,

        /** 마이그레이션 (라이브 DB → 도메인, 필요 시 import) */
        // MigrationModule,

        /** 비즈니스 */
        FileManagementModule,
        ResourceManagementModule,
        ReservationManagementModule,
        ScheduleManagementModule,
        EmployeeManagementModule,
        TaskManagementModule,
        NotificationManagementModule,
        StatisticsModule,
        AuthManagementModule,
    ],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: RequestInterceptor,
        },
    ],
})
export class AppModule {}
