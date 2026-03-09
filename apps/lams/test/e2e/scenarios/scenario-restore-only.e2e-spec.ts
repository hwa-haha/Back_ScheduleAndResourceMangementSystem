/**
 * 시나리오 복원 전용 스펙 — cleanup-scenario-data 복원 로직만 실행한다.
 * 기존 시나리오 테스트(scenario-SC-*)와 분리하여 나중에 따로 실행한다.
 * 앱을 잠시 띄워 엔티티 목록만 얻은 뒤 앱을 닫고, 복원은 전용 DataSource로만 수행해
 * 연결 종료·미종료 핸들 문제를 피한다.
 *
 * 실행: npm run test:e2e:lams:scenarios:run-restore
 * @see apps/lams/src/integrations/migration/cleanup-scenario-data.ts
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestSetup } from '../utils/test-setup';
import {
    getLatestScenarioBackupFilePath,
    restoreScenarioDataFromFile,
} from '../../../src/integrations/migration/cleanup-scenario-data';

describe('시나리오 DB 복원 (복원 전용)', () => {
    let restoreDataSource: DataSource | null = null;

    beforeAll(async () => {
        jest.setTimeout(90_000);
        let app: INestApplication | null = await TestSetup.createTestApp();
        const appDs = app.get<DataSource>(DataSource);
        const entities = appDs.entityMetadatas.map((m) => m.target);
        await TestSetup.closeTestApp(app);
        app = null;

        restoreDataSource = new DataSource({
            type: 'postgres',
            host: process.env.POSTGRES_HOST ?? 'localhost',
            port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
            username: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DB,
            schema: process.env.POSTGRES_SCHEMA ?? 'public',
            entities,
        });
        await restoreDataSource.initialize();
    });

    afterAll(async () => {
        if (restoreDataSource?.isInitialized) {
            await restoreDataSource.destroy();
            restoreDataSource = null;
        }
    });

    it(
        '최신 시나리오 백업 파일로 DB를 복원한다',
        async () => {
            if (!restoreDataSource) throw new Error('DataSource가 준비되지 않았습니다.');
            const backupPath = getLatestScenarioBackupFilePath();
            await restoreScenarioDataFromFile(restoreDataSource, backupPath);
        },
        60_000,
    );
});
