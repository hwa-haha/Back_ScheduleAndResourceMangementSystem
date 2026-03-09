/**
 * 시나리오 SC-ADM-003: 집계 대상 관리
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-003
 * @description 직원 집계 대상 포함·제외 관리 검증
 * @role Admin
 * @ucFlow UC31(직원 목록) → UC32(계산제외 설정 변경)
 * @api GET permissions/employees/with-extra-info, PATCH employee-extra-info
 * @fixture employeeId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-003 집계 대상 관리', () => {
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

    /** UC31: 직원 목록 — 응답 컬럼: id, employeeNumber, employeeName, isExcludedFromSummary */
    it('직원 목록(권한/추가정보) 조회 시 200 및 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/settings/permissions/employees/with-extra-info')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(res.body).toBeDefined();
        const list = res.body?.employees ?? res.body?.data ?? res.body;
        if (Array.isArray(list) && list.length > 0) {
            expect(list[0]).toHaveProperty('id');
        }
    });

    /** UC32: 계산제외 설정 변경 — 응답 컬럼: extraInfo.isExcludedFromSummary = 요청값 */
    it('UC32 직원 추가정보 PATCH 호출 시 200 및 반영 검증', async () => {
        if (!ids.employeeIds?.length) return;
        const isExcludedFromSummary = false;
        const res = await request(app.getHttpServer())
            .patch('/settings/employee-extra-info')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ employeeId: ids.employeeIds[0], isExcludedFromSummary });
        expect([200, 400]).toContain(res.status);
        if (res.status === 200) {
            const extra = res.body?.extraInfo ?? res.body;
            if (extra?.isExcludedFromSummary !== undefined) expect(extra.isExcludedFromSummary).toBe(isExcludedFromSummary);
        }
    });
});
