/**
 * 52300 시스템 테스트 SYS-04: 권한/미인증
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('시스템 (52300) SYS-04 권한/미인증', () => {
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

    it('토큰 없이 by-access-permission 호출 시 401', async () => {
        await request(app.getHttpServer())
            .get('/organization-management/departments/by-access-permission')
            .expect(401);
    });

    it('Bearer 토큰으로 부서 권한 목록 조회 시 200', async () => {
        await request(app.getHttpServer())
            .get(`/settings/permissions/departments/${ids.departmentId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
    });
});
