import { INestApplication } from '@nestjs/common';
import { ScenarioContext, createScenarioContext, closeScenarioContext } from '../../utils/scenario-test-setup';
import { createScenarioHttpLogger } from '../../utils/scenario-http-log';
import {
    MonthlySummarySnapshotSource,
    buildDailySummarySnapshotMap,
    collectDailySummaryChanges,
    formatDailySummaryChange,
} from '../../utils/scenario-change-log';
import * as request from 'supertest';

describe('시나리오 8: 파일 반영 이력 복원 → 요약 재생성 (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    let testEmployeeIds: string[] = [];
    let testDepartmentId: string;
    let context: ScenarioContext;

    const testYear = '2025';
    const testMonth = '11';
    const { 기록한다, 저장한다 } = createScenarioHttpLogger('scenario2-8.http-log.txt');

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

    it('파일 반영 이력 복원 전/후 변경점을 비교한다', async () => {
        if (testEmployeeIds.length === 0) {
            throw new Error('테스트 기준 직원 데이터가 준비되지 않았습니다.');
        }

        const filesRes = await request(app.getHttpServer())
            .get('/file-management/files')
            .query({
                year: testYear,
                month: testMonth,
            })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        const files = filesRes.body.files as Array<{ reflectionHistories: Array<{ id: string }> }>;
        console.log('files', files);
        const histories = files.flatMap((file) => file.reflectionHistories || []);
        const reflectionHistoryId = histories[histories.length - 1]?.id;
        if (!reflectionHistoryId) {
            throw new Error('복원할 파일 반영 이력을 찾을 수 없습니다.');
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

        const beforeMonthlySummaries = beforeMonthlyRes.body.monthlySummaries as MonthlySummarySnapshotSource[];
        console.log('beforeMonthlySummaries', beforeMonthlySummaries);
        const beforeSnapshots = buildDailySummarySnapshotMap(beforeMonthlySummaries);
        await request(app.getHttpServer())
            .post('/file-management/restore-from-history')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                reflectionHistoryId,
                year: testYear,
                month: testMonth,
            })
            .expect(201);
        const afterMonthlyRes = await request(app.getHttpServer())
            .get('/attendance-data/monthly-summaries')
            .query({
                year: testYear,
                month: testMonth,
                departmentId: testDepartmentId,
            })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        const afterMonthlySummaries = afterMonthlyRes.body.monthlySummaries as MonthlySummarySnapshotSource[];
        const afterSnapshots = buildDailySummarySnapshotMap(afterMonthlySummaries);
        const changedSummaries = collectDailySummaryChanges(beforeSnapshots.map, afterSnapshots.map);

        기록한다(
            '변경점 요약',
            {
                method: 'COMPARE',
                url: '/attendance-data/monthly-summaries',
                query: { year: testYear, month: testMonth, departmentId: testDepartmentId },
            },
            {
                status: 200,
                body: {
                    samples: changedSummaries.slice(0, 5).map(formatDailySummaryChange),
                },
            },
        );

        expect(Array.isArray(afterMonthlySummaries)).toBe(true);
        expect(changedSummaries.length).toBeGreaterThan(0);
    });
});
