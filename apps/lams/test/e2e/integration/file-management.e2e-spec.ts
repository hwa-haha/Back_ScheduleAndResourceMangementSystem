/**
 * 52200 통합 테스트: file-management
 */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';

describe('통합 (52200) file-management', () => {
    let app: INestApplication;
    let authToken: string;

    beforeAll(async () => {
        app = await TestSetup.createTestApp();
        authToken = TestHelpers.createValidJwtToken(app);
    });

    afterAll(async () => {
        await TestSetup.closeTestApp(app);
    });

    describe('GET /file-management/files/list', () => {
        const listQuery = { year: '2026', month: '01' };
        it('정상: year, month 쿼리로 조회 시 200', async () => {
            await request(app.getHttpServer())
                .get('/file-management/files/list')
                .query(listQuery)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);
        });
        it('오류: 토큰 없이 호출 시 401', async () => {
            await request(app.getHttpServer())
                .get('/file-management/files/list')
                .query(listQuery)
                .expect(401);
        });
        it('오류: year 누락 시 400', async () => {
            await request(app.getHttpServer())
                .get('/file-management/files/list')
                .query({ month: '01' })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
    });

    describe('GET /file-management/files/:id/download', () => {
        it('오류: 존재하지 않는 파일 ID로 다운로드 시 404', async () => {
            await request(app.getHttpServer())
                .get('/file-management/files/00000000-0000-0000-0000-000000000000/download')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('DELETE /file-management/files/:id', () => {
        it('오류: 존재하지 않는 파일 ID로 삭제 시 404', async () => {
            await request(app.getHttpServer())
                .delete('/file-management/files/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });
});
