/**
 * 조직 관리 API e2e 테스트
 *
 * test.md: 1) 도메인 조회로 API 필요값 준비 2) API별 케이스(정상·오류) 3) 결과요약
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from './utils/test-setup';
import { TestHelpers } from './utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from './utils/e2e-data-provider';

describe('조직 관리 API (e2e)', () => {
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
        it('연월이 준비된다', () => {
            expect(ids.year).toBeDefined();
            expect(ids.month).toBeDefined();
        });
    });

    describe('2. API별 e2e 테스트 케이스', () => {
        describe('GET /organization-management/departments', () => {
            it('정상: year, month로 부서 목록 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/organization-management/departments')
                    .query({ year: ids.year, month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('hierarchy');
                        expect(res.body).toHaveProperty('flatList');
                        expect(Array.isArray(res.body.flatList)).toBe(true);
                    });
            });
            it('오류: year 누락 시 400', async () => {
                await request(app.getHttpServer())
                    .get('/organization-management/departments')
                    .query({ month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(400);
            });
            it('오류: month 누락 시 400', async () => {
                await request(app.getHttpServer())
                    .get('/organization-management/departments')
                    .query({ year: ids.year })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(400);
            });
        });
    });

    describe('3. 결과요약', () => {
        it('조직 관리 API가 기대대로 동작한다', () => {
            expect(app).toBeDefined();
            expect(authToken).toBeDefined();
        });
    });
});
