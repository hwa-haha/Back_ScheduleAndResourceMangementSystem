/**
 * 시나리오 SC-ADM-022: 근태 조회 팝업 실행
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-022
 * @description 팝업으로 근태 조회(URL 파라미터 기반) 검증
 * @role Admin
 * @ucFlow UC84 → UC85(파라미터 기반 조회) — 동일 monthly-summaries API 사용
 * @api GET attendance-data/monthly-summaries
 * @fixture year, month, departmentId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-022 근태 조회 팝업 실행', () => {
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

    /** UC84/UC85: 근태 조회 팝업 — 응답 컬럼: monthlySummaries[].yyyymm, dailySummaries */
    it('파라미터로 monthly-summaries 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/attendance-data/monthly-summaries')
            .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body.monthlySummaries).toBeDefined();
        expect(Array.isArray(res.body.monthlySummaries)).toBe(true);
        if (res.body.monthlySummaries.length > 0) {
            expect(res.body.monthlySummaries[0]).toHaveProperty('yyyymm');
            expect(res.body.monthlySummaries[0].yyyymm).toMatch(new RegExp(`^${ids.year}-${ids.month.padStart(2, '0')}`));
        }
    });
});
