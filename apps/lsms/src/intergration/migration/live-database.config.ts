import { DataSource, DataSourceOptions } from 'typeorm';
import { Entities } from './entities';

/** Nest DI 토큰: 라이브 DB DataSource */
export const LIVE_DATA_SOURCE = 'LIVE_DATA_SOURCE';

/**
 * 라이브 DB 연결 설정 (마이그레이션 소스)
 * 환경 변수 LIVE_POSTGRES_* 사용
 */
export function getLiveDataSourceOptions(): DataSourceOptions {
    return {
        type: 'postgres',
        host: process.env.LIVE_POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.LIVE_POSTGRES_PORT || '5432', 10),
        username: process.env.LIVE_POSTGRES_USER,
        password: process.env.LIVE_POSTGRES_PASSWORD,
        database: process.env.LIVE_POSTGRES_DB,
        schema: process.env.LIVE_POSTGRES_SCHEMA || 'public',
        entities: Entities,
        synchronize: false,
        logging: ['error', 'warn'],
    };
}

/**
 * 라이브 DB DataSource 인스턴스 생성 (CLI/스크립트용)
 * Nest 내부에서는 LIVE_DATA_SOURCE 프로바이더 사용
 */
export function createLiveDataSource(): DataSource {
    return new DataSource(getLiveDataSourceOptions());
}
