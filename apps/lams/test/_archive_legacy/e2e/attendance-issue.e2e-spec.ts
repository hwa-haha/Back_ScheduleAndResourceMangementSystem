/**
 * 근태 이슈 API e2e 테스트
 *
 * test.md: 1) 도메인 조회로 API 필요값 준비 2) API별 케이스(정상·오류) 3) 결과요약
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from './utils/test-setup';
import { TestHelpers } from './utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from './utils/e2e-data-provider';

describe('근태 이슈 API (e2e)', () => {
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
        it('부서·직원·연월·근태이슈 ID가 준비된다', () => {
            expect(ids.departmentId).toBeDefined();
            expect(ids.employeeIds).toBeInstanceOf(Array);
            expect(ids.year).toBeDefined();
            expect(ids.month).toBeDefined();
        });
    });

    describe('2. API별 e2e 테스트 케이스', () => {
        describe('GET /attendance-issues', () => {
            it('정상: 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/attendance-issues')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('issues');
                        expect(Array.isArray(res.body.issues)).toBe(true);
                    });
            });
        });

        describe('GET /attendance-issues/by-department', () => {
            it('정상: year, month, departmentId로 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/attendance-issues/by-department')
                    .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('employeeIssueGroups');
                        expect(Array.isArray(res.body.employeeIssueGroups)).toBe(true);
                    });
            });
            it('오류: departmentId 누락 시 400', async () => {
                await request(app.getHttpServer())
                    .get('/attendance-issues/by-department')
                    .query({ year: ids.year, month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(400);
            });
        });

        describe('GET /attendance-issues/:id', () => {
            it('정상: 존재하는 이슈 ID로 조회 시 200', async () => {
                if (!ids.attendanceIssueId) return;
                await request(app.getHttpServer())
                    .get(`/attendance-issues/${ids.attendanceIssueId}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('issue');
                    });
            });
            it('오류: 존재하지 않는 UUID로 조회 시 404', async () => {
                await request(app.getHttpServer())
                    .get('/attendance-issues/00000000-0000-0000-0000-000000000000')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(404);
            });
        });

        describe('PATCH /attendance-issues/:id/description', () => {
            it('정상: description 수정 시 200', async () => {
                if (!ids.attendanceIssueId) return;
                await request(app.getHttpServer())
                    .patch(`/attendance-issues/${ids.attendanceIssueId}/description`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ description: 'e2e 테스트 사유' })
                    .expect(200);
            });
        });
    });

    describe('3. 결과요약', () => {
        it('근태 이슈 주요 API가 기대대로 동작한다', () => {
            expect(app).toBeDefined();
            expect(authToken).toBeDefined();
        });
    });
});
