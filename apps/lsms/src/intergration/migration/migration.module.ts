import { Module } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getLiveDataSourceOptions, LIVE_DATA_SOURCE } from './live-database.config';
import { LiveMigrationService } from './migration.service';
import { DomainModule } from '../../domain/domain.module';

/**
 * 라이브 DB → 로컬 도메인 마이그레이션 모듈
 *
 * 라이브 DB(LIVE_POSTGRES_*)에서 데이터를 읽어
 * LSMS 도메인(로컬 DB)에 이전합니다.
 */
@Module({
    imports: [DomainModule],
    providers: [
        {
            provide: LIVE_DATA_SOURCE,
            useFactory: async (): Promise<DataSource> => {
                const options = getLiveDataSourceOptions();
                const dataSource = new DataSource(options);
                await dataSource.initialize();
                return dataSource;
            },
        },
        LiveMigrationService,
    ],
    exports: [LiveMigrationService],
})
export class MigrationModule {}
