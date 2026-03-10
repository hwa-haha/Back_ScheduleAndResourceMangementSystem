# LAMS Interface API 목록

> 기준: `apps/lams/src/interface`  
> 공통 prefix: `/api`

---

## 1. user (업무관리시스템 유저)

| 메소드 | URL                                   | 설명                                             |
| ------ | ------------------------------------- | ------------------------------------------------ |
| GET    | /api/user/attendance-issues-to-review | 확인할 근태 이슈 목록 (상태=request, 연·월 필터) |
| GET    | /api/user/confirmed-monthly-report    | 전월 근태현황보고서 확정 정보                    |
| GET    | /api/user/monthly-report-existence    | 월별 근태현황 보고서 존재 여부                   |
| GET    | /api/user/monthly-submitted-snapshots | 연월별 제출된 최신 스냅샷 목록                   |

---

## 2. dashboard (대시보드)

| 메소드 | URL                                                   | 설명                                          |
| ------ | ----------------------------------------------------- | --------------------------------------------- |
| GET    | /api/dashboard/department/monthly-average-work-hours  | 부서별 월별 일평균 근무시간 조회              |
| GET    | /api/dashboard/department/monthly-employee-work-hours | 부서별 월별 직원별 근무시간 조회              |
| GET    | /api/dashboard/department/monthly-employee-attendance | 부서별 월별 직원별 근무내역 조회              |
| GET    | /api/dashboard/department/weekly-top-employees        | 부서별 월별 주차별 주간근무시간 상위 5명 조회 |
| GET    | /api/dashboard/department/snapshots                   | 부서별 연도·월별 스냅샷 조회                  |
| GET    | /api/dashboard/employee/attendance-detail             | 연도·월별 직원 근태상세 조회                  |

---

## 3. attendance-data (근태 데이터)

| 메소드 | URL                                                        | 설명                            |
| ------ | ---------------------------------------------------------- | ------------------------------- |
| GET    | /api/attendance-data/monthly-summaries                     | 월간 요약 조회                  |
| PATCH  | /api/attendance-data/daily-summaries/:id                   | 일간 요약 수정                  |
| GET    | /api/attendance-data/daily-summaries/:id/history           | 일간 요약 수정이력 조회         |
| GET    | /api/attendance-data/daily-summaries/:id                   | 일간 요약 상세 조회             |
| POST   | /api/attendance-data/snapshots                             | 근태 스냅샷 저장                |
| POST   | /api/attendance-data/snapshots/restore                     | 스냅샷으로부터 복원             |
| GET    | /api/attendance-data/employees/:employeeId/snapshot-exists | 직원 연월 스냅샷 존재 여부 조회 |
| GET    | /api/attendance-data/snapshots                             | 스냅샷 목록 조회                |
| GET    | /api/attendance-data/snapshots/:id                         | 스냅샷 상세 조회                |
| GET    | /api/attendance-data/monthly-summaries/:id/note            | 월간 요약 노트 조회             |
| PATCH  | /api/attendance-data/monthly-summaries/:id/note            | 월간 요약 노트 수정             |

---

## 4. attendance-issues (근태 이슈)

| 메소드 | URL                                          | 설명                              |
| ------ | -------------------------------------------- | --------------------------------- |
| GET    | /api/attendance-issues                       | 근태 이슈 목록 조회               |
| GET    | /api/attendance-issues/by-department         | 연월/부서별 근태 이슈 조회        |
| GET    | /api/attendance-issues/:id                   | 근태 이슈 상세 조회               |
| POST   | /api/attendance-issues/request-by-year-month | 연월별 근태 이슈 상태별 일괄 처리 |
| POST   | /api/attendance-issues/request               | 근태 이슈 요청 (복수)             |
| POST   | /api/attendance-issues/re-request            | 근태 이슈 재요청 (복수)           |
| POST   | /api/attendance-issues/:id/request           | 근태 이슈 요청 (단건)             |
| POST   | /api/attendance-issues/:id/re-request        | 근태 이슈 재요청 (단건)           |
| PATCH  | /api/attendance-issues/:id/apply             | 근태 이슈 반영                    |
| PATCH  | /api/attendance-issues/:id/description       | 근태 이슈 사유 수정               |

---

## 5. settings (설정)

| 메소드 | URL                                                 | 설명                                     |
| ------ | --------------------------------------------------- | ---------------------------------------- |
| GET    | /api/settings/permissions/departments               | 권한 관리용 부서 목록 조회               |
| GET    | /api/settings/permissions/employees                 | 권한 관련 직원 목록 조회                 |
| GET    | /api/settings/permissions/employees/with-extra-info | 권한 관련 직원 목록 조회 (추가정보 포함) |
| GET    | /api/settings/permissions/employees/:employeeId     | 직원의 권한 목록 조회                    |
| GET    | /api/settings/permissions/departments/:departmentId | 특정 부서별 직원 권한 목록 조회          |
| PATCH  | /api/settings/permissions                           | 부서별 직원 권한 변경                    |
| PATCH  | /api/settings/employee-extra-info                   | 직원 추가 정보 변경                      |
| GET    | /api/settings/holidays                              | 휴일 목록 조회                           |
| POST   | /api/settings/holidays                              | 휴일 정보 생성                           |
| PATCH  | /api/settings/holidays                              | 휴일 정보 수정                           |
| DELETE | /api/settings/holidays                              | 휴일 정보 삭제                           |
| GET    | /api/settings/work-time-overrides                   | 특별근태시간 목록 조회                   |
| POST   | /api/settings/work-time-overrides                   | 특별근태시간 생성                        |
| PATCH  | /api/settings/work-time-overrides                   | 특별근태시간 수정                        |
| DELETE | /api/settings/work-time-overrides                   | 특별근태시간 삭제                        |
| GET    | /api/settings/attendance-types                      | 근태유형 목록 조회                       |
| POST   | /api/settings/attendance-types                      | 근태유형 생성                            |
| PATCH  | /api/settings/attendance-types/:id                  | 근태유형 수정                            |
| DELETE | /api/settings/attendance-types/:id                  | 근태유형 삭제                            |

---

## 6. work-hours (시수)

| 메소드 | URL                                                     | 설명                            |
| ------ | ------------------------------------------------------- | ------------------------------- |
| GET    | /api/work-hours/projects                                | 프로젝트 목록 조회              |
| GET    | /api/work-hours/employees-with-assignments              | 직원 목록 및 할당 프로젝트 조회 |
| GET    | /api/work-hours/employees/:employeeId/assigned-projects | 직원별 할당 프로젝트 목록 조회  |
| GET    | /api/work-hours/statistics/by-employee                  | 시수 통계 조회 (직원 기준)      |
| GET    | /api/work-hours/statistics/by-project                   | 시수 통계 조회 (프로젝트 기준)  |
| PUT    | /api/work-hours/assign-projects                         | 직원 프로젝트 할당 일괄 갱신    |
| POST   | /api/work-hours/work-hours                              | 시수 입력                       |
| PUT    | /api/work-hours/work-hours/:id                          | 시수 수정                       |
| DELETE | /api/work-hours/work-hours/by-date/:date                | 날짜별 시수 삭제                |
| DELETE | /api/work-hours/work-hours/:id                          | 시수 삭제                       |
| GET    | /api/work-hours/monthly                                 | 월별 시수 현황 조회             |
| GET    | /api/work-hours/daily                                   | 일별 시수 상세 조회             |
| GET    | /api/work-hours/wage-calculation-types                  | 임금 계산 유형 목록 조회        |
| POST   | /api/work-hours/wage-calculation-types                  | 임금 계산 유형 생성             |

---

## 7. file-management (파일 관리)

| 메소드 | URL                                                   | 설명                    |
| ------ | ----------------------------------------------------- | ----------------------- |
| POST   | /api/file-management/upload                           | 파일 업로드 (엑셀 검증) |
| POST   | /api/file-management/reflect                          | 파일 내용 반영          |
| POST   | /api/file-management/restore-from-history             | 이력으로 되돌리기       |
| GET    | /api/file-management/files/list                       | 파일 목록 조회          |
| GET    | /api/file-management/files/:fileId/reflection-history | 반영이력 조회           |
| GET    | /api/file-management/files/:fileId/org-data           | 파일 orgData 조회       |
| GET    | /api/file-management/files/:id/download               | 파일 다운로드           |
| DELETE | /api/file-management/files/:id                        | 파일 삭제               |

---

## 8. organization-management (조직 관리)

| 메소드 | URL                                                           | 설명                          |
| ------ | ------------------------------------------------------------- | ----------------------------- |
| GET    | /api/organization-management/departments                      | 부서 목록 조회                |
| GET    | /api/organization-management/departments/by-access-permission | 접근 권한 기반 부서 목록 조회 |
| GET    | /api/organization-management/departments/with-employees       | 부서 목록 + 부서별 직원 조회  |

---

## 9. approval (결재)

| 메소드 | URL                                          | 설명                         |
| ------ | -------------------------------------------- | ---------------------------- |
| GET    | /api/approval/reviewers-by-department        | 결재 관련 부서별 권한자 조회 |
| PATCH  | /api/approval/snapshots/:snapshotId/approval | 결재 시 스냅샷 업데이트      |
| GET    | /api/approval/snapshots/:snapshotId/content  | 결재 시 스냅샷 내용 보기     |
