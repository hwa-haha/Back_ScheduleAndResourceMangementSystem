import { INestApplication } from '@nestjs/common';
import { ScenarioContext, createScenarioContext, closeScenarioContext } from '../../utils/scenario-test-setup';
import { createScenarioHttpLogger } from '../../utils/scenario-http-log';
import * as request from 'supertest';

describe('시나리오 6: 스냅샷 목록 조회 → 스냅샷 복원 (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    let testEmployeeIds: string[] = [];
    let testDepartmentId: string;
    let context: ScenarioContext;

    const testYear = '2025';
    const testMonth = '11';
    const { 기록한다, 저장한다 } = createScenarioHttpLogger('scenario2-6.http-log.txt');

    beforeAll(async () => {
        context = await createScenarioContext();
        app = context.app;
        authToken = context.authToken;
        testEmployeeIds = context.employeeIds;
        testDepartmentId = context.departmentId;
    });

    afterAll(async () => {
        저장한다();
        await closeScenarioContext(app);
    });

    it('스냅샷 목록 조회 후 복원', async () => {
        if (testEmployeeIds.length === 0) {
            throw new Error('테스트 기준 직원 데이터가 준비되지 않았습니다.');
        }

        const snapshotRes = await request(app.getHttpServer())
            .post('/attendance-data/snapshots')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                year: testYear,
                month: testMonth,
                departmentId: testDepartmentId,
                snapshotName: '시나리오 6 스냅샷',
                description: '시나리오 6 테스트용 스냅샷',
            })
            .expect(201);
        const snapshotId = snapshotRes.body.snapshot?.id;
        if (!snapshotId) {
            throw new Error('복원할 스냅샷 ID를 찾을 수 없습니다.');
        }

        const beforeMonthlyRes = await request(app.getHttpServer())
            .get('/attendance-data/monthly-summaries')
            .query({
                year: testYear,
                month: testMonth,
                departmentId: testDepartmentId,
            })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        const beforeMonthlySummaries = Array.isArray(beforeMonthlyRes.body.monthlySummaries)
            ? (beforeMonthlyRes.body.monthlySummaries as Array<Record<string, unknown>>)
            : [];
        const beforeDailyCount = beforeMonthlyRes.body.monthlySummaries
            .flatMap((monthly: { dailySummaries?: unknown[] }) => monthly.dailySummaries || [])
            .length;

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
        const snapshotList = Array.isArray(listRes.body.snapshots)
            ? (listRes.body.snapshots as Array<Record<string, unknown>>)
            : [];
        expect(Array.isArray(listRes.body.snapshots)).toBe(true);

        const restoreRes = await request(app.getHttpServer())
            .post('/attendance-data/snapshots/restore')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ snapshotId })
            .expect(201);
        expect(restoreRes.body).toHaveProperty('snapshotId');

        const monthlyRes = await request(app.getHttpServer())
            .get('/attendance-data/monthly-summaries')
            .query({
                year: testYear,
                month: testMonth,
                departmentId: testDepartmentId,
            })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        const afterMonthlySummaries = Array.isArray(monthlyRes.body.monthlySummaries)
            ? (monthlyRes.body.monthlySummaries as Array<Record<string, unknown>>)
            : [];
        expect(Array.isArray(monthlyRes.body.monthlySummaries)).toBe(true);
        const afterDailyCount = monthlyRes.body.monthlySummaries
            .flatMap((monthly: { dailySummaries?: unknown[] }) => monthly.dailySummaries || [])
            .length;
        expect(afterDailyCount).toBeGreaterThanOrEqual(beforeDailyCount);
        기록한다(
            '일간요약 개수 비교',
            {
                method: 'COMPARE',
                url: '/attendance-data/monthly-summaries',
                query: { year: testYear, month: testMonth, departmentId: testDepartmentId },
            },
            {
                status: 200,
                body: {
                    note: '복원 전후 비교는 테스트 assertion으로 검증',
                },
            },
        );
    });
});
