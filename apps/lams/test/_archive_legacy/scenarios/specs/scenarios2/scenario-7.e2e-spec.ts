import { INestApplication } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as path from 'path';
import { ScenarioContext, createScenarioContext, closeScenarioContext } from '../../utils/scenario-test-setup';
import { createScenarioHttpLogger } from '../../utils/scenario-http-log';
import {
    MonthlySummarySnapshotSource,
    buildDailySummarySnapshotMap,
    collectDailySummaryChanges,
    collectDetailChanges,
    formatDailySummaryChange,
    formatDetailChange,
} from '../../utils/scenario-change-log';
import * as request from 'supertest';

describe('시나리오 7: 출입내역 수정본 반영 → 기존 내용과 변경점 비교 (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    let testEmployeeIds: string[] = [];
    let testDepartmentId: string;
    let context: ScenarioContext;

    const testYear = '2025';
    const testMonth = '11';
    const modifiedEventFileName = '출입내역_수정본.xlsx';
    const modifiedEventFilePath = path.resolve(process.cwd(), 'storage', 'local-files', modifiedEventFileName);
    const { 기록한다, 저장한다 } = createScenarioHttpLogger('scenario2-7.http-log.txt');

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

    it('수정본 반영 전/후 변경점을 비교한다', async () => {
        if (testEmployeeIds.length === 0) {
            throw new Error('테스트 기준 직원 데이터가 준비되지 않았습니다.');
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
        const beforeSnapshots = buildDailySummarySnapshotMap(beforeMonthlySummaries);
        const modifiedBuffer = readFileSync(modifiedEventFilePath);
        const uploadRes = await request(app.getHttpServer())
            .post('/file-management/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', modifiedBuffer, modifiedEventFileName)
            .field('year', testYear)
            .field('month', testMonth)
            .expect(201);
        const modifiedFileId = uploadRes.body.fileId as string;
        await request(app.getHttpServer())
            .post('/file-management/reflect')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                fileIds: [modifiedFileId],
                employeeIds: testEmployeeIds,
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
        const detailChanges = collectDetailChanges(beforeMonthlySummaries, afterMonthlySummaries);
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
                    dailySummarySamples: changedSummaries.slice(0, 5).map(formatDailySummaryChange),
                    detailSamples: detailChanges.slice(0, 5).map(formatDetailChange),
                },
            },
        );

        expect(Array.isArray(afterMonthlySummaries)).toBe(true);
        expect(changedSummaries.length).toBeGreaterThan(0);
    });
});
