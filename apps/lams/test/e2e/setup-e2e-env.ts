/**
 * 통합·시스템 테스트 실행 전 .env.e2e 로드
 * jest-e2e.json 의 setupFilesAfterEnv 에서 사용됩니다.
 */
import * as path from 'path';
import * as dotenv from 'dotenv';

const candidates = [
    path.resolve(process.cwd(), 'apps', 'lams', '.env.e2e'),
    path.resolve(process.cwd(), '.env.e2e'),
];
for (const envPath of candidates) {
    const result = dotenv.config({ path: envPath });
    if (!result.error) break;
}
