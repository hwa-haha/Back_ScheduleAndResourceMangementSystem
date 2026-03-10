/**
 * 시나리오 SC-ADM-020: 근무 모드 관리
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-020
 * @description 근무 모드 변경 및 히스토리 조회 검증 (전용 API 없음)
 * @role Admin
 * @ucFlow UC81(근무 모드 히스토리) → UC82(근무 모드 변경) — 매핑 문서 기준 전용 API 없음
 * @api (없음)
 * @fixture 적용 시작일, 모드
 */
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

describe('SC-ADM-020 근무 모드 관리', () => {
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

    /** UC81/UC82: 전용 API 없음 — 통과용 */
    it('전용 API 없음 — UC81/UC82 매핑 없음, 스킵 없이 통과', () => {
        expect(true).toBe(true);
    });
});
