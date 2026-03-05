import { INestApplication } from '@nestjs/common';
import { ScenarioContext, createScenarioContext, closeScenarioContext } from '../../utils/scenario-test-setup';
import * as request from 'supertest';

describe('시나리오 5: 월간요약 확정 → 스냅샷 저장 (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    let testEmployeeIds: string[] = [];
    let testDepartmentId: string;
    let context: ScenarioContext;

    const testYear = '2025';
    const testMonth = '11';
    beforeAll(async () => {
        context = await createScenarioContext();
        app = context.app;
        authToken = context.authToken;
        testEmployeeIds = context.employeeIds;
        testDepartmentId = context.departmentId;
    });

    afterAll(async () => {
        await closeScenarioContext(app);
    });

    it('월간요약 조회 후 스냅샷 저장', async () => {
        if (testEmployeeIds.length === 0) {
            throw new Error('테스트 기준 직원 데이터가 준비되지 않았습니다.');
        }

        const monthlyRes = await request(app.getHttpServer())
            .get('/attendance-data/monthly-summaries')
            .query({
                year: testYear,
                month: testMonth,
                departmentId: testDepartmentId,
            })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        const monthlySummaries = Array.isArray(monthlyRes.body.monthlySummaries)
            ? (monthlyRes.body.monthlySummaries as Array<Record<string, unknown>>)
            : [];
        const beforeListRes = await request(app.getHttpServer())
            .get('/attendance-data/snapshots')
            .query({
                year: testYear,
                month: testMonth,
                departmentId: testDepartmentId,
                sortBy: 'latest',
            })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        const beforeSnapshots = Array.isArray(beforeListRes.body.snapshots)
            ? (beforeListRes.body.snapshots as Array<Record<string, unknown>>)
            : [];
        const beforeCount = Array.isArray(beforeListRes.body.snapshots) ? beforeListRes.body.snapshots.length : 0;

        const snapshotRes = await request(app.getHttpServer())
            .post('/attendance-data/snapshots')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                year: testYear,
                month: testMonth,
                departmentId: testDepartmentId,
                snapshotName: '시나리오 5 스냅샷',
                description: '시나리오 5 테스트용 스냅샷',
            })
            .expect(201);
        expect(snapshotRes.body).toHaveProperty('snapshot');
        expect(snapshotRes.body.snapshot).toBeTruthy();

        const listRes = await request(app.getHttpServer())
            .get('/attendance-data/snapshots')
            .query({
                year: testYear,
                month: testMonth,
                departmentId: testDepartmentId,
                sortBy: 'latest',
            })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        const afterSnapshots = Array.isArray(listRes.body.snapshots)
            ? (listRes.body.snapshots as Array<Record<string, unknown>>)
            : [];
        expect(listRes.body).toHaveProperty('snapshots');
        expect(Array.isArray(listRes.body.snapshots)).toBe(true);
        const afterCount = listRes.body.snapshots.length;
        if (snapshotRes.body.snapshot?.id) {
            expect(afterCount).toBeGreaterThan(beforeCount);
        }
    });
});
