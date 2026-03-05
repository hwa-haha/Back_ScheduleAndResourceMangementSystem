/**
 * 52300 시스템 테스트 SYS-02: 스냅샷 저장 후 목록·상세 조회
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('시스템 (52300) SYS-02 스냅샷 저장 후 복원 가능', () => {
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

    it('단계1·2: 스냅샷 저장 후 목록·상세 조회', async () => {
        const res = await request(app.getHttpServer())
            .post('/attendance-data/snapshots')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                year: ids.year,
                month: ids.month,
                departmentId: ids.departmentId,
                description: 'SYS-02',
            });
        expect([200, 201]).toContain(res.status);
        if (res.status === 201 && res.body?.snapshot?.id) {
            await request(app.getHttpServer())
                .get('/attendance-data/snapshots')
                .query({ year: ids.year, month: ids.month })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
            await request(app.getHttpServer())
                .get(`/attendance-data/snapshots/${res.body.snapshot.id}`)
                .query({ departmentId: ids.departmentId })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        }
    });
});
