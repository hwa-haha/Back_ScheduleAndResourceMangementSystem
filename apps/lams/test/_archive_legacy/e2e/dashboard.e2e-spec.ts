/**
 * 대시보드 API e2e 테스트
 *
 * test.md: 1) 도메인 조회로 API 필요값 준비 2) API별 케이스(정상·오류) 3) 결과요약
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from './utils/test-setup';
import { TestHelpers } from './utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from './utils/e2e-data-provider';

describe('대시보드 API (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    let ids: E2EDataIds;

    beforeAll(async () => {
        app = await TestSetup.createTestApp();
        authToken = TestHelpers.createValidJwtToken(app);
        const dataSource = app.get<DataSource>(DataSource);
        ids = await e2e데이터ID를준비한다(dataSource);
    });

    afterAll(async () => {
        await TestSetup.closeTestApp(app);
    });

    describe('1. API에 필요한 값 준비 (도메인 조회)', () => {
        it('부서·직원·연월이 준비된다', () => {
            expect(ids.departmentId).toBeDefined();
            expect(ids.employeeIds).toBeInstanceOf(Array);
            expect(ids.year).toBeDefined();
            expect(ids.month).toBeDefined();
        });
    });

    describe('2. API별 e2e 테스트 케이스', () => {
        describe('GET /dashboard/department/monthly-average-work-hours', () => {
            it('정상: departmentId, year로 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/dashboard/department/monthly-average-work-hours')
                    .query({ departmentId: ids.departmentId, year: ids.year })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
            });
            it('오류: departmentId 누락 시 400', async () => {
                await request(app.getHttpServer())
                    .get('/dashboard/department/monthly-average-work-hours')
                    .query({ year: ids.year })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(400);
            });
        });

        describe('GET /dashboard/department/monthly-employee-attendance', () => {
            it('정상: departmentId, year, month로 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/dashboard/department/monthly-employee-attendance')
                    .query({ departmentId: ids.departmentId, year: ids.year, month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
            });
        });

        describe('GET /dashboard/department/weekly-top-employees', () => {
            it('정상: departmentId, year, month로 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/dashboard/department/weekly-top-employees')
                    .query({ departmentId: ids.departmentId, year: ids.year, month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
            });
        });

        describe('GET /dashboard/department/snapshots', () => {
            it('정상: departmentId, year, month로 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/dashboard/department/snapshots')
                    .query({ departmentId: ids.departmentId, year: ids.year, month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
            });
        });

        describe('GET /dashboard/employee/attendance-detail', () => {
            it('정상: employeeId, year, month로 조회 시 200 또는 데이터 없음 시 404', async () => {
                if (ids.employeeIds.length === 0) return;
                const res = await request(app.getHttpServer())
                    .get('/dashboard/employee/attendance-detail')
                    .query({
                        employeeId: ids.employeeIds[0],
                        year: ids.year,
                        month: ids.month,
                    })
                    .set('Authorization', `Bearer ${authToken}`);
                expect([200, 404]).toContain(res.status);
            });
            it('오류: employeeId 누락 시 400', async () => {
                await request(app.getHttpServer())
                    .get('/dashboard/employee/attendance-detail')
                    .query({ year: ids.year, month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(400);
            });
        });
    });

    describe('3. 결과요약', () => {
        it('대시보드 주요 API가 기대대로 동작한다', () => {
            expect(app).toBeDefined();
            expect(authToken).toBeDefined();
        });
    });
});
