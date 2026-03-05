/**
 * 52200 통합 테스트: work-hours
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('통합 (52200) work-hours', () => {
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

    describe('GET /work-hours/monthly', () => {
        it('정상: year, month로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/work-hours/monthly')
                .query({ year: ids.year, month: ids.month })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /work-hours/daily', () => {
        it('정상: date(yyyy-MM-dd)로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/work-hours/daily')
                .query({ date: `${ids.year}-${ids.month.padStart(2, '0')}-01` })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
        it('오류: 날짜 형식 잘못 시 400', async () => {
            await request(app.getHttpServer())
                .get('/work-hours/daily')
                .query({ date: 'invalid-date' })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
    });

    describe('GET /work-hours/projects', () => {
        it('정상: 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/work-hours/projects')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /work-hours/wage-calculation-types', () => {
        it('정상: 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/work-hours/wage-calculation-types')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('DELETE /work-hours/work-hours/:id', () => {
        it('오류: 존재하지 않는 ID로 삭제 시 404', async () => {
            await request(app.getHttpServer())
                .delete('/work-hours/work-hours/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });
});
