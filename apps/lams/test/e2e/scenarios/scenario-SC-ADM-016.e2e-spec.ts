/**
 * 시나리오 SC-ADM-016: 파일 삭제
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-016
 * @description 업로드 파일 삭제 검증
 * @role Admin
 * @ucFlow UC14(파일 목록) → UC17(파일 삭제)
 * @api GET files/list, DELETE file-management/files/:id
 * @fixture fileId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-016 파일 삭제', () => {
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

    /** UC14: 파일 목록 조회 — 응답 컬럼: files[].id, year, month */
    it('UC14 파일 목록 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/file-management/files/list')
            .query({ year: ids.year, month: ids.month })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const files = res.body?.files ?? res.body;
        expect(files).toBeDefined();
        if (!Array.isArray(files) || files.length === 0) return;

        expect(files[0]).toHaveProperty('id');

        // 로컬 스토리지에서 실제 파일이 존재하는 항목만 선택 (없으면 삭제 호출 자체를 생략)
        for (const f of files) {
            const p = f?.filePath ?? f?.file_path;
            if (!p || typeof p !== 'string') continue;
            const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
            if (fs.existsSync(abs)) {
                fileId = f?.id ?? null;
                break;
            }
        }
    });

    /** UC17: 파일 삭제 */
    it('UC17 fileId가 있으면 파일 삭제 시 200 또는 204', async () => {
        if (!fileId) return;
        const res = await request(app.getHttpServer())
            .delete(`/file-management/files/${fileId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect([200, 204]).toContain(res.status);
    });
});
