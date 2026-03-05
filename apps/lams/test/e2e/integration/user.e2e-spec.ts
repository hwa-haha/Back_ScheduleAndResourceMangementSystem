/**
 * 52200 통합 테스트: user
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('통합 (52200) user', () => {
    let app: INestApplication;
    let authToken: string;
    let dataSource: DataSource;
    let ids: E2EDataIds;

    beforeAll(async () => {
        app = await TestSetup.createTestApp();
        authToken = TestHelpers.createValidJwtToken(app);
        dataSource = app.get<DataSource>(DataSource);
        ids = await e2e데이터ID를준비한다(dataSource);
    });

    afterAll(async () => {
        await TestSetup.closeTestApp(app);
    });

    describe('GET /user/attendance-issues-to-review', () => {
        it('정상: 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/user/attendance-issues-to-review')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /user/confirmed-monthly-report', () => {
        it('정상: year, month로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/user/confirmed-monthly-report')
                .query({ year: ids.year, month: ids.month })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /user/monthly-submitted-snapshots', () => {
        it('정상: year, month로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/user/monthly-submitted-snapshots')
                .query({ year: ids.year, month: ids.month })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /user/monthly-report-existence', () => {
        it('정상: 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/user/monthly-report-existence')
                .query({ year: ids.year, month: ids.month })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });
});
