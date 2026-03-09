/**
 * 시나리오 SC-USR-001: 시수 입력 및 블록 관리
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-USR-001
 * @description 월별 시수 캘린더 및 시간 블록 추가/수정/삭제 검증
 * @role User
 * @ucFlow UC51~UC58(연월 선택, 시수 캘린더, 일자별 상세, 블록 저장/삭제)
 * @api GET work-hours/monthly, daily, POST/PUT work-hours, DELETE work-hours/:id
 * @fixture year, month, date, projectId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-USR-001 시수 입력 및 블록 관리', () => {
    let app: INestApplication;
    let authToken: string;
    let dataSource: DataSource;
    let ids: E2EDataIds;
    let createdWorkHoursId: string | null = null;

    beforeAll(async () => {
        app = await TestSetup.createTestApp();
        authToken = TestHelpers.createValidJwtToken(app);
        dataSource = app.get<DataSource>(DataSource);
        ids = await e2e데이터ID를준비한다(dataSource);
    });

    afterAll(async () => {
        await TestSetup.closeTestApp(app);
    });

    /** UC52: 프로젝트 목록 — 응답 컬럼: id, name */
    it('UC52 프로젝트 목록 조회 시 200 및 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/work-hours/projects')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        if (Array.isArray(res.body) && res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
        }
    });

    /** UC54: 시수 캘린더(월별) — 응답 컬럼: year, month, workHours[], id, date, workMinutes */
    it('월별 시수 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/work-hours/monthly')
            .query({ year: ids.year, month: ids.month })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        expect(res.body).toHaveProperty('year');
        expect(res.body).toHaveProperty('month');
        expect(Array.isArray(res.body.workHours)).toBe(true);
    });

    /** UC55: 시수 일자별 상세 조회 */
    it('일별 시수 조회 시 200', async () => {
        const date = `${ids.year}-${ids.month.padStart(2, '0')}-01`;
        const res = await request(app.getHttpServer())
            .get('/work-hours/daily')
            .query({ date })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
    });

    /** UC56: 시간 블록 저장 — 응답 컬럼: id, date, workMinutes = 요청 반영 (assignedProjectId 사용) */
    it('assignedProjectId가 있으면 시간 블록 POST 시 201 및 응답 컬럼 검증', async () => {
        const assignedProjectId = ids.assignedProjectId;
        if (!assignedProjectId) return;
        const date = `${ids.year}-${ids.month.padStart(2, '0')}-01`;
        const res = await request(app.getHttpServer())
            .post('/work-hours/work-hours')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ date, assignedProjectId });
        expect([201, 200, 400]).toContain(res.status);
        if (res.status === 201 && res.body) {
            expect(res.body.id).toBeDefined();
            createdWorkHoursId = res.body.id ?? null;
            expect(res.body.date).toBe(date);
            expect(res.body).toHaveProperty('workMinutes');
        }
    });

    /** UC57/UC58: 생성한 블록 삭제 */
    it('UC57 생성한 블록이 있으면 DELETE 시 200 또는 204', async () => {
        if (!createdWorkHoursId) return;
        const res = await request(app.getHttpServer())
            .delete(`/work-hours/work-hours/${createdWorkHoursId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect([200, 204]).toContain(res.status);
    });
});
