# 시나리오 Jest 테스트 작성 규칙

## 목적

- `attendance_scenarios_full.md`에 정의된 시나리오 25개 전체를 Jest E2E로 검증할 수 있도록 규칙을 둔다.
- 테스트 파일 작성 시 공통 구조·setup·검증 방식을 맞춘다.

## 기준 문서

| 문서 | 용도 |
|------|------|
| `src/interface/attendance_scenarios_full.md` | 시나리오 25개: ID, 역할, UC 흐름, 정책, 예외 처리 |
| `src/interface/USECASE_API_MAPPING.md` | UC별 매핑 API |
| `scenarios/scenarios.md` | 시나리오별 API 호출 순서, Jest describe/it 제안 |
| `scenarios/verification-notes.md` | 응답 경로·expect 예시 |

## Jest 테스트 구조

### 파일·위치

- **파일명**: `scenario-<시나리오ID 또는 이름>.e2e-spec.ts` (예: `scenario-SC-ADM-001.e2e-spec.ts`)
- **위치**: `test/e2e/scenarios/` 또는 `test/scenarios/specs/`

### describe / it

- 최상위: `describe('SC-XXX-nnn 시나리오명', () => { ... })`
- 시나리오 내 단계/API별: `describe('파일 업로드 및 반영', () => { ... })`
- 각 검증 단위: `it('목록 조회 후 업로드 시 파일 개수 증가', async () => { ... })`

### 공통 setup

- `beforeAll`: 앱 부트스트랩, 인증 토큰(또는 테스트 유저) 확보, 필요 시 `cleanupScenarioData` 등으로 초기화
- 테스트용 `departmentId`, `employeeIds`, `year`, `month`는 픽스처 또는 환경 변수로 일관 사용
- API 호출은 `request(app.getHttpServer()).get(...).set('Authorization', ...)` 형태 사용 (기존 e2e 스펙과 동일)

### 검증 방식

- **상태 코드**: `expect(response.status).toBe(200)` (또는 201, 204 등)
- **응답 본문**: `verification-notes.md`의 응답 경로를 사용해 `expect(response.body.xxx).toBeDefined()`, `expect(response.body.files).toContainEqual(expect.objectContaining({ id: fileId }))` 등으로 비교
- **before/after**: 상태 변경 시나리오는 조회 → 액션 → 재조회 후 개수·필드 비교

### 데이터 준비

- 파일 업로드 시나리오: 실제 엑셀 파일 경로 사용 (예: `storage/local-files/전체출입내역_11월.xlsx`)
- 시나리오 간 의존이 있으면 실행 순서를 문서에 명시하고, 필요 시 `beforeAll`에서 선행 시나리오 데이터 준비

## 스킵 금지

- 시나리오로 등록한 테스트는 `it.skip` 없이 모두 실행 가능해야 한다. 환경/데이터가 없으면 setup에서 생성하거나 픽스처로 보장한다.
