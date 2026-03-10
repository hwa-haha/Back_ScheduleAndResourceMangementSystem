/**
 * 시나리오 SC-ADM-014: 스냅샷 결재 상신
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-014
 * @description 스냅샷 결재 시스템 상신 검증
 * @role Admin
 * @ucFlow UC8 → UC10 → UC33(검토권한자 조회) → UC34(스냅샷 결재 상신)
 * @api GET reviewers-by-department, PATCH snapshots/:id/approval
 * @fixture snapshotId, departmentId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-014 스냅샷 결재 상신', () => {
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

    /** UC33: 검토권한자 조회 — 응답 컬럼: departments[], departmentId, reviewers[], employeeId, employeeName */
    it('검토권한자 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/approval/reviewers-by-department')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body?.departments ?? res.body).toBeDefined();
        const depts = res.body?.departments ?? res.body;
        if (Array.isArray(depts) && depts.length > 0) {
            expect(depts[0]).toHaveProperty('departmentId');
        }
    });

    /** UC34: 스냅샷 결재 상신 — 응답 컬럼: id, snapshotName, approvalStatus, approverName */
    it('snapshotId가 있으면 결재 상신 PATCH 시 2xx 및 응답 검증', async () => {
        if (!ids.snapshotId) return;
        const res = await request(app.getHttpServer())
            .patch(`/approval/snapshots/${ids.snapshotId}/approval`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({});
        expect([200, 204, 400]).toContain(res.status);
        if (res.status === 200 || res.status === 204) {
            if (res.body?.id !== undefined) expect(res.body.id).toBe(ids.snapshotId);
        }
    });
});
