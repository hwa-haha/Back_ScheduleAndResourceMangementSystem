import { INestApplication } from '@nestjs/common';
import { ScenarioContext, createScenarioContext, closeScenarioContext } from '../../utils/scenario-test-setup';
import { createScenarioHttpLogger } from '../../utils/scenario-http-log';
import { formatFieldChange } from '../../utils/scenario-change-log';
import * as request from 'supertest';

describe('시나리오 3: 일간요약 수정 → 변경이력 저장 → 월간요약 반영 (e2e)', () => {
    let app: INestApplication;
    let authToken: string;
    let testEmployeeIds: string[] = [];
    let testDepartmentId: string;
    let context: ScenarioContext;

    const testYear = '2025';
    const testMonth = '11';
    const { 기록한다, 저장한다 } = createScenarioHttpLogger('scenario2-3.http-log.txt');

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

    it('일간요약 수정 후 월간요약 반영', async () => {
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
        const monthlySummaries = monthlyRes.body.monthlySummaries as Array<{
            dailySummaries: Array<{
                id: string;
                enter?: string | null;
                leave?: string | null;
                history?: Array<unknown>;
            }>;
        }>;
        const dailySummary = monthlySummaries?.[0]?.dailySummaries?.[0];
        const dailySummaryId = dailySummary?.id;
        if (!dailySummaryId) {
            throw new Error('수정할 일간요약 ID를 찾을 수 없습니다.');
        }
        const beforeEnter = dailySummary.enter;
        const beforeLeave = dailySummary.leave;
        const beforeHistoryCount = dailySummary.history?.length ?? 0;
        await request(app.getHttpServer())
            .patch(`/attendance-data/daily-summaries/${dailySummaryId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                enter: '09:00:00',
                leave: '18:00:00',
                reason: '시나리오 3 테스트 수정',
            })
            .expect(200);

        const updatedMonthlyRes = await request(app.getHttpServer())
            .get('/attendance-data/monthly-summaries')
            .query({
                year: testYear,
                month: testMonth,
                departmentId: testDepartmentId,
            })
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        expect(updatedMonthlyRes.body).toHaveProperty('monthlySummaries');
        expect(Array.isArray(updatedMonthlyRes.body.monthlySummaries)).toBe(true);

        const updatedDailySummary = updatedMonthlyRes.body.monthlySummaries
            .flatMap((monthly: { dailySummaries?: Array<{ id: string }> }) => monthly.dailySummaries || [])
            .find((summary: { id: string }) => summary.id === dailySummaryId);

        expect(updatedDailySummary).toBeTruthy();
        expect(updatedDailySummary.enter).toBe('09:00:00');
        expect(updatedDailySummary.leave).toBe('18:00:00');
        const afterHistoryCount = updatedDailySummary.history?.length ?? 0;
        expect(afterHistoryCount).toBeGreaterThan(beforeHistoryCount);
        expect(updatedDailySummary.enter).not.toBe(beforeEnter);
        expect(updatedDailySummary.leave).not.toBe(beforeLeave);
        기록한다(
            '일간요약 변경 결과',
            {
                method: 'COMPARE',
                url: `/attendance-data/daily-summaries/${dailySummaryId}`,
            },
            {
                status: 200,
                body: {
                    changes: [
                        formatFieldChange('enter', beforeEnter ?? null, updatedDailySummary.enter ?? null),
                        formatFieldChange('leave', beforeLeave ?? null, updatedDailySummary.leave ?? null),
                        formatFieldChange('historyCount', beforeHistoryCount, afterHistoryCount),
                    ],
                },
            },
        );
    });
});
