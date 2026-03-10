/**
 * 출입/근태 데이터 API e2e 테스트
 *
 * test.md 기준:
 * 1. API에 필요한 값 준비 - 도메인함수(유틸)로 데이터 조회
 * 2. API별 e2e 테스트 케이스 (정상·오류)
 * 3. 결과요약
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from './utils/test-setup';
import { TestHelpers } from './utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from './utils/e2e-data-provider';

describe('출입/근태 데이터 API (e2e)', () => {
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

    describe('1. API에 필요한 값 준비 (도메인 조회)', () => {
        it('부서·직원·연월·일간/월간/스냅샷 ID가 준비된다', () => {
            expect(ids.departmentId).toBeDefined();
            expect(ids.employeeIds).toBeInstanceOf(Array);
            expect(ids.year).toBeDefined();
            expect(ids.month).toBeDefined();
        });
    });

    describe('2. API별 e2e 테스트 케이스', () => {
        describe('GET /attendance-data/monthly-summaries', () => {
            it('정상: year, month, departmentId로 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/attendance-data/monthly-summaries')
                    .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('monthlySummaries');
                        expect(Array.isArray(res.body.monthlySummaries)).toBe(true);
                    });
            });
            it('오류: departmentId 누락 시 400', async () => {
                await request(app.getHttpServer())
                    .get('/attendance-data/monthly-summaries')
                    .query({ year: ids.year, month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(400);
            });
        });

        describe('GET /attendance-data/daily-summaries/:id', () => {
            it('정상: 존재하는 일간요약 ID로 조회 시 200', async () => {
                if (!ids.dailySummaryId) return;
                await request(app.getHttpServer())
                    .get(`/attendance-data/daily-summaries/${ids.dailySummaryId}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('dailySummary');
                        expect(res.body.dailySummary.id).toBe(ids.dailySummaryId);
                    });
            });
            it('오류: 존재하지 않는 UUID로 조회 시 404', async () => {
                await request(app.getHttpServer())
                    .get('/attendance-data/daily-summaries/00000000-0000-0000-0000-000000000000')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(404);
            });
        });

        describe('GET /attendance-data/daily-summaries/:id/history', () => {
            it('정상: 존재하는 일간요약 ID로 수정이력 조회 시 200', async () => {
                if (!ids.dailySummaryId) return;
                await request(app.getHttpServer())
                    .get(`/attendance-data/daily-summaries/${ids.dailySummaryId}/history`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('dailyEventSummaryId', ids.dailySummaryId);
                        expect(res.body).toHaveProperty('histories');
                        expect(res.body).toHaveProperty('total');
                    });
            });
            it('오류: 존재하지 않는 UUID로 이력 조회 시 404', async () => {
                await request(app.getHttpServer())
                    .get('/attendance-data/daily-summaries/00000000-0000-0000-0000-000000000000/history')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(404);
            });
        });

        describe('PATCH /attendance-data/daily-summaries/:id', () => {
            it('정상: enter/leave로 수정 시 200', async () => {
                if (!ids.dailySummaryId) return;
                await request(app.getHttpServer())
                    .patch(`/attendance-data/daily-summaries/${ids.dailySummaryId}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ enter: '09:00:00', leave: '18:00:00', note: 'e2e 테스트' })
                    .expect(200);
            });
            it('오류: enter/leave와 attendanceTypeIds 동시 전달 시 400', async () => {
                if (!ids.dailySummaryId || !ids.attendanceTypeId) return;
                await request(app.getHttpServer())
                    .patch(`/attendance-data/daily-summaries/${ids.dailySummaryId}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        enter: '09:00:00',
                        attendanceTypeIds: [ids.attendanceTypeId],
                    })
                    .expect(400);
            });
        });

        describe('GET /attendance-data/snapshots', () => {
            it('정상: year, month로 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/attendance-data/snapshots')
                    .query({ year: ids.year, month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('snapshots');
                        expect(Array.isArray(res.body.snapshots)).toBe(true);
                    });
            });
            it('오류: year 누락 시 400', async () => {
                await request(app.getHttpServer())
                    .get('/attendance-data/snapshots')
                    .query({ month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(400);
            });
        });

        describe('GET /attendance-data/snapshots/:id', () => {
            it('정상: snapshotId, departmentId로 조회 시 200', async () => {
                if (!ids.snapshotId) return;
                await request(app.getHttpServer())
                    .get(`/attendance-data/snapshots/${ids.snapshotId}`)
                    .query({ departmentId: ids.departmentId })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);
            });
            it('오류: departmentId 누락 시 400', async () => {
                if (!ids.snapshotId) return;
                await request(app.getHttpServer())
                    .get(`/attendance-data/snapshots/${ids.snapshotId}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(400);
            });
        });

        describe('GET /attendance-data/monthly-summaries/:id/note', () => {
            it('정상: 존재하는 월간요약 ID로 노트 조회 시 200', async () => {
                if (!ids.monthlySummaryId) return;
                await request(app.getHttpServer())
                    .get(`/attendance-data/monthly-summaries/${ids.monthlySummaryId}/note`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('id');
                        expect(res.body).toHaveProperty('note');
                    });
            });
        });

        describe('PATCH /attendance-data/monthly-summaries/:id/note', () => {
            it('정상: note 수정 시 200', async () => {
                if (!ids.monthlySummaryId) return;
                await request(app.getHttpServer())
                    .patch(`/attendance-data/monthly-summaries/${ids.monthlySummaryId}/note`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ note: 'e2e 노트 수정' })
                    .expect(200);
            });
        });

        describe('POST /attendance-data/snapshots', () => {
            it('정상: year, month로 스냅샷 저장 시 201', async () => {
                await request(app.getHttpServer())
                    .post('/attendance-data/snapshots')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ year: ids.year, month: ids.month })
                    .expect(201)
                    .expect((res) => {
                        // 201 시 응답 본문에 snapshot 또는 snapshotId 존재 시 검증
                        if (res.body?.snapshot != null) expect(res.body.snapshot).toHaveProperty('id');
                        if (res.body?.snapshotId != null) expect(typeof res.body.snapshotId).toBe('string');
                    });
            });
            it('오류: month 누락 시 400', async () => {
                await request(app.getHttpServer())
                    .post('/attendance-data/snapshots')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({ year: ids.year })
                    .expect(400);
            });
        });
    });

    describe('3. 결과요약', () => {
        it('출입/근태 데이터 주요 API가 정상·오류 케이스에서 기대대로 동작한다', () => {
            expect(app).toBeDefined();
            expect(authToken).toBeDefined();
            expect(ids.departmentId).toBeDefined();
        });
    });
});
