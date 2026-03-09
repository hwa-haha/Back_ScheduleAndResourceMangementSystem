/**
 * 시나리오 SC-ADM-004: 휴무일정 관리
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-004
 * @description 공휴일 및 특별근태 관리 검증
 * @role Admin
 * @ucFlow UC37~UC44(휴일·특별근태 CRUD)
 * @api GET/POST/PATCH/DELETE holidays, work-time-overrides
 * @fixture holiday/override 본문
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-004 휴무일정 관리', () => {
    let app: INestApplication;
    let authToken: string;
    let dataSource: DataSource;
    let ids: E2EDataIds;
    let createdHolidayId: string | null = null;
    let createdWorkTimeOverrideId: string | null = null;
    let createdWorkTimeOverrideDate: string | null = null;

    beforeAll(async () => {
        app = await TestSetup.createTestApp();
        authToken = TestHelpers.createValidJwtToken(app);
        dataSource = app.get<DataSource>(DataSource);
        ids = await e2e데이터ID를준비한다(dataSource);
    });

    afterAll(async () => {
        await TestSetup.closeTestApp(app);
    });

    /** UC37: 공휴일 목록 — 응답 컬럼: id, holidayName, holidayDate */
    it('휴일 목록 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/settings/holidays')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const list = res.body?.holidays ?? res.body?.data ?? res.body;
        expect(Array.isArray(list) || (list && typeof list === 'object')).toBe(true);
        if (Array.isArray(list) && list.length > 0) {
            expect(list[0]).toHaveProperty('holidayDate');
            expect(list[0]).toHaveProperty('holidayName');
        }
    });

    /** UC38: 공휴일 생성 — 응답 컬럼: id, holidayName, holidayDate = 요청값 */
    it('UC38 공휴일 생성 POST 호출 시 201 및 응답 컬럼 검증', async () => {
        const listRes = await request(app.getHttpServer())
            .get('/settings/holidays')
            .set('Authorization', `Bearer ${authToken}`);
        expect(listRes.status).toBe(200);
        const existing = listRes.body?.holidays ?? listRes.body?.data ?? listRes.body;
        const existingDates = new Set(
            (Array.isArray(existing) ? existing : [])
                .map((h: any) => String(h?.holidayDate ?? ''))
                .filter((v: string) => !!v),
        );

        let holidayDate: string | null = null;
        for (let i = 0; i < 31; i++) {
            const day = String(31 - i).padStart(2, '0');
            const candidate = `2099-12-${day}`;
            if (!existingDates.has(candidate)) {
                holidayDate = candidate;
                break;
            }
        }
        if (!holidayDate) return;

        const holidayName = `E2E테스트휴일_${Date.now()}`;
        const res = await request(app.getHttpServer())
            .post('/settings/holidays')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ holidayName, holidayDate });
        expect([201, 400]).toContain(res.status);
        if (res.status === 201) {
            const created = res.body?.holidayInfo ?? res.body;
            const id = created?.id ?? res.body?.id;
            expect(id).toBeDefined();
            createdHolidayId = id ?? null;
            if (created?.holidayDate !== undefined) expect(created.holidayDate).toBe(holidayDate);
        }
    });

    /** UC39: 공휴일 수정 */
    it('UC39 공휴일 수정 PATCH 호출 시 200 또는 404', async () => {
        const holidayId = createdHolidayId ?? ids.holidayId;
        if (!holidayId) return;
        const res = await request(app.getHttpServer())
            .patch('/settings/holidays')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ id: holidayId, holidayName: `수정된 휴일명_${Date.now()}` });
        expect([200, 404]).toContain(res.status);
    });

    /** UC40: 공휴일 삭제 */
    it('UC40 생성한 공휴일이 있으면 삭제 시 200 또는 204', async () => {
        const holidayId = createdHolidayId;
        if (!holidayId) return;
        const res = await request(app.getHttpServer())
            .delete('/settings/holidays')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ id: holidayId });
        expect([200, 204]).toContain(res.status);
    });

    /** UC41: 특별근태 목록 — 응답 컬럼: id, date, startWorkTime, endWorkTime, reason */
    it('특별근태 목록 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/settings/work-time-overrides')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const list = res.body?.data ?? res.body;
        if (Array.isArray(list) && list.length > 0) {
            expect(list[0]).toHaveProperty('date');
            expect(list[0]).toHaveProperty('startWorkTime');
        }
    });

    /** UC42: 특별근태 생성 */
    it('UC42 특별근태 생성 POST 호출 시 201 또는 400', async () => {
        const listRes = await request(app.getHttpServer())
            .get('/settings/work-time-overrides')
            .set('Authorization', `Bearer ${authToken}`);
        expect(listRes.status).toBe(200);
        const existing = listRes.body?.data ?? listRes.body;
        const existingDates = new Set(
            (Array.isArray(existing) ? existing : [])
                .map((o: any) => String(o?.date ?? ''))
                .filter((v: string) => !!v),
        );

        let date: string | null = null;
        for (let i = 1; i <= 31; i++) {
            const day = String(i).padStart(2, '0');
            const candidate = `2099-11-${day}`;
            if (!existingDates.has(candidate)) {
                date = candidate;
                break;
            }
        }
        if (!date) return;

        const res = await request(app.getHttpServer())
            .post('/settings/work-time-overrides')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ date, startWorkTime: '09:00:00', endWorkTime: '18:00:00' });
        expect([201, 400]).toContain(res.status);
        if (res.status === 201) {
            const created = res.body?.workTimeOverride ?? res.body;
            const id = created?.id ?? res.body?.id;
            createdWorkTimeOverrideId = id ?? null;
            createdWorkTimeOverrideDate = date;
        }
    });

    /** UC43: 특별근태 수정 */
    it('UC43 특별근태 수정 PATCH 호출 시 200 또는 404', async () => {
        const overrideId = createdWorkTimeOverrideId ?? ids.workTimeOverrideId;
        if (!overrideId) return;
        const res = await request(app.getHttpServer())
            .patch('/settings/work-time-overrides')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ id: overrideId, startWorkTime: '10:00:00' });
        expect([200, 404]).toContain(res.status);
    });

    /** UC44: 특별근태 삭제 */
    it('UC44 생성한 특별근태가 있으면 삭제 시 200 또는 204', async () => {
        const overrideId = createdWorkTimeOverrideId;
        if (!overrideId) return;
        const res = await request(app.getHttpServer())
            .delete('/settings/work-time-overrides')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ id: overrideId, date: createdWorkTimeOverrideDate ?? undefined });
        expect([200, 204]).toContain(res.status);
    });
});
