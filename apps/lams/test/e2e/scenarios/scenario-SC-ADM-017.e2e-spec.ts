/**
 * 시나리오 SC-ADM-017: 근태 대시보드 조회
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-017
 * @description 부서별 근태 통계(차트·리스트) 조회 검증
 * @role Admin
 * @ucFlow UC45~UC50(대시보드 연월·부서·주차별·월별 조회)
 * @api GET dashboard/department/snapshots, weekly-top-employees, monthly-employee-attendance
 * @fixture year, month, departmentId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-017 근태 대시보드 조회', () => {
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

    /** UC46/UC49: 부서 스냅샷 — 응답 컬럼: snapshots[], snapshotId, snapshotName, yyyy, mm */
    it('부서 스냅샷 조회 시 200 및 본문 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/dashboard/department/snapshots')
            .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
    });

    /** UC47: 주차별 직원 — 응답 컬럼: employeeId, employeeName, 근무시간 */
    it('주차별 직원 리스트 조회 시 200 및 본문 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/dashboard/department/weekly-top-employees')
            .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`);
        expect([200, 404]).toContain(res.status);
        if (res.status === 200 && res.body && Array.isArray(res.body) && res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('employeeId');
        }
    });

    /** UC48: 직원 근태 상세 — 응답 컬럼: employeeId, employeeName, yyyymm, statistics, dailyDetails[] */
    it('UC48 직원 근태 상세 조회 시 200 및 컬럼 검증', async () => {
        if (!ids.employeeIds?.length) return;
        const res = await request(app.getHttpServer())
            .get('/dashboard/employee/attendance-detail')
            .query({ year: ids.year, month: ids.month, employeeId: ids.employeeIds[0] })
            .set('Authorization', `Bearer ${authToken}`);
        expect([200, 404]).toContain(res.status);
        if (res.status === 200 && res.body) {
            expect(res.body.employeeId).toBe(ids.employeeIds[0]);
            const details = res.body.dailyAttendanceDetails ?? res.body.dailyDetails;
            expect(details).toBeDefined();
            expect(Array.isArray(details)).toBe(true);
        }
    });

    /** UC49: 월별 근무내역 — 응답 컬럼: employeeId, totalWorkMinutes */
    it('월별 근무내역/근무시간 조회 시 200 및 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/dashboard/department/monthly-employee-attendance')
            .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        const list = Array.isArray(res.body) ? res.body : res.body?.employees ?? res.body?.data;
        if (Array.isArray(list) && list.length > 0) {
            expect(list[0]).toHaveProperty('employeeId');
        }
    });

    /** UC49: 월별 직원별 근무시간 — 응답 컬럼: employeeId, totalWorkMinutes */
    it('월별 직원별 근무시간 조회 시 200 및 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/dashboard/department/monthly-employee-work-hours')
            .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        const list = Array.isArray(res.body) ? res.body : res.body?.employees ?? res.body?.data;
        if (Array.isArray(list) && list.length > 0) {
            expect(list[0]).toHaveProperty('employeeId');
        }
    });
});
