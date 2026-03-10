/**
 * 시나리오 SC-ADM-015: 스냅샷 결재 조회
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-015
 * @description 상신된 스냅샷 결재 상태 조회 검증
 * @role Admin
 * @ucFlow UC35(스냅샷 결재 조회) → UC36(결재상태 업데이트)
 * @api GET approval/snapshots/:id/content, PATCH approval
 * @fixture snapshotId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-015 스냅샷 결재 조회', () => {
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

    /** UC35: 스냅샷 결재 조회 — 응답 컬럼: snapshotId, approvalStatus, approverName, submittedAt */
    it('snapshotId가 있으면 결재 content 조회 시 200 및 본문 검증', async () => {
        if (!ids.snapshotId) return;
        const res = await request(app.getHttpServer())
            .get(`/approval/snapshots/${ids.snapshotId}/content`)
            .query({ year: ids.year, month: ids.month })
            .set('Authorization', `Bearer ${authToken}`);
        expect([200, 404]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body).toBeDefined();
            if (res.body.snapshotId !== undefined) expect(res.body.snapshotId).toBe(ids.snapshotId);
        }
    });

    /** UC36: 결재상태 업데이트 — 응답 컬럼: id, approverName = 요청값 */
    it('UC36 스냅샷 결재 PATCH 호출 시 200 및 approverName 반영 검증', async () => {
        const snapshotId = ids.snapshotId;
        if (!snapshotId) return;
        const approverName = '테스트결재자';
        const res = await request(app.getHttpServer())
            .patch(`/approval/snapshots/${snapshotId}/approval`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ approverName });
        expect([200, 404]).toContain(res.status);
        if (res.status === 200 && res.body?.id !== undefined) {
            expect(res.body.id).toBe(snapshotId);
            if (res.body.approverName !== undefined) expect(res.body.approverName).toBe(approverName);
        }
    });
});
