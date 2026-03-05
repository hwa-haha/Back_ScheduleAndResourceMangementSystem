/**
 * 52200 통합 테스트: dashboard
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('통합 (52200) dashboard', () => {
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

    describe('GET /dashboard/department/monthly-average-work-hours', () => {
        it('정상: year, departmentId로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/dashboard/department/monthly-average-work-hours')
                .query({ year: ids.year, departmentId: ids.departmentId })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /dashboard/department/monthly-employee-work-hours', () => {
        it('정상: year, month, departmentId로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/dashboard/department/monthly-employee-work-hours')
                .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /dashboard/department/monthly-employee-attendance', () => {
        it('정상: year, month, departmentId로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/dashboard/department/monthly-employee-attendance')
                .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /dashboard/department/snapshots', () => {
        it('정상: year, month, departmentId로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/dashboard/department/snapshots')
                .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /dashboard/employee/attendance-detail', () => {
        it('정상: employeeId, year, month로 조회 시 200', async () => {
            const employeeId = ids.employeeIds?.[0] ?? '839e6f06-8d44-43a1-948c-095253c4cf8c';
            await request(app.getHttpServer())
                .get('/dashboard/employee/attendance-detail')
                .query({ employeeId, year: ids.year, month: ids.month })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });
});
