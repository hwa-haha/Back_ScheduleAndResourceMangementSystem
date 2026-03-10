/**
 * 52300 시스템 테스트 SYS-05: 파일 목록·반영 이력 조회
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('시스템 (52300) SYS-05 파일 업로드→반영→이력 조회', () => {
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

    it('파일 목록 조회 200', async () => {
        await request(app.getHttpServer())
            .get('/file-management/files/list')
            .query({ year: ids.year, month: ids.month })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
    });

    it('파일 ID가 있으면 반영 이력 조회 200', async () => {
        if (!ids.fileId) return;
        await request(app.getHttpServer())
            .get(`/file-management/files/${ids.fileId}/reflection-history`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
    });
});
