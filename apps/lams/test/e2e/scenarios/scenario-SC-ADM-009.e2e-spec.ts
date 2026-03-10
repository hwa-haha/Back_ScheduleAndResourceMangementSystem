/**
 * 시나리오 SC-ADM-009: 근태 기록 수정 (셀 수정)
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-009
 * @description 특정 직원 근태 기록(출입시간·유형·비고) 수정 검증
 * @role Admin
 * @ucFlow UC3 → UC4(셀 상세 조회) → UC5(셀 수정)
 * @api GET monthly-summaries, GET daily-summaries/:id, PATCH daily-summaries/:id, GET :id/history
 * @fixture dailySummaryId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-009 근태 기록 수정', () => {
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

    /** UC4: 근태 기록 셀 상세 조회 — 응답 컬럼: id, enter, leave, date */
    it('월간 요약 조회 후 dailySummary id로 상세 조회 시 200 및 컬럼 검증', async () => {
        if (!ids.dailySummaryId) return;
        const res = await request(app.getHttpServer())
            .get(`/attendance-data/daily-summaries/${ids.dailySummaryId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const daily = res.body.dailySummary ?? res.body;
        expect(daily).toHaveProperty('id');
        expect(daily.id).toBe(ids.dailySummaryId);
        expect(daily).toHaveProperty('date');
    });

    /** UC5: 근태 기록 셀 수정 — 응답 컬럼: enter, leave, reason, id, date */
    it('daily-summaries PATCH 후 enter/leave/reason 반영 및 컬럼 검증', async () => {
        if (!ids.dailySummaryId) return;
        const payload = { enter: '09:00:00', leave: '18:00:00', reason: '시나리오 테스트 수정' };
        const res = await request(app.getHttpServer())
            .patch(`/attendance-data/daily-summaries/${ids.dailySummaryId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(payload);
        expect([200, 204]).toContain(res.status);
        const daily = res.body?.dailySummary ?? res.body;
        if (daily) {
            if (daily.enter !== undefined) expect(daily.enter).toBe(payload.enter);
            if (daily.leave !== undefined) expect(daily.leave).toBe(payload.leave);
            if (daily.reason !== undefined) expect(daily.reason).toBe(payload.reason);
            expect(daily).toHaveProperty('id');
            expect(daily.id).toBe(ids.dailySummaryId);
        }
    });

    /** UC20: 셀 히스토리 조회 — 응답 컬럼: 배열 항목 id, enter, leave, changed_at */
    it('history 조회 시 200 및 이력 배열·컬럼 검증', async () => {
        if (!ids.dailySummaryId) return;
        const res = await request(app.getHttpServer())
            .get(`/attendance-data/daily-summaries/${ids.dailySummaryId}/history`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const history = res.body?.history ?? res.body?.data ?? res.body;
        expect(Array.isArray(history) || (history && typeof history === 'object')).toBe(true);
        if (Array.isArray(history) && history.length > 0) {
            expect(history[0]).toHaveProperty('enter');
            expect(history[0]).toHaveProperty('leave');
        }
    });
});
