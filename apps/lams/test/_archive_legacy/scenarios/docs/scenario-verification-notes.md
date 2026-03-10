시나리오 실행/검증 정리 문서

## 목적

- 시나리오 테스트에서 실제로 비교하는 값(필드/카운트/아이디)을 구체적으로 정리
- 무엇을 바꾸고, 어떤 값이 달라졌는지 확인하는 기준을 명확히 기록

## 공통 전제

- 대상 부서: d2860a56-99e0-4e79-b70e-0461eef212ac (Web파트 지상-Web)
- 연월 공통값: year=2025, month=11
- 시나리오 시작 전 정리: 시나리오 데이터 삭제 후 실행
- 실행 방식: 시나리오 파일을 한 개씩 순차 실행

## 핵심 시나리오

### 시나리오 1. 출입내역 파일 업로드 → 반영 → 일간요약 생성

- 사용 API: GET /file-management/files → POST /file-management/upload → POST /file-management/reflect → GET /file-management/files → GET /attendance-data/monthly-summaries
- 입력값:
    - 파일: `전체출입내역_11월.xlsx`
    - reflect: `employeeIds`, `year`, `month`
- 비교값(응답 경로 기준):
    - GET /file-management/files: `before files.length` vs `after files.length` (after >= before)
    - GET /file-management/files: `files[].id` 에 `uploadRes.body.fileId` 존재
    - GET /attendance-data/monthly-summaries: `sum(monthlySummaries[].dailySummaries.length) > 0`

### 시나리오 2. 근태신청 파일 업로드 → 반영 → 일간요약 재계산

- 사용 API: GET /file-management/files → GET /attendance-data/monthly-summaries → POST /file-management/upload → POST /file-management/reflect → GET /file-management/files → GET /attendance-data/monthly-summaries
- 입력값:
    - 파일: `근태신청관리리스트_212.xlsx`
    - reflect: `employeeIds`, `year`, `month`
- 비교값(응답 경로 기준):
    - GET /file-management/files: `before files.length` vs `after files.length` (after >= before)
    - GET /file-management/files: `files[].id` 에 `uploadRes.body.fileId` 존재
    - GET /attendance-data/monthly-summaries: `beforeUsedAttendanceCount` vs `afterUsedAttendanceCount` (after >= before)
        - `usedAttendances` 합산 기준: `sum(monthlySummaries[].dailySummaries[].usedAttendances.length)`

### 시나리오 3. 일간요약 수정 → 변경이력 저장 → 월간요약 반영

- 사용 API: POST /file-management/upload → POST /file-management/reflect → GET /attendance-data/monthly-summaries → PATCH /attendance-data/daily-summaries/:id → GET /attendance-data/monthly-summaries
- 입력값:
    - PATCH 본문: `enter=09:00:00`, `leave=18:00:00`, `reason=시나리오 3 테스트 수정`
- 비교값(응답 경로 기준):
    - GET /attendance-data/monthly-summaries: `dailySummaries[].id` 중 수정 대상 선택
    - PATCH 이후 GET /attendance-data/monthly-summaries:
        - `dailySummaries[].enter === "09:00:00"`
        - `dailySummaries[].leave === "18:00:00"`
        - `dailySummaries[].history.length` 가 수정 전보다 증가
        - 수정 전 `enter/leave` 값과 수정 후 값이 다른지 확인

### 시나리오 4. 근태 이슈 처리 → 일간요약 수정 → 이슈 상태 변경

- 사용 API: POST /file-management/upload → POST /file-management/reflect → GET /attendance-data/monthly-summaries → PATCH /attendance-issues/:id/correction → GET /attendance-issues/:id → PATCH /attendance-issues/:id/apply → GET /attendance-issues/:id
- 입력값:
    - 보정: `correctedEnterTime=09:00:00`, `correctedLeaveTime=18:00:00`
    - 반영: `confirmedBy=관리자`
- 비교값(응답 경로 기준):
    - GET /attendance-issues/:id: `correctedEnterTime === "09:00:00"`
    - GET /attendance-issues/:id: `correctedLeaveTime === "18:00:00"`
    - GET /attendance-issues/:id: `status === "APPLIED"`

### 시나리오 5. 월간요약 확정 → 스냅샷 저장

- 사용 API: POST /file-management/upload → POST /file-management/reflect → GET /attendance-data/monthly-summaries → GET /attendance-data/snapshots → POST /attendance-data/snapshots → GET /attendance-data/snapshots
- 입력값:
    - 스냅샷: `snapshotName=시나리오 5 스냅샷`, `description=시나리오 5 테스트용 스냅샷`
- 비교값(응답 경로 기준):
    - GET /attendance-data/snapshots: `before snapshots.length` vs `after snapshots.length` (after > before)
    - POST /attendance-data/snapshots: `snapshotRes.body.snapshot` 존재

### 시나리오 6. 스냅샷 목록 조회 → 스냅샷 복원

- 사용 API: POST /file-management/upload → POST /file-management/reflect → POST /attendance-data/snapshots → GET /attendance-data/monthly-summaries → GET /attendance-data/snapshots → POST /attendance-data/snapshots/restore → GET /attendance-data/monthly-summaries
- 입력값:
    - 복원: `snapshotId=POST /attendance-data/snapshots` 응답값
- 비교값(응답 경로 기준):
    - POST /attendance-data/snapshots/restore: `restoreRes.body.snapshotId` 존재
    - GET /attendance-data/monthly-summaries: `beforeDailyCount` vs `afterDailyCount` (after >= before)

### 시나리오 6-1. 여러 스냅샷 중 선택 복원

- 사용 API: POST /file-management/upload → POST /file-management/reflect → POST /attendance-data/snapshots(2회) → GET /attendance-data/snapshots → POST /attendance-data/snapshots/restore → GET /attendance-data/monthly-summaries
- 입력값:
    - 복원: `selectedSnapshotId = snapshots[1].id`
- 비교값(응답 경로 기준):
    - POST /attendance-data/snapshots/restore: `restoreRes.body.snapshotId === selectedSnapshotId`
    - GET /attendance-data/monthly-summaries: `beforeDailyCount` vs `afterDailyCount` (after >= before)

### 시나리오 7. 파일 반영 이력 복원 → 요약 재생성

- 사용 API: POST /file-management/upload → POST /file-management/reflect → GET /file-management/files → POST /file-management/restore-from-history → GET /attendance-data/monthly-summaries → GET /attendance-data/monthly-summaries
- 입력값:
    - 복원: `reflectionHistoryId = files[].reflectionHistories[0].id`
- 비교값(응답 경로 기준):
    - GET /attendance-data/monthly-summaries: `beforeDailyCount` vs `afterDailyCount` (after >= before)

## 비핵심(보조) 시나리오

### 시나리오 A. 조직(부서) 조회

- 사용 API: GET /organization-management/departments
- 비교값(응답 경로 기준):
    - `flatList[].id` 에 대상 부서 ID 존재

### 시나리오 B. 파일 목록 및 반영 이력 조회

- 사용 API: GET /file-management/files (2회)
- 비교값(응답 경로 기준):
    - 첫 조회 `files.length` 와 두 번째 조회 `files.length` 동일

### 시나리오 C. 직원 추가 정보 관리

- 사용 API: PATCH /settings/employee-extra-info
- 입력값: `isExcludedFromSummary=true`
- 비교값(응답 경로 기준):
    - `extraInfo.isExcludedFromSummary === true`

### 시나리오 D. 직원-부서 권한 관리

- 사용 API: GET /settings/departments → PATCH /settings/permissions
- 입력값: `hasAccessPermission=true`, `hasReviewPermission=false`
- 비교값(응답 경로 기준):
    - `permission.hasAccessPermission === true`
    - `permission.hasReviewPermission === false`

### 시나리오 E. 휴일/특별근태시간 관리

- 사용 API: GET/POST/PATCH/DELETE /settings/holidays, GET/POST/PATCH/DELETE /settings/work-time-overrides
- 입력값:
    - 휴일: `holidayDate=2099-12-29`, `holidayName=시나리오 E 휴일`
    - 특별근태시간: `date=2099-12-30`, `startWorkTime=10:00:00`, `endWorkTime=19:00:00`
- 비교값(응답 경로 기준):
    - POST /settings/holidays: `holidayInfo.id` 존재
    - POST /settings/work-time-overrides: `workTimeOverride.id` 존재
    - DELETE 후 GET /settings/holidays: `holidays[].id` 에 `holidayId` 없음
    - DELETE 후 GET /settings/work-time-overrides: `workTimeOverrides[].id` 에 `workTimeOverrideId` 없음

### 시나리오 F. 설정 변경 후 요약 재반영

- 사용 API: POST /settings/holidays → PATCH /settings/holidays → GET /attendance-data/monthly-summaries → POST /file-management/upload → POST /file-management/reflect → GET /attendance-data/monthly-summaries → DELETE /settings/holidays
- 입력값:
    - 휴일: `holidayDate=2099-12-28`, `holidayName=시나리오 F 휴일`
    - 파일: `전체출입내역_11월.xlsx`
- 비교값(응답 경로 기준):
    - GET /attendance-data/monthly-summaries: `beforeDailyCount` vs `afterDailyCount` (after >= before)
