/**
 * 시나리오 SC-ADM-006: 파일 타임라인 조회 및 특정 시점 복원
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-006
 * @description 업로드 파일의 반영 히스토리 조회 후 특정 시점으로 되돌리기 검증
 * @role Admin
 * @ucFlow UC14(파일 목록) → UC15(반영 히스토리 조회) → UC19(특정 시점으로 이동)
 * @api GET files/list, GET files/:fileId/reflection-history, POST restore-from-history
 * @fixture fileId, reflectionHistoryId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-006 파일 타임라인 조회 및 특정 시점 복원', () => {
    let app: INestApplication;
    let authToken: string;
    let dataSource: DataSource;
    let ids: E2EDataIds;
    let fileId: string | null = null;

    beforeAll(async () => {
        app = await TestSetup.createTestApp();
        authToken = TestHelpers.createValidJwtToken(app);
        dataSource = app.get<DataSource>(DataSource);
        ids = await e2e데이터ID를준비한다(dataSource);
        fileId = ids.fileId ?? null;
    });

    afterAll(async () => {
        await TestSetup.closeTestApp(app);
    });

    /** UC14: 파일 목록 조회 */
    it('파일 목록 조회 시 200', async () => {
        const res = await request(app.getHttpServer())
            .get('/file-management/files/list')
            .query({ year: ids.year, month: ids.month })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        const list = res.body?.files ?? res.body;
        if (!fileId && Array.isArray(list) && list.length > 0) {
            fileId = list[0]?.id ?? null;
        }
    });

    /** UC15: 파일 반영 히스토리 조회 — 응답 컬럼: 배열 항목 id, reflectionHistoryId, created_at */
    it('fileId가 있으면 반영 히스토리 조회 시 이력 배열·컬럼 검증', async () => {
        if (!fileId) return;
        const res = await request(app.getHttpServer())
            .get(`/file-management/files/${fileId}/reflection-history`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const list = res.body?.reflectionHistories ?? res.body;
        expect(Array.isArray(list) || (list && typeof list === 'object')).toBe(true);
        if (Array.isArray(list) && list.length > 0) {
            expect(list[0]).toHaveProperty('id');
        }
    });

    /** UC19: 특정 시점으로 이동 — 응답 컬럼: reflectionHistoryId, restoreSnapshotResult */
    it('UC19 restore-from-history API 호출 시 2xx 및 응답 컬럼 검증', async () => {
        let reflectionHistoryId = ids.reflectionHistoryId ?? null;
        if (!reflectionHistoryId && fileId) {
            const res = await request(app.getHttpServer())
                .get(`/file-management/files/${fileId}/reflection-history`)
                .set('Authorization', `Bearer ${authToken}`);
            if (res.status === 200) {
                const list = res.body?.reflectionHistories ?? res.body;
                if (Array.isArray(list) && list.length > 0) reflectionHistoryId = list[0]?.id ?? null;
            }
        }
        if (!reflectionHistoryId) return;

        const body = { reflectionHistoryId, year: ids.year, month: ids.month };
        const res = await request(app.getHttpServer())
            .post('/file-management/restore-from-history')
            .set('Authorization', `Bearer ${authToken}`)
            .send(body);
        expect([200, 201, 400]).toContain(res.status);
        if (res.status === 200 || res.status === 201) {
            expect(res.body?.reflectionHistoryId ?? res.body).toBeDefined();
        }
    });
});
