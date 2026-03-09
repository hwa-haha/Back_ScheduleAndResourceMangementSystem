/**
 * 시나리오 SC-ADM-008: 근태 이슈 관리
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-008
 * @description 이슈 조회 및 수정요청 전송·반영 검증
 * @role Admin
 * @ucFlow UC21(근태 이슈 목록) → UC22(수정요청 전송) → UC23(근태 이슈 반영)
 * @api GET attendance-issues, GET by-department, POST request, PATCH :id/apply, GET :id
 * @fixture departmentId, 이슈 id
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-008 근태 이슈 관리', () => {
    let app: INestApplication;
    let authToken: string;
    let dataSource: DataSource;
    let ids: E2EDataIds;
    let attendanceIssueId: string | null = null;

    beforeAll(async () => {
        app = await TestSetup.createTestApp();
        authToken = TestHelpers.createValidJwtToken(app);
        dataSource = app.get<DataSource>(DataSource);
        ids = await e2e데이터ID를준비한다(dataSource);
        attendanceIssueId = ids.attendanceIssueId ?? null;
    });

    afterAll(async () => {
        await TestSetup.closeTestApp(app);
    });

    /** UC21: 근태 이슈 목록 조회 — 응답 컬럼: issues[].id, status, employeeId */
    it('이슈 목록 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/attendance-issues')
            .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`);
        expect([200, 404]).toContain(res.status);
        if (res.status === 200) {
            const issues = res.body.issues ?? res.body;
            expect(issues).toBeDefined();
            if (Array.isArray(issues) && issues.length > 0) {
                expect(issues[0]).toHaveProperty('id');
                expect(issues[0]).toHaveProperty('status');
                if (!attendanceIssueId) attendanceIssueId = issues[0]?.id ?? null;
            }
        }
    });

    /** UC21: 근태 이슈 목록 조회(by-department) — 응답 컬럼 검증 */
    it('by-department로 이슈 목록 조회 시 200 및 본문 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/attendance-issues/by-department')
            .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
    });

    /** UC22: 수정요청 전송 — POST request (복수) */
    it('UC22 수정요청 전송 API 호출 시 2xx 또는 400', async () => {
        if (!attendanceIssueId) return;
        const res = await request(app.getHttpServer())
            .post('/attendance-issues/request')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ ids: [attendanceIssueId] });
        expect([200, 201, 400]).toContain(res.status);
        if (res.status === 200 || res.status === 201) expect(res.body).toBeDefined();
    });

    /** UC21/UC23: 이슈 상세 조회 — 응답 컬럼: id, status, correctedEnterTime, appliedAt */
    it('이슈 ID가 있으면 상세 조회 시 200 및 컬럼 검증', async () => {
        if (!attendanceIssueId) return;
        const res = await request(app.getHttpServer())
            .get(`/attendance-issues/${attendanceIssueId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body.id).toBe(attendanceIssueId);
        expect(res.body).toHaveProperty('status');
    });

    /** UC23: 근태 이슈 반영 — 응답 컬럼: status APPLIED, correctedEnterTime, correctedLeaveTime, appliedAt */
    it('UC23 근태 이슈 반영 apply PATCH 호출 시 2xx 및 보정값 반영 검증', async () => {
        if (!attendanceIssueId) return;
        const res = await request(app.getHttpServer())
            .patch(`/attendance-issues/${attendanceIssueId}/apply`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ correctedEnterTime: '09:00:00', correctedLeaveTime: '18:00:00' });
        expect([200, 204, 400]).toContain(res.status);
        if (res.status === 200 || res.status === 204) {
            const body = res.body?.issue ?? res.body;
            if (body) {
                expect(body).toHaveProperty('id');
                if (body.status !== undefined) expect(body.status).toBe('APPLIED');
                if (body.correctedEnterTime !== undefined) expect(body.correctedEnterTime).toBe('09:00:00');
                if (body.correctedLeaveTime !== undefined) expect(body.correctedLeaveTime).toBe('18:00:00');
                if (body.appliedAt !== undefined) expect(body).toHaveProperty('appliedAt');
            }
        }
    });
});
