# LAMS API 엔드포인트 목록

> auth 제외, 전역 prefix: `/api` (실제 호출 시 `/api` 접두사 사용)

---

## 1. 출입/근태 데이터 (attendance-data)

| Method | Path | 설명 |
|--------|------|------|
| GET | /attendance-data/monthly-summaries | 월간 요약 조회 |
| PATCH | /attendance-data/daily-summaries/:id | 일간 요약 수정 |
| GET | /attendance-data/daily-summaries/:id/history | 일간 요약 수정이력 조회 |
| GET | /attendance-data/daily-summaries/:id | 일간 요약 상세 조회 |
| POST | /attendance-data/snapshots | 근태 스냅샷 저장 |
| POST | /attendance-data/snapshots/restore | 스냅샷으로부터 복원 |
| GET | /attendance-data/snapshots | 스냅샷 목록 조회 |
| GET | /attendance-data/snapshots/:id | 스냅샷 상세 조회 |
| GET | /attendance-data/monthly-summaries/:id/note | 월간 요약 노트 조회 |
| PATCH | /attendance-data/monthly-summaries/:id/note | 월간 요약 노트 수정 |

---

## 2. 근태 이슈 (attendance-issues)

| Method | Path | 설명 |
|--------|------|------|
| GET | /attendance-issues | 근태 이슈 목록 조회 |
| GET | /attendance-issues/by-department | 연월/부서별 근태 이슈 조회 |
| GET | /attendance-issues/:id | 근태 이슈 상세 조회 |
| PATCH | /attendance-issues/:id/description | 근태 이슈 사유 수정 |
| PATCH | /attendance-issues/:id/apply | 근태 이슈 반영 |
| PATCH | /attendance-issues/:id/re-request | 근태 이슈 재요청 |

---

## 3. 대시보드 (dashboard)

| Method | Path | 설명 |
|--------|------|------|
| GET | /dashboard/department/monthly-average-work-hours | 부서별 월별 일평균 근무시간 조회 |
| GET | /dashboard/department/monthly-employee-attendance | 부서별 월별 직원별 근무내역 조회 |
| GET | /dashboard/department/weekly-top-employees | 부서별 월별 주차별 주간근무시간 상위 5명 조회 |
| GET | /dashboard/department/snapshots | 부서별 연도·월별 스냅샷 조회 |
| GET | /dashboard/employee/attendance-detail | 연도·월별 직원 근태상세 조회 |

---

## 4. 파일 관리 (file-management)

| Method | Path | 설명 |
|--------|------|------|
| POST | /file-management/upload | 파일 업로드 |
| POST | /file-management/reflect | 파일 내용 반영 |
| POST | /file-management/restore-from-history | 이력으로 되돌리기 |
| GET | /file-management/files/list | 파일 목록 조회 |
| GET | /file-management/files/:fileId/reflection-history | 반영이력 조회 |
| GET | /file-management/files/:fileId/org-data | 파일 orgData 조회 |
| GET | /file-management/files/:id/download | 파일 다운로드 |
| DELETE | /file-management/files/:id | 파일 삭제 |

---

## 5. 조직 관리 (organization-management)

| Method | Path | 설명 |
|--------|------|------|
| GET | /organization-management/departments | 부서 목록 조회 |

---

## 6. 설정 (settings)

| Method | Path | 설명 |
|--------|------|------|
| GET | /settings/permissions/departments | 권한 관리용 부서 목록 조회 |
| GET | /settings/permissions/employees | 권한 관련 직원 목록 조회 |
| GET | /settings/permissions/employees/:employeeId | 직원의 권한 목록 조회 |
| PATCH | /settings/permissions | 직원-부서 권한 변경 |
| PATCH | /settings/employee-extra-info | 직원 추가 정보 변경 |
| GET | /settings/holidays | 휴일 목록 조회 |
| POST | /settings/holidays | 휴일 정보 생성 |
| PATCH | /settings/holidays | 휴일 정보 수정 |
| DELETE | /settings/holidays | 휴일 정보 삭제 |
| GET | /settings/work-time-overrides | 특별근태시간 목록 조회 |
| POST | /settings/work-time-overrides | 특별근태시간 생성 |
| PATCH | /settings/work-time-overrides | 특별근태시간 수정 |
| DELETE | /settings/work-time-overrides | 특별근태시간 삭제 |
| GET | /settings/attendance-types | 근태유형 목록 조회 |
| POST | /settings/attendance-types | 근태유형 생성 |
| PATCH | /settings/attendance-types/:id | 근태유형 수정 |
| DELETE | /settings/attendance-types/:id | 근태유형 삭제 |

---

## 7. 시수 관리 (work-hours)

| Method | Path | 설명 |
|--------|------|------|
| POST | /work-hours/assign-project | 프로젝트 할당 |
| DELETE | /work-hours/assign-project/:id | 프로젝트 할당 제거 |
| POST | /work-hours/work-hours | 시수 입력 |
| DELETE | /work-hours/work-hours/by-date/:date | 날짜별 시수 삭제 |
| GET | /work-hours/monthly | 월별 시수 현황 조회 |
| GET | /work-hours/projects | 프로젝트 목록 조회 |
| GET | /work-hours/wage-calculation-types | 임금 계산 유형 목록 조회 |
| POST | /work-hours/wage-calculation-types | 임금 계산 유형 생성 |
