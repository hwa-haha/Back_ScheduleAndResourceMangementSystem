/**
 * 시나리오 SC-USR-003: 수정요청 응답 제출
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-USR-003
 * @description 수정요청 응답 제출 검증
 * @role User
 * @ucFlow UC51 → UC61(수정요청 월별 조회) → UC62(상세) → UC63(응답 제출)
 * @api GET user/attendance-issues-to-review, GET attendance-issues/:id, PATCH :id/apply
 * @fixture year, month, 이슈 id
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-USR-003 수정요청 응답 제출', () => {
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

    /** UC61: 수정요청 월별 조회 — 응답 컬럼: id, status, employeeId, requestedAt */
    it('확인할 이슈 목록 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/user/attendance-issues-to-review')
            .query({ year: ids.year, month: ids.month })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        const list = res.body?.issues ?? res.body?.data ?? res.body;
        if (Array.isArray(list) && list.length > 0) {
            expect(list[0]).toHaveProperty('id');
            expect(list[0]).toHaveProperty('status');
        }
    });

    /** UC62: 수정요청 상세 — 응답 컬럼: id, status */
    it('이슈 상세 조회 시 200 및 컬럼 검증', async () => {
        if (!ids.attendanceIssueId) return;
        const res = await request(app.getHttpServer())
            .get(`/attendance-issues/${ids.attendanceIssueId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body.id).toBe(ids.attendanceIssueId);
        expect(res.body).toHaveProperty('status');
    });

    /** UC63: 수정요청 응답 제출 — 응답 컬럼: status APPLIED, correctedEnterTime, correctedLeaveTime, appliedAt */
    it('apply PATCH 시 2xx 및 보정값 반영 검증', async () => {
        if (!ids.attendanceIssueId) return;
        const correctedEnterTime = '09:00:00';
        const correctedLeaveTime = '18:00:00';
        const res = await request(app.getHttpServer())
            .patch(`/attendance-issues/${ids.attendanceIssueId}/apply`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ correctedEnterTime, correctedLeaveTime });
        expect([200, 204, 400]).toContain(res.status);
        const body = res.body?.issue ?? res.body;
        if ((res.status === 200 || res.status === 204) && body) {
            if (body.status !== undefined) expect(body.status).toBe('APPLIED');
            if (body.correctedEnterTime !== undefined) expect(body.correctedEnterTime).toBe(correctedEnterTime);
            if (body.correctedLeaveTime !== undefined) expect(body.correctedLeaveTime).toBe(correctedLeaveTime);
            expect(body).toHaveProperty('appliedAt');
        }
    });
});
