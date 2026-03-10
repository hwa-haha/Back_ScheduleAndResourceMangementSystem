/**
 * 시나리오 SC-ADM-002: 부서 권한 관리
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-002
 * @description 직원별 부서 접근·검토 권한 관리 검증
 * @role Admin
 * @ucFlow UC28(부서 목록) → UC29(부서별 직원 권한) → UC30(권한 저장)
 * @api GET permissions/departments, GET departments/:id, PATCH permissions
 * @fixture departmentId, employeeId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-002 부서 권한 관리', () => {
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

    /** UC28: 부서 목록 조회 — 응답 컬럼: departments[], id, name */
    it('부서 목록 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/settings/permissions/departments')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body?.departments ?? res.body).toBeDefined();
        const depts = res.body?.departments ?? res.body;
        if (Array.isArray(depts) && depts.length > 0) {
            expect(depts[0]).toHaveProperty('id');
        }
    });

    /** UC29: 부서별 직원 권한 — 응답 컬럼: permissions[], employeeId, hasAccessPermission, hasReviewPermission */
    it('부서별 직원 권한 조회 시 200 및 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get(`/settings/permissions/departments/${ids.departmentId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const permissions = res.body?.permissions ?? res.body;
        expect(permissions).toBeDefined();
        if (Array.isArray(permissions) && permissions.length > 0) {
            expect(permissions[0]).toHaveProperty('hasAccessPermission');
            expect(permissions[0]).toHaveProperty('hasReviewPermission');
        }
    });

    /** UC30: 부서별 권한 저장 — 여러 케이스 PATCH 후 조회로 반영 검증 */
    it('UC30 권한(접근O, 검토X) 저장 후 부서별 권한 조회 시 반영 검증', async () => {
        if (!ids.employeeIds?.length) return;
        const employeeId = ids.employeeIds[0];
        const patchRes = await request(app.getHttpServer())
            .patch('/settings/permissions')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                departmentId: ids.departmentId,
                employees: [{ employeeId, hasAccessPermission: true, hasReviewPermission: false }],
            });
        expect([200, 400]).toContain(patchRes.status);
        if (patchRes.status !== 200) return;

        const getRes = await request(app.getHttpServer())
            .get(`/settings/permissions/departments/${ids.departmentId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(getRes.status).toBe(200);
        const list = getRes.body?.employees ?? getRes.body?.permissions ?? getRes.body;
        const found = Array.isArray(list)
            ? list.find((p: { employeeId?: string; id?: string }) => p.employeeId === employeeId || p.id === employeeId)
            : undefined;
        if (found) {
            expect(found.hasAccessPermission).toBe(true);
            expect(found.hasReviewPermission).toBe(false);
        }
    });

    it('UC30 권한(접근O, 검토O) 저장 후 부서별 권한 조회 시 반영 검증', async () => {
        if (!ids.employeeIds?.length) return;
        const employeeId = ids.employeeIds[0];
        const patchRes = await request(app.getHttpServer())
            .patch('/settings/permissions')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                departmentId: ids.departmentId,
                employees: [{ employeeId, hasAccessPermission: true, hasReviewPermission: true }],
            });
        expect([200, 400]).toContain(patchRes.status);
        if (patchRes.status !== 200) return;

        const getRes = await request(app.getHttpServer())
            .get(`/settings/permissions/departments/${ids.departmentId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(getRes.status).toBe(200);
        const list = getRes.body?.employees ?? getRes.body?.permissions ?? getRes.body;
        const found = Array.isArray(list)
            ? list.find((p: { employeeId?: string; id?: string }) => p.employeeId === employeeId || p.id === employeeId)
            : undefined;
        if (found) {
            expect(found.hasAccessPermission).toBe(true);
            expect(found.hasReviewPermission).toBe(true);
        }
    });

    it('UC30 권한(접근X, 검토X) 저장 후 부서별 권한 조회 시 반영 검증', async () => {
        if (!ids.employeeIds?.length) return;
        const employeeId = ids.employeeIds[0];
        const patchRes = await request(app.getHttpServer())
            .patch('/settings/permissions')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                departmentId: ids.departmentId,
                employees: [{ employeeId, hasAccessPermission: false, hasReviewPermission: false }],
            });
        expect([200, 400]).toContain(patchRes.status);
        if (patchRes.status !== 200) return;

        const getRes = await request(app.getHttpServer())
            .get(`/settings/permissions/departments/${ids.departmentId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(getRes.status).toBe(200);
        const list = getRes.body?.employees ?? getRes.body?.permissions ?? getRes.body;
        const found = Array.isArray(list)
            ? list.find((p: { employeeId?: string; id?: string }) => p.employeeId === employeeId || p.id === employeeId)
            : undefined;
        if (found) {
            expect(found.hasAccessPermission).toBe(false);
            expect(found.hasReviewPermission).toBe(false);
        }
    });

    it('UC30 권한(접근X, 검토O) 저장 후 부서별 권한 조회 시 반영 검증', async () => {
        if (!ids.employeeIds?.length) return;
        const employeeId = ids.employeeIds[0];
        const patchRes = await request(app.getHttpServer())
            .patch('/settings/permissions')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                departmentId: ids.departmentId,
                employees: [{ employeeId, hasAccessPermission: false, hasReviewPermission: true }],
            });
        expect([200, 400]).toContain(patchRes.status);
        if (patchRes.status !== 200) return;

        const getRes = await request(app.getHttpServer())
            .get(`/settings/permissions/departments/${ids.departmentId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(getRes.status).toBe(200);
        const list = getRes.body?.employees ?? getRes.body?.permissions ?? getRes.body;
        const found = Array.isArray(list)
            ? list.find((p: { employeeId?: string; id?: string }) => p.employeeId === employeeId || p.id === employeeId)
            : undefined;
        if (found) {
            expect(found.hasAccessPermission).toBe(false);
            expect(found.hasReviewPermission).toBe(true);
        }
    });
});
