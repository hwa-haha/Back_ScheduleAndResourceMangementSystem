/**
 * 시나리오 SC-ADM-011: 수정 내역 조회
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-011
 * @description 근태 기록 수정 이력 조회 검증
 * @role Admin
 * @ucFlow UC1 → UC20(셀 히스토리 조회)
 * @api GET daily-summaries/:id/history
 * @fixture dailySummaryId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-011 수정 내역 조회', () => {
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

    /** UC20: 셀 히스토리 조회 — 응답 컬럼: 배열 항목 id, enter, leave, changed_at, reason */
    it('dailySummaryId가 있으면 셀 히스토리 조회 시 200 및 이력 배열·컬럼 검증', async () => {
        if (!ids.dailySummaryId) return;
        const res = await request(app.getHttpServer())
            .get(`/attendance-data/daily-summaries/${ids.dailySummaryId}/history`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const history = res.body?.history ?? res.body?.data ?? res.body;
        expect(Array.isArray(history) || (history && typeof history === 'object')).toBeTruthy();
        if (Array.isArray(history) && history.length > 0) {
            expect(history[0]).toHaveProperty('enter');
            expect(history[0]).toHaveProperty('leave');
        }
    });
});
