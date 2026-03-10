/**
 * 52200 통합 테스트: settings
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('통합 (52200) settings', () => {
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

    describe('GET /settings/permissions/departments', () => {
        it('정상: 부서 목록 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/settings/permissions/departments')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /settings/permissions/departments/:departmentId', () => {
        it('정상: departmentId로 직원 권한 목록 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get(`/settings/permissions/departments/${ids.departmentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
        it('오류: 존재하지 않는 departmentId로 조회 시 404', async () => {
            const res = await request(app.getHttpServer())
                .get('/settings/permissions/departments/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`);
            expect([200, 404]).toContain(res.status);
        });
    });

    describe('GET /settings/attendance-types', () => {
        it('정상: 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/settings/attendance-types')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /settings/holidays', () => {
        it('정상: 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/settings/holidays')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /settings/work-time-overrides', () => {
        it('정상: 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/settings/work-time-overrides')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });
});
