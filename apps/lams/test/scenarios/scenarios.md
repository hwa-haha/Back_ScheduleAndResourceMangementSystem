# 시나리오 전체 목록 (25개, Jest 테스트 작성용)

> 출처: `attendance_scenarios_full.md`, `USECASE_API_MAPPING.md`  
> API prefix: `/api` (e2e에서 prefix 제거 시 경로만 사용)

---

## Admin 시나리오 (SC-ADM-001 ~ SC-ADM-022)

### SC-ADM-001. 파일 업로드 및 반영

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 근태 데이터 파일 업로드 및 반영으로 일간/월간 요약 생성 검증 |
| **전제 조건** | Admin 권한, 테스트용 부서·연월 |
| **UC 흐름** | UC13 → UC14 → UC18 |
| **관련 페이지/모달** | ATT_FILE_UPLOAD(L), ATT_FILE_LIST(L), ATT_FILE_APPLY(L) |
| **주요 정책** | 파일관리 탭 사용, 파일 형식 검증, 반영 시 직원·부서 범위 선택, 반영 후 타임라인 추가 |
| **예외 처리** | 잘못된 형식: 업로드 실패/파싱 오류 시 에러 메시지, 트랜잭션 실패 시 롤백 |

**사용 API (호출 순서)**  
1. `GET /api/file-management/files/list`  
2. `POST /api/file-management/upload`  
3. `POST /api/file-management/reflect`  
4. `GET /api/file-management/files/list`  
5. `GET /api/attendance-data/monthly-summaries`

**입력값**  
- 파일: 업로드용 엑셀 경로  
- reflect: employeeIds, year, month, departmentId 등

**Jest 테스트 제안**  
- `describe('SC-ADM-001 파일 업로드 및 반영')`  
- `it('파일 목록 조회 시 200')`, `it('업로드 후 목록에 파일 ID 존재')`, `it('반영 후 monthly-summaries에 dailySummaries 존재')`  
- fixture: departmentId, employeeIds, year, month, 파일 경로

**검증할 컬럼·값** (status 외 실제 응답 필드)  
- list: `body.files[]` 각 항목 `id`, `year`, `month`  
- upload 응답: `fileId`, `fileName`, `year`, `month`  
- monthly-summaries: `monthlySummaries[].dailySummaries`, `employee_id`, `yyyymm`

---

### SC-ADM-002. 파일 타임라인 조회 및 특정 시점 복원

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 업로드 파일의 반영 히스토리 조회 후 특정 시점으로 되돌리기 검증 |
| **전제 조건** | Admin 권한, UC14 완료(파일 목록 존재) |
| **UC 흐름** | UC14 → UC15 → UC19 |
| **관련 페이지/모달** | ATT_FILE_LIST(L), ATT_FILE_DTL(L) |
| **주요 정책** | 파일 선택 시 상세·orgData·타임라인 표시, 특정 시점 선택 시 보기 모드 전환 |
| **예외 처리** | 권한 없음: 접근 거부, 존재하지 않는 파일: 404 |

**사용 API (호출 순서)**  
1. `GET /api/file-management/files/list`  
2. `GET /api/file-management/files/:fileId/reflection-history`  
3. `POST /api/file-management/restore-from-history`  
4. `GET /api/attendance-data/monthly-summaries`

**입력값**  
- fileId, reflectionHistoryId

**Jest 테스트 제안**  
- `describe('SC-ADM-002 파일 타임라인 조회 및 특정 시점 복원')`  
- `it('반영 히스토리 조회 시 이력 배열 존재')`, `it('restore-from-history 호출 시 2xx')`, `it('복원 후 monthly-summaries 조회 시 데이터 일치')`  
- fixture: 업로드·반영된 fileId 또는 시나리오 내 업로드 후 사용

**검증할 컬럼·값**  
- reflection-history: 배열 항목 `id`, `reflectionHistoryId`, `created_at`  
- restore-from-history: `reflectionHistoryId`, `restoreSnapshotResult.year`, `restoreSnapshotResult.month`  
- monthly-summaries: `monthlySummaries[].dailySummaries`, 연월·데이터 일치

---

### SC-ADM-003. 근태 기록 조회 (연월·부서)

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 연월·부서별 근태 기록 조회 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC1 → UC2 → UC3 |
| **관련 페이지/모달** | ATT_MAIN(P) |
| **주요 정책** | 연월 선택 시 자동 조회, 부서 선택 시 데이터 표시, 편집·보기 모드 전환 가능 |
| **예외 처리** | 권한 없음: 403, 데이터 없음: Empty State |

**사용 API (호출 순서)**  
1. `GET /api/attendance-data/monthly-summaries?year=...&month=...&departmentId=...`

**입력값**  
- year, month, departmentId(선택)

**Jest 테스트 제안**  
- `describe('SC-ADM-003 근태 기록 조회')`  
- `it('연월·부서로 조회 시 200 및 monthlySummaries 배열 존재')`, `it('권한 없는 부서 요청 시 403')`(선택)  
- fixture: year, month, departmentId

**검증할 컬럼·값**  
- `monthlySummaries[]`: 각 항목 `employee_id`, `yyyymm`, `dailySummaries`  
- `dailySummaries[]`: `id`, `date`, `enter`, `leave`

---

### SC-ADM-004. 근태 이슈 관리

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 이슈 조회 및 수정요청 전송·반영 검증 |
| **전제 조건** | Admin 권한, UC1·UC2 완료 |
| **UC 흐름** | UC21 → UC22 → UC23 |
| **관련 페이지/모달** | ATT_ISSUE_LIST(P), ATT_ISSUE_CONFIRM(L) |
| **주요 정책** | 헤더 검토사항 버튼 진입, 부서 필터, 미처리 배지, 수정요청 알림 발송 |
| **예외 처리** | 존재하지 않는 이슈: 404, 알림 실패: 재시도, 트랜잭션 실패: 롤백 |

**사용 API (호출 순서)**  
1. `GET /api/attendance-issues` 또는 `GET /api/attendance-issues/by-department`  
2. `POST /api/attendance-issues/request` 또는 `POST /api/attendance-issues/:id/request`  
3. `PATCH /api/attendance-issues/:id/apply`  
4. `GET /api/attendance-issues/:id`

**입력값**  
- year, month, departmentId(목록), 이슈 id, apply 본문(correctedEnterTime, correctedLeaveTime 등)

**Jest 테스트 제안**  
- `describe('SC-ADM-004 근태 이슈 관리')`  
- `it('이슈 목록 조회 시 200')`, `it('수정요청 전송 시 2xx')`, `it('apply 후 이슈 상세에서 status APPLIED, 보정값 일치')`  
- fixture: departmentId, 이슈 id(또는 목록에서 추출)

**검증할 컬럼·값**  
- 목록: `issues[].id`, `issues[].status`, `issues[].employeeId`  
- apply 후 상세: `status`='APPLIED', `correctedEnterTime`, `correctedLeaveTime`, `appliedAt`

---

### SC-ADM-005. 근태 기록 수정 (셀 수정)

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 특정 직원 근태 기록(출입시간·유형·비고) 수정 검증 |
| **전제 조건** | Admin 권한, 편집 모드 |
| **UC 흐름** | UC3 → UC4 → UC5 |
| **관련 페이지/모달** | ATT_MAIN(P), ATT_REC_DTL(L), ATT_REC_EDIT(L) |
| **주요 정책** | 출입시간·유형·비고 수정, 셀 클릭 시 수정 모달, 변경 이력 기록 |
| **예외 처리** | 필수값 누락: 저장 불가, 보기 모드: 수정 불가, 트랜잭션 실패 |

**사용 API (호출 순서)**  
1. `GET /api/attendance-data/monthly-summaries`  
2. `GET /api/attendance-data/daily-summaries/:id`  
3. `PATCH /api/attendance-data/daily-summaries/:id`  
4. `GET /api/attendance-data/daily-summaries/:id/history`

**입력값**  
- dailySummary id, PATCH 본문(enter, leave, reason 등)

**Jest 테스트 제안**  
- `describe('SC-ADM-005 근태 기록 수정')`  
- `it('daily-summaries PATCH 후 enter/leave/reason 반영')`, `it('history 조회 시 수정 후 length 증가')`  
- fixture: dailySummaryId

**검증할 컬럼·값**  
- PATCH 응답: `enter`, `leave`, `reason`, `id`, `date` = 요청값 반영  
- history: 배열 항목 `enter`, `leave`, `changed_at`; PATCH 후 length 증가

---

### SC-ADM-006. 월별 비고 관리

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 월별 비고 조회 및 수정 검증 |
| **전제 조건** | Admin 권한, 편집 모드 |
| **UC 흐름** | UC3 → UC6 → UC7 |
| **관련 페이지/모달** | ATT_MAIN(P), ATT_REMARKS(L) |
| **주요 정책** | 편집 모드에서만 수정 가능, 보기 모드 읽기 전용 |
| **예외 처리** | 권한 없음: 접근 거부, 편집 모드 비활성화 시 수정 불가 |

**사용 API (호출 순서)**  
1. `GET /api/attendance-data/monthly-summaries`  
2. `GET /api/attendance-data/monthly-summaries/:id/note`  
3. `PATCH /api/attendance-data/monthly-summaries/:id/note`

**입력값**  
- monthlySummary id(또는 직원·연월로 확보), note 본문

**Jest 테스트 제안**  
- `describe('SC-ADM-006 월별 비고 관리')`  
- `it('note 조회 시 200')`, `it('note PATCH 후 저장값 일치')`  
- fixture: monthlySummaryId

**검증할 컬럼·값**  
- note GET: `note`(string|null), `monthlySummaryId`  
- note PATCH: `note` = 요청 본문과 동일

---

### SC-ADM-007. 수정 내역 조회

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 근태 기록 수정 이력 조회 검증 |
| **전제 조건** | Admin 권한, UC1 완료 |
| **UC 흐름** | UC1 → UC20 |
| **관련 페이지/모달** | ATT_HIST_LIST(L) |
| **주요 정책** | 하단 패널 수정내역 탭, 셀 클릭 시 수정 이력 표시, 필터 제공 |
| **예외 처리** | 권한 없음, 데이터 없음 |

**사용 API (호출 순서)**  
1. `GET /api/attendance-data/monthly-summaries` (dailySummary id 확보)  
2. `GET /api/attendance-data/daily-summaries/:id/history`

**입력값**  
- dailySummary id

**Jest 테스트 제안**  
- `describe('SC-ADM-007 수정 내역 조회')`  
- `it('셀 히스토리 조회 시 200 및 이력 배열 존재')`  
- fixture: dailySummaryId

**검증할 컬럼·값**  
- history 배열: 각 항목 `id`, `enter`, `leave`, `changed_at`, `reason`

---

### SC-ADM-008. 스냅샷 저장

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 현재 근태 데이터를 스냅샷으로 저장 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC3 → UC10 |
| **관련 페이지/모달** | ATT_MAIN(P), ATT_SNAP_NEW(L) |
| **주요 정책** | 설명 필수, 전체 데이터 저장, 트랜잭션 처리 |
| **예외 처리** | 설명 누락, 트랜잭션 실패 |

**사용 API (호출 순서)**  
1. `GET /api/attendance-data/monthly-summaries` (선택)  
2. `POST /api/attendance-data/snapshots`

**입력값**  
- snapshotName, description 등

**Jest 테스트 제안**  
- `describe('SC-ADM-008 스냅샷 저장')`  
- `it('스냅샷 저장 시 201 및 body.snapshot.id 존재')`, `it('저장 후 목록에 스냅샷 포함')`  
- fixture: snapshotName, description

**검증할 컬럼·값**  
- POST 응답: `snapshot.id` 또는 `id`, `snapshotName`, `description`, `yyyy`, `mm`  
- 목록: 항목 `id`, `snapshotName`, `created_at`

---

### SC-ADM-009. 스냅샷 불러오기 및 롤백

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 저장된 스냅샷 조회 및 롤백 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC8 → UC9 → UC11 / UC12 |
| **관련 페이지/모달** | ATT_SNAP_LIST(L) |
| **주요 정책** | 보기 모드 전환, 롤백 시 현재 시점 기준점 설정 |
| **예외 처리** | 존재하지 않는 스냅샷: 404 |

**사용 API (호출 순서)**  
1. `GET /api/attendance-data/snapshots`  
2. `GET /api/attendance-data/snapshots/:id`  
3. `POST /api/attendance-data/snapshots/restore`  
4. `GET /api/attendance-data/monthly-summaries`

**입력값**  
- snapshotId(restore 시)

**Jest 테스트 제안**  
- `describe('SC-ADM-009 스냅샷 불러오기 및 롤백')`  
- `it('스냅샷 목록 조회 시 200')`, `it('restore 후 monthly-summaries 복원 반영')`, `it('존재하지 않는 스냅샷 조회 시 404')`  
- fixture: snapshotId(저장된 스냅샷)

**검증할 컬럼·값**  
- 목록: `id`, `snapshotName`, `yyyy`, `mm`  
- GET :id: `id`, `snapshotName`, `description`, `yyyy`, `mm`  
- restore: `snapshotId`, 복원 결과 필드

---

### SC-ADM-010. 스냅샷 결재 상신

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 스냅샷 결재 시스템 상신 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC8 → UC10 → UC33 → UC34 |
| **관련 페이지/모달** | ATT_SNAP_LIST(L), ATT_APPROVAL_REVIEWER(L) |
| **주요 정책** | 검토권한자 선택 필수, 결재 시스템 연동 |
| **예외 처리** | 검토권한자 미선택, 연동 실패 |

**사용 API (호출 순서)**  
1. `GET /api/attendance-data/snapshots`  
2. `GET /api/approval/reviewers-by-department`  
3. `PATCH /api/approval/snapshots/:snapshotId/approval`

**입력값**  
- snapshotId, 결재 상신 본문(상태 등)

**Jest 테스트 제안**  
- `describe('SC-ADM-010 스냅샷 결재 상신')`  
- `it('검토권한자 조회 시 200')`, `it('결재 상신 PATCH 시 2xx')`  
- fixture: snapshotId, departmentId

**검증할 컬럼·값**  
- reviewers: `departments[]`, `departmentId`, `reviewers[]`, `employeeId`, `employeeName`  
- PATCH: `id`, `approvalStatus`, `approverName`, `submittedAt`

---

### SC-ADM-011. 스냅샷 결재 조회

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 상신된 스냅샷 결재 상태 조회 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC35 → UC36 |
| **관련 페이지/모달** | ATT_APPROVAL_UPDATE(L) |
| **주요 정책** | 결재 문서 ID·일시·결재자 표시 |
| **예외 처리** | 존재하지 않는 결재: 404 |

**사용 API (호출 순서)**  
1. `GET /api/dashboard/department/snapshots` 또는 `GET /api/attendance-data/snapshots/:id`  
2. `GET /api/approval/snapshots/:snapshotId/content`  
3. `PATCH /api/approval/snapshots/:snapshotId/approval` (상태 업데이트)

**입력값**  
- snapshotId, year, month, departmentId(대시보드용)

**Jest 테스트 제안**  
- `describe('SC-ADM-011 스냅샷 결재 조회')`  
- `it('스냅샷 결재 content 조회 시 200')`, `it('결재 상태 PATCH 후 반영')`  
- fixture: snapshotId

**검증할 컬럼·값**  
- content: `snapshotId`, `approvalStatus`, `approverName`, `submittedAt`, 부서별 데이터  
- PATCH 후: `id`, `approverName` = 요청값

---

### SC-ADM-012. 근태유형 관리

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 근태유형 생성·삭제·사용여부 관리 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC24 → UC25 / UC26 / UC27 |
| **관련 페이지/모달** | SET_LEAVE_TYPE(P), SET_LEAVE_TYPE_NEW(L) |
| **주요 정책** | 코드·항목 필수, 근무시간 1~24 검증 |
| **예외 처리** | 사용중 코드 삭제 제한 |

**사용 API (호출 순서)**  
1. `GET /api/settings/attendance-types`  
2. `POST /api/settings/attendance-types`  
3. `PATCH /api/settings/attendance-types/:id`  
4. `DELETE /api/settings/attendance-types/:id`

**입력값**  
- 코드, 항목명, 근무시간 등, id(수정/삭제 시)

**Jest 테스트 제안**  
- `describe('SC-ADM-012 근태유형 관리')`  
- `it('목록 조회 시 200')`, `it('생성 후 목록에 id 존재')`, `it('수정/삭제 후 반영')`  
- fixture: attendanceType 본문

**검증할 컬럼·값**  
- 목록: `attendanceTypes[].id`, `title`, `workTime`, `isActive`, `isRecognizedWorkTime`  
- POST: `id`, `title`=요청값, `workTime`, `isActive`  
- PATCH: `title`, `isActive` = 요청값; DELETE 후 목록에서 해당 id 없음

---

### SC-ADM-013. 부서 권한 관리

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 직원별 부서 접근·검토 권한 관리 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC28 → UC29 → UC30 |
| **관련 페이지/모달** | SET_DEPT_AUTH(P), SET_DEPT_AUTH_EXCLUDE(L) |
| **주요 정책** | 부서 + 직원 권한 구조 |
| **예외 처리** | 존재하지 않는 직원: 404 |

**사용 API (호출 순서)**  
1. `GET /api/organization-management/departments` 또는 `GET /api/settings/permissions/departments`  
2. `GET /api/settings/permissions/departments/:departmentId`  
3. `PATCH /api/settings/permissions`

**입력값**  
- departmentId, 직원별 권한(hasAccessPermission, hasReviewPermission 등)

**Jest 테스트 제안**  
- `describe('SC-ADM-013 부서 권한 관리')`  
- `it('부서 목록 조회 시 200')`, `it('부서별 직원 권한 조회 시 200')`, `it('권한 PATCH 후 반영')`  
- fixture: departmentId, employeeId

**검증할 컬럼·값**  
- 부서 목록: `departments[].id`, `name`  
- 부서별 권한: `permissions[].employeeId`, `hasAccessPermission`, `hasReviewPermission`  
- PATCH 후 재조회: 요청한 `hasAccessPermission`, `hasReviewPermission` 일치

---

### SC-ADM-014. 집계 대상 관리

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 직원 집계 대상 포함·제외 관리 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC31 → UC32 |
| **관련 페이지/모달** | SET_AGG_TARGET(P) |
| **주요 정책** | 직원 검색 기능, 계산 제외 설정 |
| **예외 처리** | 권한 없음 |

**사용 API (호출 순서)**  
1. `GET /api/settings/permissions/employees` 또는 `GET /api/settings/permissions/employees/with-extra-info`  
2. `PATCH /api/settings/employee-extra-info`

**입력값**  
- employeeId, isExcludedFromSummary 등

**Jest 테스트 제안**  
- `describe('SC-ADM-014 집계 대상 관리')`  
- `it('직원 목록 조회 시 200')`, `it('employee-extra-info PATCH 후 반영')`  
- fixture: employeeId

**검증할 컬럼·값**  
- 직원 목록: `id`, `employeeNumber`, `employeeName`, `isExcludedFromSummary`(with-extra-info)  
- PATCH 후: `extraInfo.isExcludedFromSummary` 또는 재조회 시 `isExcludedFromSummary` = 요청값

---

### SC-ADM-015. 휴무일정 관리

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 공휴일 및 특별근태 관리 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC37 ~ UC44 |
| **관련 페이지/모달** | SET_HOLIDAY(P), SET_HOLIDAY_NEW(L) |
| **주요 정책** | 연도별 조회, 인라인 수정 |
| **예외 처리** | 시간 형식 오류 |

**사용 API (호출 순서)**  
- 휴일: `GET /api/settings/holidays`, `POST /api/settings/holidays`, `PATCH /api/settings/holidays`, `DELETE /api/settings/holidays`  
- 특별근태: `GET /api/settings/work-time-overrides`, `POST /api/settings/work-time-overrides`, `PATCH /api/settings/work-time-overrides`, `DELETE /api/settings/work-time-overrides`

**입력값**  
- 휴일: holidayDate, holidayName 등 / 특별근태: date, startWorkTime, endWorkTime 등

**Jest 테스트 제안**  
- `describe('SC-ADM-015 휴무일정 관리')`  
- `it('휴일 CRUD 시 2xx 및 목록 반영')`, `it('특별근태 CRUD 시 2xx 및 목록 반영')`  
- fixture: holiday/override 본문

**검증할 컬럼·값**  
- 휴일: `id`, `holidayName`, `holidayDate`; POST/PATCH 시 요청값 반영; DELETE 후 목록에서 id 없음  
- 특별근태: `id`, `date`, `startWorkTime`, `endWorkTime`, `reason`; 동일

---

### SC-ADM-016. 파일 삭제

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 업로드 파일 삭제 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC14 → UC17 |
| **관련 페이지/모달** | ATT_FILE_LIST(L), ATT_FILE_DEL(L) |
| **주요 정책** | 삭제 확인 팝업, 복구 불가 |
| **예외 처리** | 존재하지 않는 파일: 404 |

**사용 API (호출 순서)**  
1. `GET /api/file-management/files/list`  
2. `DELETE /api/file-management/files/:id`  
3. `GET /api/file-management/files/list`

**입력값**  
- fileId

**Jest 테스트 제안**  
- `describe('SC-ADM-016 파일 삭제')`  
- `it('삭제 후 목록에서 파일 제거')`, `it('존재하지 않는 파일 삭제 시 404')`  
- fixture: fileId(업로드된 파일)

**검증할 컬럼·값**  
- 삭제 전 list: `files[].id`에 삭제 대상 fileId 존재  
- 삭제 후 list: `files[].id`에 삭제한 id 없음, 개수 감소

---

### SC-ADM-017. 근태 대시보드 조회

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 부서별 근태 통계(차트·리스트) 조회 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC45 ~ UC50 |
| **관련 페이지/모달** | DASH_MAIN(P), DASH_EMP_DTL(L) |
| **주요 정책** | 차트 및 리스트 표시 |
| **예외 처리** | 데이터 없음 |

**사용 API (호출 순서)**  
1. `GET /api/organization-management/departments/by-access-permission`  
2. `GET /api/dashboard/department/snapshots`  
3. `GET /api/dashboard/department/weekly-top-employees`  
4. `GET /api/dashboard/employee/attendance-detail`  
5. `GET /api/dashboard/department/monthly-employee-attendance`, `GET /api/dashboard/department/monthly-employee-work-hours`

**입력값**  
- year, month, departmentId, employeeId(상세용)

**Jest 테스트 제안**  
- `describe('SC-ADM-017 근태 대시보드 조회')`  
- `it('부서별 스냅샷 조회 시 200')`, `it('주차별 직원 리스트 조회 시 200')`, `it('월별 근무내역/근무시간 조회 시 200')`  
- fixture: year, month, departmentId

**검증할 컬럼·값**  
- 스냅샷: `snapshots[]`, `snapshotId`, `snapshotName`, `yyyy`, `mm`  
- 주차별 직원: `employeeId`, `employeeName`, 근무시간 관련 필드  
- 직원 상세: `employeeId`, `employeeName`, `yyyymm`, `statistics`, `dailyDetails[]`, `date`, `enter`, `leave`  
- 월별 근무내역/근무시간: `employeeId`, `totalWorkMinutes`, 주차별 데이터

---

### SC-ADM-018. 시수 통계 조회

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 직원·프로젝트 시수 통계 조회 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC64 → UC68 ~ UC74 |
| **관련 페이지/모달** | MY_STAT(P), MY_STAT_FILTER(L) |
| **주요 정책** | Admin만 탭 표시, 모드 전환(직원/프로젝트) |
| **예외 처리** | 권한 없음 |

**사용 API (호출 순서)**  
1. `GET /api/organization-management/departments/with-employees` 또는 `GET /api/work-hours/employees-with-assignments`  
2. `GET /api/work-hours/statistics/by-employee`  
3. `GET /api/work-hours/statistics/by-project`

**입력값**  
- year, month, 필터(부서/직원/프로젝트)

**Jest 테스트 제안**  
- `describe('SC-ADM-018 시수 통계 조회')`  
- `it('직원 통계 조회 시 200')`, `it('프로젝트 통계 조회 시 200')`  
- fixture: year, month

**검증할 컬럼·값**  
- 직원 통계: `employeeId`, `employeeName`, `totalWorkMinutes`, 일자별/주차별 데이터  
- 프로젝트 통계: `projectId`, `projectName`, `totalWorkMinutes`

---

### SC-ADM-019. 프로젝트 할당 관리

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 직원 프로젝트 할당 관리 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC65 → UC75 ~ UC80 |
| **관련 페이지/모달** | MY_SET(P), MY_PROJ_ASSIGN(L) |
| **주요 정책** | 임시 저장 후 최종 저장 시 반영 |
| **예외 처리** | 존재하지 않는 프로젝트 등 |

**사용 API (호출 순서)**  
1. `GET /api/settings/permissions/employees` 또는 `GET /api/settings/permissions/employees/with-extra-info`  
2. `GET /api/work-hours/projects`  
3. `GET /api/work-hours/employees/:employeeId/assigned-projects` 또는 `GET /api/work-hours/employees-with-assignments`  
4. `PUT /api/work-hours/assign-projects`

**입력값**  
- employeeId, 프로젝트 할당 목록

**Jest 테스트 제안**  
- `describe('SC-ADM-019 프로젝트 할당 관리')`  
- `it('할당 목록 조회 시 200')`, `it('assign-projects PUT 후 반영')`  
- fixture: employeeId, projectIds

**검증할 컬럼·값**  
- 프로젝트 목록: `id`, `name`  
- 할당 목록: `id`, `employeeId`, `projectId`, `startDate`, `endDate`, `isActive`  
- PUT 후: `assignedProjects[]`, 요청한 projectId 포함, `employeeId` 일치

---

### SC-ADM-020. 근무 모드 관리

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 근무 모드 변경 및 히스토리 조회 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC81 → UC82 |
| **관련 페이지/모달** | MY_SET(P), MY_WORK_MODE(L) |
| **주요 정책** | 적용 시작일 필수 |
| **예외 처리** | 시작일 미설정 |

**사용 API (호출 순서)**  
- UC81·UC82: **전용 API 없음** (매핑 문서 기준). 실제 구현 시 전용 엔드포인트가 있으면 해당 API로 테스트.

**입력값**  
- 적용 시작일, 모드(고정/유연) 등

**Jest 테스트 제안**  
- `describe('SC-ADM-020 근무 모드 관리')`  
- 전용 API가 있으면 `it('근무 모드 변경 시 2xx')`, `it('히스토리 조회 시 200')` 등으로 작성. 없으면 skip 또는 목록만 유지.

**검증할 컬럼·값**  
- 전용 API 구현 시: `mode`, `startDate`, `history[]` 등 응답 필드 값 검증

---

### SC-ADM-021. 저장 전 확인 처리

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 편집 중 미저장 변경사항 확인 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC83 |
| **관련 페이지/모달** | ATT_SAVE_CONFIRM(L) |
| **주요 정책** | 저장/저장안함/취소 선택 |
| **예외 처리** | 없음 |

**사용 API (호출 순서)**  
- UC83: 프론트 전용(확인 다이얼로그). API 호출 없을 수 있음. 미저장 시 나가는 API(예: PATCH 저장)가 있으면 해당 API 호출 전/후 시나리오로 간접 검증 가능.

**Jest 테스트 제안**  
- `describe('SC-ADM-021 저장 전 확인 처리')`  
- 프론트 동작 위주이면 E2E에서 UI 시나리오 또는 생략. 백엔드만 테스트 시 해당 시나리오는 “저장 API 호출 시에만 반영” 등으로 간접 검증.

**검증할 컬럼·값**  
- 간접 검증: 저장 API 호출 후 재조회 시 요청한 컬럼·값만 반영되었는지 확인

---

### SC-ADM-022. 근태 조회 팝업 실행

| 항목 | 내용 |
|------|------|
| **역할** | Admin |
| **목적** | 팝업으로 근태 조회(URL 파라미터 기반) 검증 |
| **전제 조건** | Admin 권한 |
| **UC 흐름** | UC84 → UC85 |
| **관련 페이지/모달** | VIEW_MAIN(P), DEMO_MAIN(P) |
| **주요 정책** | 읽기 전용, URL 파라미터 기반 조회 |
| **예외 처리** | 파라미터 누락 |

**사용 API (호출 순서)**  
- UC84·UC85: 동일 근태 조회 API 사용 가능. `GET /api/attendance-data/monthly-summaries` 등에 year, month, departmentId 등 파라미터로 요청.

**입력값**  
- year, month, departmentId(URL 또는 쿼리)

**Jest 테스트 제안**  
- `describe('SC-ADM-022 근태 조회 팝업 실행')`  
- `it('파라미터로 monthly-summaries 조회 시 200')` (동일 API로 검증)

**검증할 컬럼·값**  
- 쿼리 year, month, departmentId와 일치: `monthlySummaries[].yyyymm`, `dailySummaries` 구조

---

## User 시나리오 (SC-USR-001 ~ SC-USR-003)

### SC-USR-001. 시수 입력 및 블록 관리

| 항목 | 내용 |
|------|------|
| **역할** | User |
| **목적** | 월별 시수 캘린더 및 시간 블록 추가/수정/삭제 검증 |
| **전제 조건** | User 권한 |
| **UC 흐름** | UC51 ~ UC58 |
| **관련 페이지/모달** | MY_MAIN(P), MY_DAY_DTL(L) |
| **주요 정책** | 시간 중복 및 8시간 검증 |
| **예외 처리** | 시간 중복 시 에러 등 |

**사용 API (호출 순서)**  
1. `GET /api/work-hours/monthly?year=...&month=...`  
2. `POST /api/work-hours/work-hours` 또는 `PUT /api/work-hours/work-hours/:id`  
3. `GET /api/work-hours/daily?date=...`  
4. `DELETE /api/work-hours/work-hours/:id` 또는 `DELETE /api/work-hours/work-hours/by-date/:date`

**입력값**  
- year, month, date, workHours 본문(projectId, hours 등)

**Jest 테스트 제안**  
- `describe('SC-USR-001 시수 입력 및 블록 관리')`  
- `it('월별 시수 조회 시 200')`, `it('시간 블록 POST 후 목록에 항목 존재')`, `it('DELETE 후 해당 블록 제거')`, `it('8시간 초과 또는 중복 시 4xx')`  
- fixture: User 토큰, year, month, date, projectId

**검증할 컬럼·값**  
- monthly: `year`, `month`, `workHours[].id`, `date`, `startTime`, `endTime`, `workMinutes`  
- POST 응답: `id`, `date`, `workMinutes` = 요청 반영; 목록에 생성 id 포함; DELETE 후 해당 id 없음

---

### SC-USR-002. 내보고서 조회

| 항목 | 내용 |
|------|------|
| **역할** | User |
| **목적** | 특정 연월 내보고서 조회 검증 |
| **전제 조건** | User 권한 |
| **UC 흐름** | UC51 → UC59 → UC60 |
| **관련 페이지/모달** | MY_MAIN(P), MY_REPORT(L) |
| **주요 정책** | 보고서 존재 여부 확인 |
| **예외 처리** | 보고서 없음 |

**사용 API (호출 순서)**  
1. `GET /api/user/monthly-report-existence?year=...&month=...`  
2. `GET /api/user/confirmed-monthly-report?year=...&month=...`

**입력값**  
- year, month

**Jest 테스트 제안**  
- `describe('SC-USR-002 내보고서 조회')`  
- `it('존재 여부 조회 시 200, exists 또는 id 필드 존재')`, `it('확정 보고서 조회 시 존재하면 본문 필드, 없으면 null/404')`  
- fixture: User 토큰, year, month

**검증할 컬럼·값**  
- 존재 여부: `exists`(boolean), `id`(있을 때), `year`, `month`  
- 확정 보고서: `id`, `year`, `month`, `employeeId`, 확정 일시·내용

---

### SC-USR-003. 수정요청 응답 제출

| 항목 | 내용 |
|------|------|
| **역할** | User |
| **목적** | 수정요청 응답 제출 검증 |
| **전제 조건** | User 권한 |
| **UC 흐름** | UC51 → UC61 ~ UC63 |
| **관련 페이지/모달** | MY_REVISION_LIST(L), MY_REVISION_RESP(L) |
| **주요 정책** | 댓글 입력 후 제출 |
| **예외 처리** | 댓글 누락 |

**사용 API (호출 순서)**  
1. `GET /api/user/attendance-issues-to-review?year=...&month=...`  
2. `GET /api/attendance-issues/:id`  
3. `PATCH /api/attendance-issues/:id/apply`  
4. `GET /api/attendance-issues/:id`

**입력값**  
- year, month, issue id, apply 본문

**Jest 테스트 제안**  
- `describe('SC-USR-003 수정요청 응답 제출')`  
- `it('확인할 이슈 목록 조회 시 200')`, `it('이슈 상세 조회 시 200')`, `it('apply 후 status APPLIED, 제출 내용 반영')`  
- fixture: User 토큰, year, month, 수정요청 대상 이슈 id

**검증할 컬럼·값**  
- 목록: `id`, `status`, `employeeId`, `requestedAt`  
- apply 후 상세: `status`='APPLIED', `correctedEnterTime`, `correctedLeaveTime`, `appliedAt` = 제출값 반영

---

## 시나리오–API 요약 (25개)

| 시나리오 ID | 시나리오명 | 주요 API |
|-------------|------------|----------|
| SC-ADM-001 | 파일 업로드 및 반영 | file-management: list, upload, reflect / attendance-data: monthly-summaries |
| SC-ADM-002 | 파일 타임라인·특정 시점 복원 | file-management: list, reflection-history, restore-from-history |
| SC-ADM-003 | 근태 기록 조회 | attendance-data: monthly-summaries |
| SC-ADM-004 | 근태 이슈 관리 | attendance-issues: list, request, apply |
| SC-ADM-005 | 근태 기록 수정 | attendance-data: daily-summaries, history |
| SC-ADM-006 | 월별 비고 관리 | attendance-data: monthly-summaries/:id/note |
| SC-ADM-007 | 수정 내역 조회 | attendance-data: daily-summaries/:id/history |
| SC-ADM-008 | 스냅샷 저장 | attendance-data: snapshots POST |
| SC-ADM-009 | 스냅샷 불러오기 및 롤백 | attendance-data: snapshots, restore |
| SC-ADM-010 | 스냅샷 결재 상신 | approval: reviewers-by-department, snapshots/:id/approval |
| SC-ADM-011 | 스냅샷 결재 조회 | dashboard/department/snapshots, approval/snapshots/:id/content |
| SC-ADM-012 | 근태유형 관리 | settings: attendance-types CRUD |
| SC-ADM-013 | 부서 권한 관리 | organization-management, settings/permissions |
| SC-ADM-014 | 집계 대상 관리 | settings: permissions/employees, employee-extra-info |
| SC-ADM-015 | 휴무일정 관리 | settings: holidays, work-time-overrides CRUD |
| SC-ADM-016 | 파일 삭제 | file-management: list, files/:id DELETE |
| SC-ADM-017 | 근태 대시보드 조회 | dashboard: department/snapshots, weekly-top-employees, monthly-employee-* |
| SC-ADM-018 | 시수 통계 조회 | work-hours: statistics/by-employee, by-project |
| SC-ADM-019 | 프로젝트 할당 관리 | work-hours: projects, assigned-projects, assign-projects |
| SC-ADM-020 | 근무 모드 관리 | (전용 API 없음) |
| SC-ADM-021 | 저장 전 확인 처리 | (프론트 전용) |
| SC-ADM-022 | 근태 조회 팝업 실행 | attendance-data: monthly-summaries 등 |
| SC-USR-001 | 시수 입력·블록 관리 | work-hours: monthly, work-hours, daily, delete |
| SC-USR-002 | 내보고서 조회 | user: monthly-report-existence, confirmed-monthly-report |
| SC-USR-003 | 수정요청 응답 제출 | user: attendance-issues-to-review, attendance-issues, apply |
