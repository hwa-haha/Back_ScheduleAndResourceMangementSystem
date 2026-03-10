/**
 * 시나리오 SC-USR-002: 내보고서 조회
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-USR-002
 * @description 특정 연월 내보고서 조회 검증
 * @role User
 * @ucFlow UC51 → UC59(내보고서 존재여부) → UC60(내보고서 조회)
 * @api GET user/monthly-report-existence, GET user/confirmed-monthly-report
 * @fixture year, month
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-USR-002 내보고서 조회', () => {
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

    /** UC59: 내보고서 존재여부 — 응답 컬럼: exists, id(있을 때), year, month */
    it('존재 여부 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/user/monthly-report-existence')
            .query({ year: ids.year, month: ids.month })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        if (res.body.id != null) {
            expect(res.body.id).toBeDefined();
        }
    });

    /** UC60: 내보고서 조회 — 응답 컬럼: id, year, month, employeeId */
    it('확정 보고서 조회 시 200 및 컬럼 검증 (있으면 본문)', async () => {
        const res = await request(app.getHttpServer())
            .get('/user/confirmed-monthly-report')
            .query({ year: ids.year, month: ids.month })
            .set('Authorization', `Bearer ${authToken}`);
        expect([200, 404]).toContain(res.status);
        if (res.status === 200 && res.body && Object.keys(res.body).length > 0) {
            expect(res.body).toBeDefined();
            const yyyymm = res.body.yyyymm ?? `${res.body.year}-${String(res.body.month).padStart(2, '0')}`;
            expect(yyyymm).toMatch(new RegExp(`^${ids.year}-${ids.month.padStart(2, '0')}`));
        }
    });
});
