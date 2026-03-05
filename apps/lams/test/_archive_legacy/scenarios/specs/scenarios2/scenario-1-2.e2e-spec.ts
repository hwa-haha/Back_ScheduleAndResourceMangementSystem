import { INestApplication } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as path from 'path';
import { ScenarioContext, createScenarioContext, closeScenarioContext } from '../../utils/scenario-test-setup';
import { createScenarioHttpLogger } from '../../utils/scenario-http-log';
import {
    MonthlySummarySnapshotSource,
    buildDailySummarySnapshotMap,
    collectDailySummaryChanges,
    formatDailySummaryChange,
} from '../../utils/scenario-change-log';
import * as request from 'supertest';

describe('시나리오 1-2 비교: 출입내역 반영 전/후 근태신청 반영 비교 (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    let testEmployeeIds: string[] = [];
    let testDepartmentId: string;
    let context: ScenarioContext;
    const isCleanUpData: boolean = true;

    const testYear = '2025';
    const testMonth = '11';
    const attendanceEventFileName = '출입내역_원본.xlsx';
    const attendanceRequestFileName = '근태신청내역_원본.xlsx';
    const attendanceEventFilePath = path.resolve(process.cwd(), 'storage', 'local-files', attendanceEventFileName);
    const attendanceRequestFilePath = path.resolve(process.cwd(), 'storage', 'local-files', attendanceRequestFileName);
    const { 기록한다, 저장한다 } = createScenarioHttpLogger('scenario2-1-2.http-log.txt');

    beforeAll(async () => {
        context = await createScenarioContext(isCleanUpData);
        app = context.app;
        authToken = context.authToken;
        testEmployeeIds = context.employeeIds;
        testDepartmentId = context.departmentId;
    });

    afterAll(async () => {
        저장한다();
        await closeScenarioContext(app);
    });

    it('출입내역 반영 결과(A)와 근태신청 반영 결과(B)를 비교한다', async () => {
        if (testEmployeeIds.length === 0) {
            throw new Error('테스트 기준 직원 데이터가 준비되지 않았습니다.');
        }

        const attendanceEventBuffer = readFileSync(attendanceEventFilePath);
        const eventUploadRes = await request(app.getHttpServer())
            .post('/file-management/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', attendanceEventBuffer, attendanceEventFileName)
            .field('year', testYear)
            .field('month', testMonth)
            .expect(201);
        const eventFileId = eventUploadRes.body.fileId as string;

        const eventReflectRes = await request(app.getHttpServer())
            .post('/file-management/reflect')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                fileIds: [eventFileId],
                employeeIds: testEmployeeIds,
                year: testYear,
                month: testMonth,
            })
            .expect(201);
        const eventFilesRes = await request(app.getHttpServer())
            .get('/file-management/files')
            .query({ year: testYear, month: testMonth })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(eventFilesRes.body.files?.some((file: { id?: string }) => file.id === eventFileId)).toBe(true);

        const monthlyResA = await request(app.getHttpServer())
            .get('/attendance-data/monthly-summaries')
            .query({
                year: testYear,
                month: testMonth,
                departmentId: testDepartmentId,
            })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        const monthlySummariesA = monthlyResA.body.monthlySummaries as MonthlySummarySnapshotSource[];
        const snapshotA = buildDailySummarySnapshotMap(monthlySummariesA);
        const beforeDailyCount = monthlySummariesA.flatMap((monthly) => monthly.dailySummaries || []).length;
        const beforeUsedAttendanceCount = monthlySummariesA
            .flatMap((monthly) => monthly.dailySummaries || [])
            .reduce((sum, daily) => sum + (daily.usedAttendances?.length ?? 0), 0);
        const attendanceRequestBuffer = readFileSync(attendanceRequestFilePath);
        const requestUploadRes = await request(app.getHttpServer())
            .post('/file-management/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', attendanceRequestBuffer, attendanceRequestFileName)
            .field('year', testYear)
            .field('month', testMonth)
            .expect(201);
        const requestFileId = requestUploadRes.body.fileId as string;

        const requestReflectRes = await request(app.getHttpServer())
            .post('/file-management/reflect')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                fileIds: [requestFileId],
                employeeIds: testEmployeeIds,
                year: testYear,
                month: testMonth,
            })
            .expect(201);
        const requestFilesRes = await request(app.getHttpServer())
            .get('/file-management/files')
            .query({ year: testYear, month: testMonth })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(requestFilesRes.body.files?.some((file: { id?: string }) => file.id === requestFileId)).toBe(true);

        const monthlyResB = await request(app.getHttpServer())
            .get('/attendance-data/monthly-summaries')
            .query({
                year: testYear,
                month: testMonth,
                departmentId: testDepartmentId,
            })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        const monthlySummariesB = monthlyResB.body.monthlySummaries as MonthlySummarySnapshotSource[];
        const snapshotB = buildDailySummarySnapshotMap(monthlySummariesB);
        const afterDailyCount = monthlySummariesB.flatMap((monthly) => monthly.dailySummaries || []).length;
        const afterUsedAttendanceCount = monthlySummariesB
            .flatMap((monthly) => monthly.dailySummaries || [])
            .reduce((sum, daily) => sum + (daily.usedAttendances?.length ?? 0), 0);
        const changedSummaries = collectDailySummaryChanges(snapshotA.map, snapshotB.map);

        기록한다(
            '월간 요약 비교',
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

        expect(Array.isArray(monthlySummariesA)).toBe(true);
        expect(Array.isArray(monthlySummariesB)).toBe(true);
        expect(afterDailyCount).toBeGreaterThanOrEqual(beforeDailyCount);
        expect(afterUsedAttendanceCount).toBeGreaterThanOrEqual(beforeUsedAttendanceCount);
    });
});
