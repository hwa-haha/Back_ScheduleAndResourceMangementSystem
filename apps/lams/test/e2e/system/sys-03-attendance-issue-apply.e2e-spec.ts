/**
 * 52300 시스템 테스트 SYS-03: 근태 이슈 요청→반영 흐름
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('시스템 (52300) SYS-03 근태 이슈 요청→반영 흐름', () => {
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

    it('단계1·2: 이슈 목록 및 상세 조회 200', async () => {
        await request(app.getHttpServer())
            .get('/attendance-issues')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);
        if (ids.attendanceIssueId) {
            await request(app.getHttpServer())
                .get(`/attendance-issues/${ids.attendanceIssueId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        }
    });
});
