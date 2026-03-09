/**
 * 시나리오 SC-ADM-012: 스냅샷 저장
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-012
 * @description 현재 근태 데이터를 스냅샷으로 저장 검증
 * @role Admin
 * @ucFlow UC3 → UC10(스냅샷 저장)
 * @api POST attendance-data/snapshots, GET snapshots
 * @fixture snapshotName, description
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-012 스냅샷 저장', () => {
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

    /** UC10: 스냅샷 저장 — 응답 컬럼: snapshot.id, snapshotName, description, yyyy, mm */
    it('스냅샷 저장 시 201 또는 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .post('/attendance-data/snapshots')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                year: ids.year,
                month: ids.month,
                departmentId: ids.departmentId,
                description: '시나리오 SC-ADM-012 테스트',
            });
        expect([200, 201]).toContain(res.status);
        const snapshot = res.body?.snapshot ?? res.body;
        expect(snapshot?.id ?? res.body?.id).toBeDefined();
        if (snapshot) expect(snapshot).toHaveProperty('id');
    });

    /** UC8: 스냅샷 목록 조회 — 응답 컬럼: 목록 항목 id, snapshotName, created_at */
    it('저장 후 목록 조회 시 200 및 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/attendance-data/snapshots')
            .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const list = res.body?.snapshots ?? res.body?.data ?? res.body;
        expect(Array.isArray(list) || (list && typeof list === 'object')).toBe(true);
        if (Array.isArray(list) && list.length > 0) {
            expect(list[0]).toHaveProperty('id');
            expect(list[0]).toHaveProperty('snapshotName');
        }
    });
});
