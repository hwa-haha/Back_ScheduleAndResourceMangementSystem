/**
 * 시나리오 SC-ADM-018: 시수 통계 조회
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-018
 * @description 직원·프로젝트 시수 통계 조회 검증
 * @role Admin
 * @ucFlow UC64 → UC68~UC74(통계 연월·부서·직원/프로젝트 통계)
 * @api GET work-hours/statistics/by-employee, by-project
 * @fixture year, month
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-018 시수 통계 조회', () => {
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

    /** UC69: 월별 부서/직원 목록 조회(통계용) */
    it('UC69 직원·할당 목록(employees-with-assignments) 조회 시 200', async () => {
        const res = await request(app.getHttpServer())
            .get('/work-hours/employees-with-assignments')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
    });

    /** UC71: 직원 통계 — 응답 컬럼: employeeId, employeeName, totalWorkMinutes */
    it('직원 통계 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/work-hours/statistics/by-employee')
            .query({ year: ids.year, month: ids.month })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        const list = res.body?.data ?? res.body;
        if (Array.isArray(list) && list.length > 0) {
            expect(list[0]).toHaveProperty('employeeId');
            expect(list[0]).toHaveProperty('totalWorkMinutes');
        }
    });

    /** UC72: 프로젝트 통계 — 응답 컬럼: projectId, projectName, totalWorkMinutes */
    it('프로젝트 통계 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/work-hours/statistics/by-project')
            .query({ year: ids.year, month: ids.month })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        const list = res.body?.data ?? res.body;
        if (Array.isArray(list) && list.length > 0) {
            expect(list[0]).toHaveProperty('projectId');
            expect(list[0]).toHaveProperty('totalWorkMinutes');
        }
    });
});
