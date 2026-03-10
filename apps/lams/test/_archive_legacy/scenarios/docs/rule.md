시나리오 테스트 작성 규칙

## 목적

- 시나리오 문서 작성, 코드 작성, 결과 정리의 일관된 기준을 제공
- 동일한 흐름/검증 방식으로 시나리오가 확장되도록 보장

## 1) 시나리오 문서 작성 규칙

### 1-1. 문서 구성

- 기준 문서: `scenarios.md`
- 보조 문서(검증값 상세): `scenario-verification-notes.md`

### 1-2. 시나리오 기술 형식

- "시나리오 N. ..." 형식으로 제목 작성
- 핵심 시나리오(1~7)와 보조 시나리오(A~F)로 구분
- 각 시나리오에 아래 항목 포함
    - 사용 API (호출 순서 포함)
    - 입력값(파일명, 날짜, 시간, 식별자 등)
    - 검증용 조회
    - 값 변경 검증 계획

### 1-3. 검증값 명세 기준

- 비교값은 실제 테스트 코드의 응답 경로 기준으로 작성
- 예시 형식:
    - `GET /file-management/files`: `before files.length` vs `after files.length`
    - `GET /attendance-data/monthly-summaries`: `sum(monthlySummaries[].dailySummaries.length) > 0`
- "무엇이 바뀌었는지"가 명확히 드러나는 값만 기재

## 2) 시나리오 테스트 코드 작성 규칙

### 2-1. 공통 전제

- 부서/직원 기준: `TEST_DEPARTMENT_ID` 사용
- 시나리오 시작 전 정리: `cleanupScenarioData(dataSource)` 실행
- 실행 순서: 숫자 시나리오(1~7) → 문자 시나리오(A~F)
- 스킵 로직 금지(테스트 제외/skip 금지)

### 2-2. 공통 구조

- 파일명: `scenario-<번호 또는 문자>.e2e-spec.ts`
- 공통 헬퍼 사용:
    - `createScenarioContext()`로 app/authToken/employeeIds 확보
    - `closeScenarioContext()`로 앱 종료

### 2-3. 데이터 준비 규칙

- 테스트 데이터는 시나리오 내부에서 생성
- 시나리오 실행 전 데이터 정리로 충돌 방지
- 파일 업로드는 실제 파일 경로 사용
    - `storage/local-files/전체출입내역_11월.xlsx`
    - `storage/local-files/근태신청관리리스트_212.xlsx`

### 2-4. 검증 규칙

- 모든 시나리오는 "값 비교"를 포함해야 함
- 비교는 반드시 before/after 또는 응답값 일치로 확인
- 예시:
    - `files[].id`에 `fileId` 존재 여부
    - `dailySummaries[].enter/leave` 값 변경 여부
    - 스냅샷 목록 개수 증가 여부
- 단순 상태 코드 확인만으로 종료하지 않음

## 3) 결과 정리 규칙

### 3-1. 결과 기록 위치

- 비교값 상세: `scenario-verification-notes.md`
- 시나리오 흐름 요약: `scenarios.md`

### 3-2. 결과 정리 내용

- 성공/실패만 기록하지 않음
- 실제로 비교한 값(필드/카운트/아이디)을 구체적으로 정리
- API 응답 경로 기준으로 비교값을 명시

## 4) 실행 규칙

### 4-1. 전체 시나리오 실행

- 명령: `npm run test:scenarios`
- 실행 방식: 시나리오 파일을 1개씩 순차 실행

### 4-2. 순서 보장

- `run-scenarios.cjs`에서 파일 정렬 후 단건 실행
- `scenario-6-1` 같이 하이픈 포함 번호는 숫자 순서 유지
