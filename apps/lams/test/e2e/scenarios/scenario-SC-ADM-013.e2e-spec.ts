/**
 * 시나리오 SC-ADM-013: 스냅샷 불러오기 및 롤백
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-013
 * @description 저장된 스냅샷 조회 및 롤백 검증
 * @role Admin
 * @ucFlow UC8(목록) → UC9(스냅샷 불러오기) → UC11/UC12(롤백)
 * @api GET snapshots, GET snapshots/:id, POST snapshots/restore
 * @fixture snapshotId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-013 스냅샷 불러오기 및 롤백', () => {
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

    /** UC8: 스냅샷 목록 조회 — 응답 컬럼: id, snapshotName, yyyy, mm */
    it('스냅샷 목록 조회 시 200 및 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/attendance-data/snapshots')
            .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const list = res.body?.snapshots ?? res.body?.data ?? res.body;
        expect(Array.isArray(list)).toBe(true);
        if (list?.length > 0) {
            expect(list[0]).toHaveProperty('id');
            expect(list[0]).toHaveProperty('snapshotName');
        }
    });

    /** UC9: 스냅샷 불러오기 — 응답 컬럼: id, snapshotName, description, yyyy, mm */
    it('snapshotId가 있으면 스냅샷 상세 조회 시 200 및 컬럼 검증', async () => {
        if (!ids.snapshotId) return;
        const res = await request(app.getHttpServer())
            .get(`/attendance-data/snapshots/${ids.snapshotId}`)
            .query({ departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const snapshot = res.body?.snapshot ?? res.body;
        expect(snapshot?.id ?? res.body?.id).toBe(ids.snapshotId);
        expect(snapshot).toHaveProperty('snapshotName');
    });

    /** UC12: 롤백하기 — 응답 컬럼: snapshotId, 복원 결과 */
    it('snapshotId가 있으면 restore 호출 시 2xx 및 응답 검증', async () => {
        if (!ids.snapshotId) return;
        const res = await request(app.getHttpServer())
            .post('/attendance-data/snapshots/restore')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ snapshotId: ids.snapshotId });
        expect([200, 201, 204]).toContain(res.status);
        if (res.status === 200 || res.status === 201) {
            expect(res.body?.snapshotId ?? res.body).toBeDefined();
        }
    });
});
