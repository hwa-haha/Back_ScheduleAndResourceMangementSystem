# 시나리오 E2E 테스트

`test/docs/` 및 `test/scenarios/` 문서를 기반으로 시나리오별로 분리한 E2E 스펙과 **시나리오명·구체적인 테스트 내용**을 정리한 문서입니다.

---

## 1. 파일·시나리오 목록

| 파일 | 시나리오 ID | 시나리오명 |
|------|-------------|------------|
| scenario-SC-ADM-001.e2e-spec.ts | SC-ADM-001 | 근태유형 관리 |
| scenario-SC-ADM-002.e2e-spec.ts | SC-ADM-002 | 부서 권한 관리 |
| scenario-SC-ADM-003.e2e-spec.ts | SC-ADM-003 | 집계 대상 관리 |
| scenario-SC-ADM-004.e2e-spec.ts | SC-ADM-004 | 휴무일정 관리 |
| scenario-SC-ADM-005.e2e-spec.ts | SC-ADM-005 | 파일 업로드 및 반영 |
| scenario-SC-ADM-006.e2e-spec.ts | SC-ADM-006 | 파일 타임라인 조회 및 특정 시점 복원 |
| scenario-SC-ADM-007.e2e-spec.ts | SC-ADM-007 | 근태 기록 조회 |
| scenario-SC-ADM-008.e2e-spec.ts | SC-ADM-008 | 근태 이슈 관리 |
| scenario-SC-ADM-009.e2e-spec.ts | SC-ADM-009 | 근태 기록 수정 |
| scenario-SC-ADM-010.e2e-spec.ts | SC-ADM-010 | 월별 비고 관리 |
| scenario-SC-ADM-011.e2e-spec.ts | SC-ADM-011 | 수정 내역 조회 |
| scenario-SC-ADM-012.e2e-spec.ts | SC-ADM-012 | 스냅샷 저장 |
| scenario-SC-ADM-013.e2e-spec.ts | SC-ADM-013 | 스냅샷 불러오기 및 롤백 |
| scenario-SC-ADM-014.e2e-spec.ts | SC-ADM-014 | 스냅샷 결재 상신 |
| scenario-SC-ADM-015.e2e-spec.ts | SC-ADM-015 | 스냅샷 결재 조회 |
| scenario-SC-ADM-016.e2e-spec.ts | SC-ADM-016 | 파일 삭제 |
| scenario-SC-ADM-017.e2e-spec.ts | SC-ADM-017 | 근태 대시보드 조회 |
| scenario-SC-ADM-018.e2e-spec.ts | SC-ADM-018 | 시수 통계 조회 |
| scenario-SC-ADM-019.e2e-spec.ts | SC-ADM-019 | 프로젝트 할당 관리 |
| scenario-SC-ADM-020.e2e-spec.ts | SC-ADM-020 | 근무 모드 관리 |
| scenario-SC-ADM-021.e2e-spec.ts | SC-ADM-021 | 저장 전 확인 처리 |
| scenario-SC-ADM-022.e2e-spec.ts | SC-ADM-022 | 근태 조회 팝업 실행 |
| scenario-SC-USR-001.e2e-spec.ts | SC-USR-001 | 시수 입력 및 블록 관리 |
| scenario-SC-USR-002.e2e-spec.ts | SC-USR-002 | 내보고서 조회 |
| scenario-SC-USR-003.e2e-spec.ts | SC-USR-003 | 수정요청 응답 제출 |
| scenario-restore-only.e2e-spec.ts | — | 시나리오 DB 복원 (복원 전용) |

---

## 2. 시나리오별 구체적인 테스트 내용

### SC-ADM-001 근태유형 관리

- 목록 조회 시 200 및 응답 컬럼 검증 (id, title 등)
- UC25 근태유형 생성 POST 호출 시 201 및 응답 컬럼 검증
- UC26 근태유형 수정 PATCH 호출 시 200 및 반영 검증
- UC27 생성한 근태유형이 있으면 삭제 시 200 또는 204

### SC-ADM-002 부서 권한 관리

- 부서 목록 조회 시 200 및 응답 컬럼 검증
- 부서별 직원 권한 조회 시 200 및 컬럼 검증 (hasAccessPermission, hasReviewPermission)
- UC30 권한(접근O, 검토X) 저장 후 부서별 권한 조회 시 반영 검증
- UC30 권한(접근O, 검토O) 저장 후 부서별 권한 조회 시 반영 검증
- UC30 권한(접근X, 검토X) 저장 후 부서별 권한 조회 시 반영 검증
- UC30 권한(접근X, 검토O) 저장 후 부서별 권한 조회 시 반영 검증

### SC-ADM-003 집계 대상 관리

- 직원 목록(권한/추가정보) 조회 시 200 및 컬럼 검증
- UC32 직원 추가정보 PATCH 호출 시 200 및 반영 검증 (isExcludedFromSummary)

### SC-ADM-004 휴무일정 관리

- 휴일 목록 조회 시 200 및 응답 컬럼 검증
- UC38 공휴일 생성 POST 호출 시 201 및 응답 컬럼 검증
- UC39 공휴일 수정 PATCH 호출 시 200 또는 404
- UC40 생성한 공휴일이 있으면 삭제 시 200 또는 204
- 특별근태 목록 조회 시 200 및 응답 컬럼 검증
- UC42 특별근태 생성 POST 호출 시 201 또는 400
- UC43 특별근태 수정 PATCH 호출 시 200 또는 404
- UC44 생성한 특별근태가 있으면 삭제 시 200 또는 204

### SC-ADM-005 파일 업로드 및 반영

- UC13 파일 업로드 API 호출 시 파일 없으면 400
- UC13 storage/local-files 파일로 업로드 시 201 및 fileId 검증
- UC13 요청 연·월과 파일 내용 연·월이 다르면 400 및 오류 메시지 검증
- 파일 목록 조회 시 200 및 응답 컬럼 검증
- UC18 반영 작업 생성 API 호출 시 2xx 또는 400
- 반영 후 monthly-summaries에 dailySummaries 존재 여부 조회 시 200 및 컬럼 검증

### SC-ADM-006 파일 타임라인 조회 및 특정 시점 복원

- 파일 목록 조회 시 200
- fileId가 있으면 반영 히스토리 조회 시 이력 배열·컬럼 검증
- UC19 restore-from-history API 호출 시 2xx 및 응답 컬럼 검증

### SC-ADM-007 근태 기록 조회

- 연월·부서로 조회 시 200 및 monthlySummaries 배열·컬럼 검증 (dailySummaries, yyyymm, id, date)

### SC-ADM-008 근태 이슈 관리

- 이슈 목록 조회 시 200 및 응답 컬럼 검증
- by-department로 이슈 목록 조회 시 200 및 본문 검증
- UC22 수정요청 전송 API 호출 시 2xx 또는 400
- 이슈 ID가 있으면 상세 조회 시 200 및 컬럼 검증
- UC23 근태 이슈 반영 apply PATCH 호출 시 2xx 및 보정값 반영 검증

### SC-ADM-009 근태 기록 수정

- 월간 요약 조회 후 dailySummary id로 상세 조회 시 200 및 컬럼 검증
- daily-summaries PATCH 후 enter/leave/reason 반영 및 컬럼 검증
- history 조회 시 200 및 이력 배열·컬럼 검증

### SC-ADM-010 월별 비고 관리

- monthlySummaryId가 있으면 note 조회 시 200 및 컬럼 검증
- note PATCH 후 저장값 일치 및 컬럼 검증

### SC-ADM-011 수정 내역 조회

- dailySummaryId가 있으면 셀 히스토리 조회 시 200 및 이력 배열·컬럼 검증

### SC-ADM-012 스냅샷 저장

- 스냅샷 저장 시 201 또는 200 및 응답 컬럼 검증
- 저장 후 목록 조회 시 200 및 컬럼 검증

### SC-ADM-013 스냅샷 불러오기 및 롤백

- 스냅샷 목록 조회 시 200 및 컬럼 검증
- snapshotId가 있으면 스냅샷 상세 조회 시 200 및 컬럼 검증
- snapshotId가 있으면 restore 호출 시 2xx 및 응답 검증

### SC-ADM-014 스냅샷 결재 상신

- 검토권한자 조회 시 200 및 응답 컬럼 검증
- snapshotId가 있으면 결재 상신 PATCH 시 2xx 및 응답 검증

### SC-ADM-015 스냅샷 결재 조회

- snapshotId가 있으면 결재 content 조회 시 200 및 본문 검증
- UC36 스냅샷 결재 PATCH 호출 시 200 및 approverName 반영 검증

### SC-ADM-016 파일 삭제

- UC14 파일 목록 조회 시 200 및 응답 컬럼 검증
- UC17 fileId가 있으면 파일 삭제 시 200 또는 204

### SC-ADM-017 근태 대시보드 조회

- 부서 스냅샷 조회 시 200 및 본문 검증
- 주차별 직원 리스트 조회 시 200 및 본문 검증
- UC48 직원 근태 상세 조회 시 200 및 컬럼 검증
- 월별 근무내역/근무시간 조회 시 200 및 컬럼 검증
- 월별 직원별 근무시간 조회 시 200 및 컬럼 검증

### SC-ADM-018 시수 통계 조회

- UC69 직원·할당 목록(employees-with-assignments) 조회 시 200
- 직원 통계 조회 시 200 및 응답 컬럼 검증
- 프로젝트 통계 조회 시 200 및 응답 컬럼 검증

### SC-ADM-019 프로젝트 할당 관리

- 프로젝트 목록 조회 시 200 및 응답 컬럼 검증
- employeeId가 있으면 할당 목록 조회 시 200 및 컬럼 검증
- UC78/UC80 assign-projects PUT 호출 시 200 및 응답 검증

### SC-ADM-020 근무 모드 관리

- 전용 API 없음 — UC81/UC82 매핑 없음, 스킵 없이 통과

### SC-ADM-021 저장 전 확인 처리

- 프론트 전용 UC83 — 백엔드 간접 검증용 통과

### SC-ADM-022 근태 조회 팝업 실행

- 파라미터로 monthly-summaries 조회 시 200 및 응답 컬럼 검증

### SC-USR-001 시수 입력 및 블록 관리

- UC52 프로젝트 목록 조회 시 200 및 컬럼 검증
- 월별 시수 조회 시 200 및 응답 컬럼 검증
- 일별 시수 조회 시 200
- assignedProjectId가 있으면 시간 블록 POST 시 201 및 응답 컬럼 검증
- UC57 생성한 블록이 있으면 DELETE 시 200 또는 204

### SC-USR-002 내보고서 조회

- 존재 여부 조회 시 200 및 응답 컬럼 검증
- 확정 보고서 조회 시 200 및 컬럼 검증 (있으면 본문)

### SC-USR-003 수정요청 응답 제출

- 확인할 이슈 목록 조회 시 200 및 응답 컬럼 검증
- 이슈 상세 조회 시 200 및 컬럼 검증
- apply PATCH 시 2xx 및 보정값 반영 검증

### 시나리오 DB 복원 (복원 전용)

- 최신 시나리오 백업 파일로 DB를 복원한다

---

## 3. 공통 구조

- **설정**: `TestSetup`, `TestHelpers`, `e2e데이터ID를준비한다` 사용 (상위 `../utils/` 참조)
- **실행**: `jest-e2e.json`의 `testMatch`에 의해 `test/e2e/**/*.e2e-spec.ts`로 포함됨
- **시나리오만 실행**: `npm run test:e2e:lams:scenarios` (scenario-SC- 로 시작하는 스펙만 실행)
- **복원 전용 실행**: `npm run test:e2e:lams:scenarios:run-restore` (scenario-restore-only만 실행)

---

## 4. 참고

- 시나리오 정의: `apps/lams/test/docs/attendance_scenarios_full.md`, `attendance_usecases.md`
- 검증 노트: `apps/lams/test/scenarios/verification-notes.md`
- 레거시 구조: `test/_archive_legacy/scenarios/specs/scenarios2/`
