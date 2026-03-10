/**
 * 52200 통합 테스트: organization-management (401/200)
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';

describe('통합 (52200) organization-management', () => {
    let app: INestApplication;
    let authToken: string;
    const yearMonth = { year: '2026', month: '01' };

    beforeAll(async () => {
        app = await TestSetup.createTestApp();
        authToken = TestHelpers.createValidJwtToken(app);
    });

    afterAll(async () => {
        await TestSetup.closeTestApp(app);
    });

    describe('GET /organization-management/departments', () => {
        it('오류: 토큰 없이 호출 시 401', async () => {
            await request(app.getHttpServer())
                .get('/organization-management/departments')
                .query(yearMonth)
                .expect(401);
        });
        it('정상: Bearer 토큰과 year, month로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/organization-management/departments')
                .query(yearMonth)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /organization-management/departments/by-access-permission', () => {
        it('오류: 토큰 없이 호출 시 401', async () => {
            await request(app.getHttpServer())
                .get('/organization-management/departments/by-access-permission')
                .query(yearMonth)
                .expect(401);
        });
        it('정상: Bearer 토큰과 year, month로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/organization-management/departments/by-access-permission')
                .query(yearMonth)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });
});
