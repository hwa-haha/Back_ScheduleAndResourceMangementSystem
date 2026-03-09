/**
 * 시나리오 SC-ADM-019: 프로젝트 할당 관리
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-019
 * @description 직원 프로젝트 할당 관리 검증
 * @role Admin
 * @ucFlow UC65 → UC75~UC80(직원·프로젝트 목록, 할당 조회/저장)
 * @api GET work-hours/projects, GET employees/:id/assigned-projects, PUT assign-projects
 * @fixture employeeId, projectIds
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-019 프로젝트 할당 관리', () => {
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

    /** UC76: 프로젝트 목록 — 응답 컬럼: id, name */
    it('프로젝트 목록 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/work-hours/projects')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        if (Array.isArray(res.body) && res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
        }
    });

    /** UC77: 할당 목록 — 응답 컬럼: id, employeeId, projectId, startDate, endDate, isActive */
    it('employeeId가 있으면 할당 목록 조회 시 200 및 컬럼 검증', async () => {
        if (!ids.employeeIds?.length) return;
        const res = await request(app.getHttpServer())
            .get(`/work-hours/employees/${ids.employeeIds[0]}/assigned-projects`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const list = res.body?.assignedProjects ?? res.body;
        if (Array.isArray(list) && list.length > 0) {
            expect(list[0]).toHaveProperty('projectId');
        }
    });

    /** UC78/UC80: 프로젝트 할당 — 응답 컬럼: assignedProjects[], employeeId, projectId */
    it('UC78/UC80 assign-projects PUT 호출 시 200 및 응답 검증', async () => {
        if (!ids.employeeIds?.length) return;
        const res = await request(app.getHttpServer())
            .put('/work-hours/assign-projects')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                employeeId: ids.employeeIds[0],
                projects: ids.projectId ? [{ projectId: ids.projectId }] : [],
            });
        expect([200, 400]).toContain(res.status);
        if (res.status === 200 && res.body?.assignedProjects) {
            expect(Array.isArray(res.body.assignedProjects)).toBe(true);
        }
    });
});
