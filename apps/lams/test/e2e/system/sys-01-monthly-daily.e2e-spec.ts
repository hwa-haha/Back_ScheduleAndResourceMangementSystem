/**
 * 52300 시스템 테스트 SYS-01: 월간 요약 조회 후 일간 수정
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('시스템 (52300) SYS-01 월간 요약 조회 후 일간 수정', () => {
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

    it('단계1: 월간 요약 조회 200', async () => {
        await request(app.getHttpServer())
            .get('/attendance-data/monthly-summaries')
            .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
    });

    it('단계2·3: 일간 요약 조회 후 수정 200', async () => {
        if (!ids.dailySummaryId) return;
        await request(app.getHttpServer())
            .get(`/attendance-data/daily-summaries/${ids.dailySummaryId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        await request(app.getHttpServer())
            .patch(`/attendance-data/daily-summaries/${ids.dailySummaryId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ enter: '09:00:00', leave: '18:00:00', note: 'SYS-01' })
            .expect(200);
    });
});
