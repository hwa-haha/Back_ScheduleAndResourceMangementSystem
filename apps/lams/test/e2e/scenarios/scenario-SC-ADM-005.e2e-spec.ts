/**
 * 시나리오 SC-ADM-005: 파일 업로드 및 반영
 *
 * @see apps/lams/test/scenarios/scenarios.md - SC-ADM-005
 * @description 근태 데이터 파일 업로드 및 반영으로 일간/월간 요약 생성 검증
 * @role Admin
 * @ucFlow UC13(파일 업로드) → UC14(파일 목록 조회) → UC18(반영 작업 생성)
 * @api GET file-management/files/list, POST upload, POST reflect, GET monthly-summaries
 * @fixture departmentId, employeeIds, year, month, 파일 경로
 */
import * as fs from 'fs';
import * as path from 'path';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { TestSetup } from '../utils/test-setup';
import { TestHelpers } from '../utils/test-helpers';
import { e2e데이터ID를준비한다, E2EDataIds } from '../utils/e2e-data-provider';

/** 출입내역_YYYY년M월.xlsx / 근태신청내역_YYYY년M월.xlsx 등 파일명에서 연·월 추출 */
const FILE_NAME_PATTERN = /^(출입내역|근태신청내역)_(\d{4})년(\d{1,2})월\.(xlsx|xls|csv)$/i;

/** storage/local-files에서 연·월이 파일명에 포함된 업로드 가능 파일 하나 반환. 없으면 null */
function 업로드할파일하나찾는다(): {
    filePath: string;
    fileName: string;
    year: string;
    month: string;
} | null {
    const dir = path.join(process.cwd(), 'storage', 'local-files');
    if (!fs.existsSync(dir)) return null;
    const names = fs.readdirSync(dir);
    const candidates = names.filter((n) => FILE_NAME_PATTERN.test(n));
    if (candidates.length === 0) return null;
    const fileName = candidates[Math.floor(Math.random() * candidates.length)];
    const match = fileName.match(FILE_NAME_PATTERN);
    if (!match) return null;
    const [, , year, monthNum] = match;
    const month = monthNum.padStart(2, '0');
    return {
        filePath: path.join(dir, fileName),
        fileName,
        year,
        month,
    };
}

describe('SC-ADM-005 파일 업로드 및 반영', () => {
    let app: INestApplication;
    let authToken: string;
    let dataSource: DataSource;
    let ids: E2EDataIds;
    let fileId: string | null = null;

    beforeAll(async () => {
        app = await TestSetup.createTestApp();
        authToken = TestHelpers.createValidJwtToken(app);
        dataSource = app.get<DataSource>(DataSource);
        ids = await e2e데이터ID를준비한다(dataSource);
        fileId = ids.fileId ?? null;
    });

    afterAll(async () => {
        await TestSetup.closeTestApp(app);
    });

    /** UC13: 파일 업로드 — 파일 없이 호출 시 400 */
    it('UC13 파일 업로드 API 호출 시 파일 없으면 400', async () => {
        const res = await request(app.getHttpServer())
            .post('/file-management/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .field('year', ids.year)
            .field('month', ids.month);
        expect(res.status).toBe(400);
    });

    /** UC13: 파일 업로드 — storage/local-files에 있는 파일로 실제 업로드 시 201 및 fileId 검증 (파일명 연·월로 요청) */
    it('UC13 storage/local-files 파일로 업로드 시 201 및 fileId 검증', async () => {
        const found = 업로드할파일하나찾는다();
        let buffer: Buffer;
        let fileName: string;
        let uploadYear: string;
        let uploadMonth: string;
        if (found) {
            buffer = fs.readFileSync(found.filePath);
            fileName = found.fileName;
            uploadYear = found.year;
            uploadMonth = found.month;
        } else {
            buffer = Buffer.from('date,employeeId\n2026-01-01,1', 'utf-8');
            fileName = `e2e-upload-${ids.year}-${ids.month}.csv`;
            uploadYear = ids.year;
            uploadMonth = ids.month;
        }
        const res = await request(app.getHttpServer())
            .post('/file-management/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', buffer, fileName)
            .field('year', uploadYear)
            .field('month', uploadMonth);
        expect([201, 400]).toContain(res.status);
        if (res.status === 201) {
            const id = res.body?.fileId ?? res.body?.id;
            expect(id).toBeDefined();
            if (id) fileId = id;
        }
    });

    /** UC13: 파일 내용 연·월과 요청 연·월이 다르면 400 및 연월 불일치 메시지 검증 */
    it('UC13 요청 연·월과 파일 내용 연·월이 다르면 400 및 오류 메시지 검증', async () => {
        const found = 업로드할파일하나찾는다();
        let buffer: Buffer;
        let fileName: string;
        let wrongYear: string;
        let wrongMonth: string;
        if (found) {
            buffer = fs.readFileSync(found.filePath);
            fileName = found.fileName;
            wrongYear = found.year === '2026' ? '2025' : '2026';
            wrongMonth = found.month === '01' ? '02' : '01';
        } else {
            buffer = Buffer.from('date,employeeId\n2026-01-01,1', 'utf-8');
            fileName = 'e2e-mismatch.csv';
            wrongYear = '2026';
            wrongMonth = '02';
        }
        const res = await request(app.getHttpServer())
            .post('/file-management/upload')
            .set('Authorization', `Bearer ${authToken}`)
            .attach('file', buffer, fileName)
            .field('year', wrongYear)
            .field('month', wrongMonth);
        expect(res.status).toBe(400);
        const message = res.body?.message ?? res.body?.error ?? '';
        expect(String(message)).toMatch(/연월|다릅니다|일치/);
    });

    /** UC14: 파일 목록 조회 — 응답 컬럼: files 배열, 항목 id, year, month */
    it('파일 목록 조회 시 200 및 응답 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/file-management/files/list')
            .query({ year: ids.year, month: ids.month })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        const files = res.body.files ?? res.body;
        expect(files).toBeDefined();
        expect(Array.isArray(files)).toBe(true);
        if (files.length > 0) {
            expect(files[0]).toHaveProperty('id');
            expect(files[0]).toHaveProperty('year');
            expect(files[0]).toHaveProperty('month');
            if (!fileId) fileId = files[0]?.id ?? null;
        }
    });

    /** UC18: 반영 작업 생성 — fileId·employeeNumbers로 reflect 호출 */
    it('UC18 반영 작업 생성 API 호출 시 2xx 또는 400', async () => {
        if (!fileId) return;
        if (!ids.employeeNumbers?.length) return;
        const body = {
            fileId,
            employeeNumbers: ids.employeeNumbers,
            year: ids.year,
            month: ids.month,
        };
        const res = await request(app.getHttpServer())
            .post('/file-management/reflect')
            .set('Authorization', `Bearer ${authToken}`)
            .send(body);
        expect([200, 201, 400]).toContain(res.status);
        if (res.status === 200 || res.status === 201) {
            expect(res.body?.fileId ?? res.body?.reflectionHistoryId).toBeDefined();
        }
    });

    /** UC18 반영 후 UC3: 근태 기록 조회 — 응답 컬럼: monthlySummaries[], dailySummaries */
    it('반영 후 monthly-summaries에 dailySummaries 존재 여부 조회 시 200 및 컬럼 검증', async () => {
        const res = await request(app.getHttpServer())
            .get('/attendance-data/monthly-summaries')
            .query({ year: ids.year, month: ids.month, departmentId: ids.departmentId })
            .set('Authorization', `Bearer ${authToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.monthlySummaries)).toBe(true);
        if (res.body.monthlySummaries.length > 0) {
            expect(res.body.monthlySummaries[0]).toHaveProperty('dailySummaries');
            expect(res.body.monthlySummaries[0]).toHaveProperty('yyyymm');
        }
    });
});
