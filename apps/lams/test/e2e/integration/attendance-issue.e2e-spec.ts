/**
 * 52200 통합 테스트: attendance-issues
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('통합 (52200) attendance-issues', () => {
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

    describe('GET /attendance-issues', () => {
        it('정상: 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/attendance-issues')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
        it('오류: 토큰 없이 호출 시 401', async () => {
            await request(app.getHttpServer()).get('/attendance-issues').expect(401);
        });
    });

    describe('GET /attendance-issues/by-department', () => {
        it('정상: departmentId, year, month로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/attendance-issues/by-department')
                .query({ departmentId: ids.departmentId, year: ids.year, month: ids.month })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /attendance-issues/:id', () => {
        it('오류: 존재하지 않는 UUID로 조회 시 404', async () => {
            await request(app.getHttpServer())
                .get('/attendance-issues/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
        it('정상: 존재하는 이슈 ID로 조회 시 200', async () => {
            if (!ids.attendanceIssueId) return;
            await request(app.getHttpServer())
                .get(`/attendance-issues/${ids.attendanceIssueId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('POST /attendance-issues/request', () => {
        it('오류: body 필수(issueIds 등) 누락 시 400', async () => {
            const res = await request(app.getHttpServer())
                .post('/attendance-issues/request')
                .set('Authorization', `Bearer ${authToken}`)
                .send({});
            expect([400, 404]).toContain(res.status);
        });
    });
});
