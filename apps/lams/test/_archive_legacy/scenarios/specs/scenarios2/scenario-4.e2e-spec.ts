import { INestApplication } from '@nestjs/common';
import { ScenarioContext, createScenarioContext, closeScenarioContext } from '../../utils/scenario-test-setup';
import { AttendanceIssue } from '../../../../src/refactoring/domain/attendance-issue/attendance-issue.entity';
import { AttendanceIssueStatus } from '../../../../src/refactoring/domain/attendance-issue/attendance-issue.types';
import * as request from 'supertest';

describe('시나리오 4: 근태 이슈 처리 → 일간요약 수정 → 이슈 상태 변경 (e2e)', () => {
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

    it('근태 이슈 보정 → 반영 → 상태 확인', async () => {
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
            dailySummaries: Array<{ id: string; date: string; employeeId: string | null }>;
        }>;
        const dailySummary = monthlySummaries?.[0]?.dailySummaries?.[0];
        if (!dailySummary?.id || !dailySummary.employeeId) {
            throw new Error('근태 이슈를 생성할 일간요약을 찾을 수 없습니다.');
        }
        const issueEntity = new AttendanceIssue(dailySummary.employeeId, dailySummary.date, dailySummary.id);
        const savedIssue = await context.dataSource.manager.save(AttendanceIssue, issueEntity);
        const issueId = (savedIssue as unknown as { id: string }).id;

        await request(app.getHttpServer())
            .patch(`/attendance-issues/${issueId}/correction`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                correctedEnterTime: '09:00:00',
                correctedLeaveTime: '18:00:00',
            })
            .expect(200);

        const correctedIssueRes = await request(app.getHttpServer())
            .get(`/attendance-issues/${issueId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(correctedIssueRes.body).toHaveProperty('correctedEnterTime', '09:00:00');
        expect(correctedIssueRes.body).toHaveProperty('correctedLeaveTime', '18:00:00');

        await request(app.getHttpServer())
            .patch(`/attendance-issues/${issueId}/apply`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                confirmedBy: '관리자',
            })
            .expect(200);

        const issueRes = await request(app.getHttpServer())
            .get(`/attendance-issues/${issueId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        expect(issueRes.body).toHaveProperty('status', AttendanceIssueStatus.APPLIED);
    });
});
