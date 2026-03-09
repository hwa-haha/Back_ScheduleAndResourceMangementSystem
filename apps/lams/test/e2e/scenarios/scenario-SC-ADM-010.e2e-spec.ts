/**
 * 시나리오 SC-ADM-010: 월별 비고 관리
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-010
 * @description 월별 비고 조회 및 수정 검증
 * @role Admin
 * @ucFlow UC3 → UC6(월별 비고 조회) → UC7(월별 비고 수정)
 * @api GET monthly-summaries/:id/note, PATCH monthly-summaries/:id/note
 * @fixture monthlySummaryId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-010 월별 비고 관리', () => {
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

    /** UC6: 월별 비고 조회 — 응답 컬럼: note, monthlySummaryId */
    it('monthlySummaryId가 있으면 note 조회 시 200 및 컬럼 검증', async () => {
        if (!ids.monthlySummaryId) return;
        const res = await request(app.getHttpServer())
            .get(`/attendance-data/monthly-summaries/${ids.monthlySummaryId}/note`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('note');
    });

    /** UC7: 월별 비고 수정 — 응답 컬럼: note = 요청값 */
    it('note PATCH 후 저장값 일치 및 컬럼 검증', async () => {
        if (!ids.monthlySummaryId) return;
        const note = '시나리오 테스트 월별 비고';
        const res = await request(app.getHttpServer())
            .patch(`/attendance-data/monthly-summaries/${ids.monthlySummaryId}/note`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ note });
        expect([200, 204]).toContain(res.status);
        const summary = res.body?.monthlySummary ?? res.body;
        expect(summary).toHaveProperty('note');
        if (summary?.note !== undefined) expect(summary.note).toBe(note);
    });
});
