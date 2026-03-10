/**
 * 52200 통합 테스트: approval
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('통합 (52200) approval', () => {
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

    describe('GET /approval/reviewers-by-department', () => {
        it('정상: 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/approval/reviewers-by-department')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
    });

    describe('GET /approval/snapshots/:snapshotId/content', () => {
        it('오류: year·month 누락 시 400', async () => {
            await request(app.getHttpServer())
                .get('/approval/snapshots/00000000-0000-0000-0000-000000000000/content')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
        it('오류: 존재하지 않는 스냅샷으로 조회 시 404', async () => {
            await request(app.getHttpServer())
                .get('/approval/snapshots/00000000-0000-0000-0000-000000000000/content')
                .query({ year: ids.year, month: ids.month })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('PATCH /approval/snapshots/:snapshotId/approval', () => {
        it('오류: 존재하지 않는 스냅샷으로 결재 업데이트 시 404', async () => {
            await request(app.getHttpServer())
                .patch('/approval/snapshots/00000000-0000-0000-0000-000000000000/approval')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ approvalStatus: 'SUBMITTED' })
                .expect((res) => {
                    expect([400, 404]).toContain(res.status);
                });
        });
    });
});
