# LAMS 테스트 (52100·52200·52300)

단위·통합·시스템 테스트를 모두 `test/e2e/` 아래에서 관리합니다.

## 구조

| 경로 | 문서 | 설명 |
| ------ | ------ | ------ |
| `e2e/utils/` | - | test-setup, test-helpers, e2e-data-provider |
| `e2e/unit/` | 52100 | 단위 테스트: domain 서비스 등 (*.spec.ts) |
| `e2e/integration/` | 52200 | 통합 테스트: attendance-data, attendance-issue, settings, approval, user, dashboard, file-management, organization-management, work-hours (*.e2e-spec.ts) |
| `e2e/system/` | 52300 | 시스템 테스트: SYS-01~05 (*.e2e-spec.ts) |

## 실행

**단위 (52100)**  
모노레포 루트에서. `roots`에 `apps/`가 포함되어 있어 `test/e2e/unit/**/*.spec.ts` 자동 포함:

```bash
npm run test
```

**E2E (통합·시스템)**  
`jest-e2e.json` 기준 `test/e2e/**/*.e2e-spec.ts`만 실행:

```bash
npm run test:e2e
```

**통합 테스트만 실행 (52200)**  
통합 테스트는 `AppModule` 전체를 올리며 **실제 DB 연결**이 필요합니다.

```bash
npm run test:e2e -- --testPathPattern=integration
```

**시스템 테스트만 실행 (52300)**

```bash
npm run test:e2e -- --testPathPattern=system
```

**통합·시스템 테스트 DB 설정**  
`apps/lams/.env.e2e` 파일이 있으면 e2e 실행 시 자동으로 로드됩니다.  
필수 항목: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_SCHEMA`, `JWT_SECRET`  
예시는 동일 경로의 `.env.e2e` 참고. (모노레포 루트에서 실행 시 `apps/lams/.env.e2e` 사용)
