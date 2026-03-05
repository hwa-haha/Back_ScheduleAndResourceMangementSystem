# 기존 테스트 보관 (Legacy Archive)

개발문서(52100·52200·52300) 기반으로 테스트 구조를 재구성하면서 **기존에 사용하던 e2e 스펙·시나리오·문서**를 여기로 분리 보관했습니다.

## 보관 내용

- **e2e/** — 이전 e2e 스펙: `attendance-data.e2e-spec.ts`, `attendance-issue.e2e-spec.ts`, `dashboard.e2e-spec.ts`, `file-management.e2e-spec.ts`, `organization-management.e2e-spec.ts`, `settings.e2e-spec.ts`, `work-hours.e2e-spec.ts`, `test.md`, `docs/`, `utils/` 복사본
- **scenarios/** — 시나리오 스펙·설정·로그 등 (복사본)
- **test.md** — 이전 테스트 메모

## 신규 테스트 위치

- **통합 테스트(52200)**: `test/e2e/integration/*.e2e-spec.ts`
- **시스템 테스트(52300)**: `test/e2e/system/*.e2e-spec.ts`
- **공통 유틸**: `test/e2e/utils/` (test-setup, test-helpers, e2e-data-provider)

실행은 `jest-e2e.json` 기준 `test/e2e/**/*.e2e-spec.ts` 로 수행합니다.
