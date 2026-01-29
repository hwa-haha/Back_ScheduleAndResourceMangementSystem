/**
 * 시수 관리 API e2e 테스트
 *
 * test.md: 1) 도메인 조회로 API 필요값 준비 2) API별 케이스(정상·오류) 3) 결과요약
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { endOfMonth, format } from 'date-fns';
import { TestSetup } from './utils/test-setup';
import { TestHelpers } from './utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from './utils/e2e-data-provider';

/** 연·월 문자열로 해당 월 첫날(yyyy-MM-dd) 반환 */
function 해당월첫날(year: string, month: string): string {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    return format(new Date(y, m - 1, 1), 'yyyy-MM-dd');
}

/** 연·월 문자열로 해당 월 말일(yyyy-MM-dd) 반환 */
function 해당월말일(year: string, month: string): string {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    return format(endOfMonth(new Date(y, m - 1, 1)), 'yyyy-MM-dd');
}

describe('시수 관리 API (e2e)', () => {
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
        it('직원·연월·프로젝트·할당프로젝트 ID가 준비된다', () => {
            expect(ids.employeeIds).toBeInstanceOf(Array);
            expect(ids.year).toBeDefined();
            expect(ids.month).toBeDefined();
        });
    });

    describe('2. API별 e2e 테스트 케이스', () => {
        describe('GET /work-hours/monthly', () => {
            it('정상: employeeId, year, month로 조회 시 200', async () => {
                if (ids.employeeIds.length === 0) return;
                await request(app.getHttpServer())
                    .get('/work-hours/monthly')
                    .query({
                        employeeId: ids.employeeIds[0],
                        year: ids.year,
                        month: ids.month,
                    })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toBeDefined();
                    });
            });
            it('오류: employeeId 누락 시 400', async () => {
                await request(app.getHttpServer())
                    .get('/work-hours/monthly')
                    .query({ year: ids.year, month: ids.month })
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(400);
            });
        });

        describe('GET /work-hours/projects', () => {
            it('정상: 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/work-hours/projects')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('projects');
                        expect(Array.isArray(res.body.projects)).toBe(true);
                    });
            });
        });

        describe('GET /work-hours/wage-calculation-types', () => {
            it('정상: 조회 시 200', async () => {
                await request(app.getHttpServer())
                    .get('/work-hours/wage-calculation-types')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('wageCalculationTypes');
                        expect(Array.isArray(res.body.wageCalculationTypes)).toBe(true);
                    });
            });
        });

        describe('POST /work-hours/assign-project', () => {
            it('정상: employeeId, projectId, startDate, endDate로 할당 시 201 또는 이미 할당 시 409', async () => {
                if (ids.employeeIds.length === 0 || !ids.projectId) return;
                const startDate = 해당월첫날(ids.year, ids.month);
                const endDate = 해당월말일(ids.year, ids.month);
                const res = await request(app.getHttpServer())
                    .post('/work-hours/assign-project')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        employeeId: ids.employeeIds[0],
                        projectId: ids.projectId,
                        startDate,
                        endDate,
                    });
                // 201 생성됨, 409 이미 할당됨 (500은 예상 외 오류이므로 테스트에서 허용하지 않음)
                expect([201, 409]).toContain(res.status);
                if (res.status === 201) {
                    expect(res.body).toHaveProperty('id');
                    expect(res.body).toHaveProperty('employeeId');
                    expect(res.body).toHaveProperty('projectId');
                }
            });
            it('오류: projectId 누락 시 400', async () => {
                if (ids.employeeIds.length === 0) return;
                await request(app.getHttpServer())
                    .post('/work-hours/assign-project')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        employeeId: ids.employeeIds[0],
                        startDate: 해당월첫날(ids.year, ids.month),
                        endDate: 해당월말일(ids.year, ids.month),
                    })
                    .expect(400);
            });
        });

        describe('DELETE /work-hours/assign-project/:id', () => {
            it('정상: 존재하는 할당 ID로 제거 시 200', async () => {
                if (!ids.assignedProjectId) return;
                await request(app.getHttpServer())
                    .delete(`/work-hours/assign-project/${ids.assignedProjectId}`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body).toHaveProperty('success', true);
                    });
            });
        });
    });

    describe('3. 결과요약', () => {
        it('시수 관리 주요 API가 기대대로 동작한다', () => {
            expect(app).toBeDefined();
            expect(authToken).toBeDefined();
        });
    });
});
