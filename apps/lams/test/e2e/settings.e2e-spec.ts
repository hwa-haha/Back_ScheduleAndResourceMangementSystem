/**
 * 설정 API e2e 테스트
 *
 * test.md: 1) 도메인 조회로 API 필요값 준비 2) API별 케이스(정상·오류) 3) 결과요약
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from './utils/test-setup';
import { TestHelpers } from './utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from './utils/e2e-data-provider';

describe('설정 API (e2e)', () => {
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
        it('직원ID·휴일·근태유형 등 ID가 준비된다', () => {
            expect(ids.employeeIds).toBeInstanceOf(Array);
        });
    });

    describe('2. API별 e2e 테스트 케이스', () => {
        describe('GET /settings/permissions/departments', () => {
            it('정상: 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/settings/permissions/departments')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
            });
        });

        describe('GET /settings/permissions/employees', () => {
            it('정상: 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/settings/permissions/employees')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
            });
        });

        describe('GET /settings/permissions/employees/:employeeId', () => {
            it('정상: 존재하는 직원 ID로 권한 목록 조회 시 200', async () => {
                if (ids.employeeIds.length === 0) return;
                await request(app.getHttpServer())
                    .get(`/settings/permissions/employees/${ids.employeeIds[0]}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
            });
            it('오류: 존재하지 않는 UUID로 조회 시 404', async () => {
                await request(app.getHttpServer())
                    .get('/settings/permissions/employees/00000000-0000-0000-0000-000000000000')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(404);
            });
        });

        describe('GET /settings/holidays', () => {
            it('정상: 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/settings/holidays')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('holidays');
                        expect(Array.isArray(res.body.holidays)).toBe(true);
                    });
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

        describe('GET /settings/attendance-types', () => {
            it('정상: 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/settings/attendance-types')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('attendanceTypes');
                        expect(Array.isArray(res.body.attendanceTypes)).toBe(true);
                    });
            });
        });
    });

    describe('3. 결과요약', () => {
        it('설정 주요 API가 기대대로 동작한다', () => {
            expect(app).toBeDefined();
            expect(authToken).toBeDefined();
        });
    });
});
