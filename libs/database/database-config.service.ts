import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

/**
 * 데이터베이스 설정 서비스
 *
 * 환경 변수를 기반으로 TypeORM 설정을 생성합니다.
 * 개발/운영 환경에 따른 다른 설정을 지원합니다.
 */
@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
    constructor(private configService: ConfigService) {}

    createTypeOrmOptions(): TypeOrmModuleOptions {
        const isDropSchema = this.configService.get('database.dropSchema') === 'true';

        const isProduction = this.configService.get('NODE_ENV') === 'production';
        const isDevelopment = this.configService.get('NODE_ENV') === 'development'; // 'development' 'local'

        // database 네임스페이스에서 설정 가져오기 (registerAs로 등록된 경우)
        const dbHost =
            this.configService.get<string>('database.host') ||
            this.configService.get<string>('POSTGRES_HOST', 'localhost');
        const dbPort =
            this.configService.get<number>('database.port') || this.configService.get<number>('POSTGRES_PORT', 5432);
        const dbUsername =
            this.configService.get<string>('database.username') ||
            this.configService.get<string>('POSTGRES_USER', 'admin');
        const dbPassword =
            this.configService.get<string>('database.password') ||
            this.configService.get<string>('POSTGRES_PASSWORD', 'tech7admin!');
        const dbDatabase =
            this.configService.get<string>('database.database') ||
            this.configService.get<string>('POSTGRES_DB', 'rms-test');
        const dbSchema =
            this.configService.get<string>('database.schema') ||
            this.configService.get<string>('POSTGRES_SCHEMA', 'public');

        return {
            type: 'postgres',
            host: dbHost,
            port: dbPort,
            username: dbUsername,
            password: dbPassword,
            database: dbDatabase,
            schema: dbSchema,

            // 마이그레이션 설정
            // migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
            // migrationsRun: false, // 애플리케이션 시작 시 자동 마이그레이션 실행 여부

            // 개발 환경 설정
            // synchronize: isDevelopment, // 개발 환경에서만 스키마 자동 동기화
            logging: isDevelopment ? ['error', 'warn'] : ['error'],

            // 연결 풀 설정
            extra: {
                connectionLimit: 10,
                acquireTimeout: 60000,
                timeout: 60000,
                reconnect: true,
            },

            // 캐시 설정
            cache: {
                type: 'database',
                duration: 30000, // 30초
            },

            // SSL 설정 (운영 환경)
            // ssl: isProduction ? { rejectUnauthorized: false } : false,

            // 연결 재시도 설정
            retryAttempts: 3,
            retryDelay: 3000,

            // 자동 로드 팩토리 (Lazy Loading 지원)
            autoLoadEntities: true,

            // 스키마 드롭 (개발 환경에서만)
            dropSchema: isDevelopment && isDropSchema,
        };
    }
}
