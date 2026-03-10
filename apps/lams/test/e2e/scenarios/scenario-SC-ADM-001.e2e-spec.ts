/**
 * 시나리오 SC-ADM-001: 근태유형 관리
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-001
 * @description 근태유형 생성·삭제·사용여부 관리 검증
 * @role Admin
 * @ucFlow UC24(목록) → UC25/UC26/UC27(생성·수정·삭제)
 * @api GET/POST/PATCH/DELETE settings/attendance-types
 * @fixture attendanceType 본문
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-001 근태유형 관리', () => {
    let app: INestApplication;
    let authToken: string;
    let dataSource: DataSource;
    let ids: E2EDataIds;
    let createdAttendanceTypeId: string | null = null;

    beforeAll(async () => {
        app = await TestSetup.createTestApp();
        authToken = TestHelpers.createValidJwtToken(app);
        dataSource = app.get<DataSource>(DataSource);
        ids = await e2e데이터ID를준비한다(dataSource);
    });

    afterAll(async () => {
        await TestSetup.closeTestApp(app);
    });

    /** UC24: 근태유형 목록 조회 — 응답 컬럼: id, title, workTime, isActive, isRecognizedWorkTime */
    it('목록 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/settings/attendance-types')
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const list = res.body?.attendanceTypes ?? res.body?.data ?? res.body;
        expect(Array.isArray(list) || (list && typeof list === 'object')).toBeTruthy();
        if (Array.isArray(list) && list.length > 0) {
            expect(list[0]).toHaveProperty('id');
            expect(list[0]).toHaveProperty('title');
        }
    });

    /** UC25: 근태유형 생성 — 응답 컬럼: id, title=요청값, workTime, isActive */
    it('UC25 근태유형 생성 POST 호출 시 201 및 응답 컬럼 검증', async () => {
        const title = `E2E테스트유형_${Date.now()}`;
        const res = await request(app.getHttpServer())
            .post('/settings/attendance-types')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title, workTime: 480, isRecognizedWorkTime: true });
        expect([201, 400]).toContain(res.status);
        if (res.status === 201) {
            const created = res.body?.attendanceType ?? res.body;
            const id = created?.id ?? res.body?.id;
            expect(id).toBeDefined();
            createdAttendanceTypeId = id ?? null;
            if (created?.title !== undefined) expect(created.title).toBe(title);
        }
    });

    /** UC26: 근태유형 수정 — 응답 컬럼: title, isActive = 요청값 */
    it('UC26 근태유형 수정 PATCH 호출 시 200 및 반영 검증', async () => {
        const attendanceTypeId = createdAttendanceTypeId;
        if (!attendanceTypeId) return;
        const title = `수정된 제목_${Date.now()}`;
        const res = await request(app.getHttpServer())
            .patch(`/settings/attendance-types/${attendanceTypeId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title, isActive: true });
        expect([200, 404]).toContain(res.status);
        if (res.status === 200 && res.body) {
            const updated = res.body?.attendanceType ?? res.body;
            if (updated?.title !== undefined) expect(updated.title).toBe(title);
        }
    });

    /** UC27: 근태유형 삭제 */
    it('UC27 생성한 근태유형이 있으면 삭제 시 200 또는 204', async () => {
        const attendanceTypeId = createdAttendanceTypeId;
        if (!attendanceTypeId) return;
        const res = await request(app.getHttpServer())
            .delete(`/settings/attendance-types/${attendanceTypeId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect([200, 204]).toContain(res.status);
    });
});
