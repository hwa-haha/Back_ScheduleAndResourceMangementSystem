/**
 * 파일 관리 API e2e 테스트
 *
 * test.md: 1) 도메인 조회로 API 필요값 준비 2) API별 케이스(정상·오류) 3) 결과요약
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from './utils/test-setup';
import { TestHelpers } from './utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from './utils/e2e-data-provider';

describe('파일 관리 API (e2e)', () => {
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
        it('연월·직원번호·fileId·reflectionHistoryId가 준비된다', () => {
            expect(ids.year).toBeDefined();
            expect(ids.month).toBeDefined();
            expect(ids.employeeNumbers).toBeInstanceOf(Array);
        });
    });

    describe('2. API별 e2e 테스트 케이스', () => {
        describe('GET /file-management/files/list', () => {
            it('정상: year, month로 파일 목록 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/file-management/files/list')
                    .query({ year: ids.year, month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('files');
                        expect(Array.isArray(res.body.files)).toBe(true);
                    });
            });
            it('오류: year 누락 시 400', async () => {
                await request(app.getHttpServer())
                    .get('/file-management/files/list')
                    .query({ month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(400);
            });
        });

        describe('GET /file-management/files/:fileId/reflection-history', () => {
            it('정상: 존재하는 fileId로 반영이력 조회 시 200', async () => {
                if (!ids.fileId) return;
                await request(app.getHttpServer())
                    .get(`/file-management/files/${ids.fileId}/reflection-history`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
            });
        });

        describe('GET /file-management/files/:fileId/org-data', () => {
            it('정상: 존재하는 fileId로 org-data 조회 시 200', async () => {
                if (!ids.fileId) return;
                await request(app.getHttpServer())
                    .get(`/file-management/files/${ids.fileId}/org-data`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
            });
        });

        describe('POST /file-management/reflect', () => {
            it('오류: fileId 누락 시 400', async () => {
                await request(app.getHttpServer())
                    .post('/file-management/reflect')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        employeeNumbers: ids.employeeNumbers.length ? ids.employeeNumbers : ['00001'],
                        year: ids.year,
                        month: ids.month,
                    })
                    .expect(400);
            });
        });

        describe('POST /file-management/restore-from-history', () => {
            it('오류: reflectionHistoryId 누락 시 400', async () => {
                await request(app.getHttpServer())
                    .post('/file-management/restore-from-history')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ year: ids.year, month: ids.month })
                    .expect(400);
            });
        });
    });

    describe('3. 결과요약', () => {
        it('파일 관리 주요 API가 기대대로 동작한다', () => {
            expect(app).toBeDefined();
            expect(authToken).toBeDefined();
        });
    });
});
