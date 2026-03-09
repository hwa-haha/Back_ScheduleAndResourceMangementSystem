/**
 * 시나리오 SC-ADM-007: 근태 기록 조회 (연월·부서)
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-007
 * @description 연월·부서별 근태 기록 조회 검증
 * @role Admin
 * @ucFlow UC1(연월 선택) → UC2(부서 선택) → UC3(근태 기록 조회)
 * @api GET attendance-data/monthly-summaries?year=&month=&departmentId=
 * @fixture year, month, departmentId
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-007 근태 기록 조회', () => {
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

    /** UC3: 근태 기록 조회 — 응답 컬럼: monthlySummaries[].dailySummaries, yyyyymm, dailySummaries[].id, date */
    it('연월·부서로 조회 시 200 및 monthlySummaries 배열·컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/attendance-data/monthly-summaries')
            .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.monthlySummaries)).toBe(true);
        if (res.body.monthlySummaries.length > 0) {
            expect(res.body.monthlySummaries[0]).toHaveProperty('dailySummaries');
            expect(res.body.monthlySummaries[0]).toHaveProperty('yyyymm');
            const daily = res.body.monthlySummaries[0].dailySummaries;
            if (Array.isArray(daily) && daily.length > 0) {
                expect(daily[0]).toHaveProperty('id');
                expect(daily[0]).toHaveProperty('date');
            }
        }
    });
});
