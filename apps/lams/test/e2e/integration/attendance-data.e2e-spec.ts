/**
 * 52200 통합 테스트: attendance-data
 * - 월간 요약 조회(200/400), 일간 조회(200/404), 스냅샷(404), POST 스냅샷(201/400)
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('통합 (52200) attendance-data', () => {
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

    describe('GET /attendance-data/monthly-summaries', () => {
        it('정상: year, month, departmentId로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/attendance-data/monthly-summaries')
                .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
        it('오류: departmentId 누락 시 400', async () => {
            await request(app.getHttpServer())
                .get('/attendance-data/monthly-summaries')
                .query({ year: ids.year, month: ids.month })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
        it('오류: year 누락 시 400', async () => {
            await request(app.getHttpServer())
                .get('/attendance-data/monthly-summaries')
                .query({ month: ids.month, departmentId: ids.departmentId })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
    });

    describe('GET /attendance-data/daily-summaries/:id', () => {
        it('정상: 존재하는 일간요약 ID로 조회 시 200', async () => {
            if (!ids.dailySummaryId) return;
            await request(app.getHttpServer())
                .get(`/attendance-data/daily-summaries/${ids.dailySummaryId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
        it('오류: 존재하지 않는 UUID로 조회 시 404', async () => {
            await request(app.getHttpServer())
                .get('/attendance-data/daily-summaries/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('GET /attendance-data/snapshots/:id', () => {
        it('오류: 존재하지 않는 스냅샷 UUID로 조회 시 404', async () => {
            await request(app.getHttpServer())
                .get('/attendance-data/snapshots/00000000-0000-0000-0000-000000000000')
                .query({ departmentId: ids.departmentId })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('POST /attendance-data/snapshots', () => {
        it('정상: year, month, departmentId, description으로 저장 시 201', async () => {
            const res = await request(app.getHttpServer())
                .post('/attendance-data/snapshots')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    year: ids.year,
                    month: ids.month,
                    departmentId: ids.departmentId,
                    description: '통합테스트',
                });
            expect([200, 201]).toContain(res.status);
        });
        it('오류: year/month 생략 시 400', async () => {
            await request(app.getHttpServer())
                .post('/attendance-data/snapshots')
                .set('Authorization', `Bearer ${authToken}`)
                .send({})
                .expect(400);
        });
    });

    describe('GET /attendance-data/snapshots', () => {
        it('정상: year, month, departmentId로 목록 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/attendance-data/snapshots')
                .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });
});
