# 시나리오 검증값 (25개, Jest expect 기준)

테스트 코드에서 사용할 **응답 경로**, **검증할 컬럼·값**, **expect 예시**를 시나리오별로 정리한다.  
status뿐 아니라 **실제 응답 필드(컬럼) 값**을 검증하도록 작성한다.  
API prefix는 e2e 설정에 따라 `/api` 포함 여부만 맞추면 된다.

---

## 공통

- **setup**: `beforeAll`에서 앱·토큰·픽스처(departmentId, employeeIds, year, month) 확보
- **요청**: `request(app.getHttpServer()).get(path).set('Authorization', 'Bearer ' + token)`
- **검증 원칙**: `expect(res.status)` 외에 `res.body` 내 **구체 필드명·타입·값**을 반드시 검증

---

## SC-ADM-001. 파일 업로드 및 반영

**호출 순서**: list → upload → reflect → list → monthly-summaries

| 단계 | 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|------|-------------|-----------|----------------|------------------|
| list (before) | 목록 조회 성공 | - | status 200 | `expect(res.status).toBe(200)` |
| list (before) | 파일 배열 존재 | `body.files` 또는 `body` | `files` 배열, 각 항목 `id`, `year`, `month` | `expect(res.body.files ?? res.body).toBeDefined()`; `expect(Array.isArray(res.body.files ?? res.body)).toBe(true)`; 항목 있으면 `expect(res.body.files[0]).toHaveProperty('id')` |
| upload | 업로드 성공 | `body` | `fileId`(UUID), `fileName`, `year`, `month` | `expect(res.status).toBe(201)`; `expect(res.body.fileId ?? res.body.id).toBeDefined()`; `expect(res.body.year).toBe(요청한 year)`; `expect(res.body.month).toBe(요청한 month)` |
| list (after) | 목록에 새 파일 포함 | `body.files[].id` | `files[].id` = 업로드 반환 fileId | `expect(res.body.files.some(f => f.id === uploadedFileId)).toBe(true)` |
| monthly-summaries | 반영 후 요약 존재 | `body.monthlySummaries` | `monthlySummaries[]`, 각 항목 `dailySummaries` 배열, `employee_id` 등 | `expect(Array.isArray(res.body.monthlySummaries)).toBe(true)`; 항목 있으면 `expect(res.body.monthlySummaries[0]).toHaveProperty('dailySummaries')`; `expect(배열 길이 또는 dailySummaries 합산).toBeGreaterThan(0)` |

**before/after**: `files.length` after >= before; `monthlySummaries` 내 `dailySummaries` 합산 반영 후 > 0

---

## SC-ADM-002. 파일 타임라인·특정 시점 복원

**호출 순서**: list → reflection-history → restore-from-history → monthly-summaries

| 단계 | 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|------|-------------|-----------|----------------|------------------|
| reflection-history | 이력 배열 존재 | `body` 또는 `body.reflectionHistories` | 배열 각 항목 `id`, `reflectionHistoryId`, `created_at` 등 | `expect(res.status).toBe(200)`; `expect(Array.isArray(res.body) || res.body?.reflectionHistories).toBeTruthy()`; 항목 있으면 `expect(첫항목).toHaveProperty('id')` |
| restore-from-history | 복원 요청 성공 | `body` | `reflectionHistoryId`, `restoreSnapshotResult.year`, `restoreSnapshotResult.month` | `expect(res.status).toBe(200)` (또는 201); `expect(res.body.reflectionHistoryId ?? res.body).toBeDefined()` |
| monthly-summaries | 복원 후 조회 가능 | `body.monthlySummaries` | `monthlySummaries[].dailySummaries`, 연월·부서별 데이터 일치 | `expect(Array.isArray(res.body.monthlySummaries)).toBe(true)`; 복원 전 snapshot과 비교 시 특정 필드 값 일치 검증 |

---

## SC-ADM-003. 근태 기록 조회

**호출**: `GET .../attendance-data/monthly-summaries?year=&month=&departmentId=`

| 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|-----------|----------------|------------------|
| 성공 시 구조 | `body.monthlySummaries` | `monthlySummaries[]`, 각 항목 `employee_id`, `yyyymm`, `dailySummaries` | `expect(res.status).toBe(200)`; `expect(Array.isArray(res.body.monthlySummaries)).toBe(true)`; 항목 있으면 `expect(res.body.monthlySummaries[0]).toHaveProperty('dailySummaries')`, `expect(res.body.monthlySummaries[0]).toHaveProperty('yyyymm')` |
| 일간 요약 필드 | `monthlySummaries[].dailySummaries` | `dailySummaries[].id`, `date`, `enter`, `leave` 등 | 배열 존재(빈 배열 가능); 항목 있으면 `expect(dailySummaries[0]).toHaveProperty('id')`, `expect(dailySummaries[0]).toHaveProperty('date')` |
| 권한 없는 부서 | - | status 403/401 | `expect(res.status).toBe(403)` (또는 401) |

---

## SC-ADM-004. 근태 이슈 관리

**호출 순서**: 목록 → request(선택) → apply → 상세 조회

| 단계 | 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|------|-------------|-----------|----------------|------------------|
| 목록 | 200, 배열 | `body.issues` 또는 `body` | `issues[].id`, `issues[].status`, `issues[].employeeId` 등 | `expect(res.status).toBe(200)`; `expect(res.body.issues ?? res.body).toBeDefined()`; 항목 있으면 `expect(issues[0]).toHaveProperty('id')`, `expect(issues[0]).toHaveProperty('status')` |
| apply 후 상세 | 상태·보정값 | `body` | `status`='APPLIED', `correctedEnterTime`, `correctedLeaveTime`, `appliedAt` 등 | `expect(res.body.status).toBe('APPLIED')`; 요청한 보정값과 일치: `expect(res.body.correctedEnterTime).toBe('09:00:00')`, `expect(res.body.correctedLeaveTime).toBe('18:00:00')`; `expect(res.body).toHaveProperty('id')` |

---

## SC-ADM-005. 근태 기록 수정

**호출 순서**: monthly-summaries → daily-summaries/:id → PATCH → history

| 단계 | 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|------|-------------|-----------|----------------|------------------|
| daily-summaries PATCH | 수정 반영 | `body` | `enter`, `leave`, `reason`, `id`, `date` | `expect(res.status).toBe(200)`; `expect(res.body.enter).toBe('09:00:00')`; `expect(res.body.leave).toBe('18:00:00')`; reason 보냈으면 `expect(res.body.reason).toBe(요청값)`; `expect(res.body.id).toBe(dailySummaryId)` |
| history | 수정 후 이력 증가 | `body` 또는 `body.history` | 배열 각 항목 `id`, `enter`, `leave`, `changed_at` 등 | 수정 전 length 저장 후, PATCH 후 재조회해 `expect(Array.isArray(res.body)).toBe(true)`; `expect(res.body.length).toBeGreaterThan(historyLength)`; 항목 있으면 `expect(res.body[0]).toHaveProperty('enter')` |

---

## SC-ADM-006. 월별 비고 관리

**호출 순서**: monthly-summaries → note GET → note PATCH

| 단계 | 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|------|-------------|-----------|----------------|------------------|
| note GET | 200, note 필드 | `body` | `note`(string 또는 null), `monthlySummaryId` 등 | `expect(res.status).toBe(200)`; `expect(res.body).toHaveProperty('note')`; 값 있으면 타입 검증 |
| note PATCH | 저장 반영 | `body` | `note` = 요청 본문과 동일 | `expect(res.status).toBe(200)`; `expect(res.body.note).toBe(요청한Note값)`; `expect(res.body).toHaveProperty('note')` |

---

## SC-ADM-007. 수정 내역 조회

**호출 순서**: monthly-summaries → daily-summaries/:id/history

| 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|-----------|----------------|------------------|
| 히스토리 조회 | `body` 또는 배열 | 배열 각 항목 `id`, `enter`, `leave`, `changed_at`, `reason` 등 | `expect(res.status).toBe(200)`; `expect(Array.isArray(res.body) || res.body?.history).toBeTruthy()`; 배열 항목 있으면 `expect(res.body[0]).toHaveProperty('enter')`, `expect(res.body[0]).toHaveProperty('leave')` |

---

## SC-ADM-008. 스냅샷 저장

**호출**: POST .../attendance-data/snapshots

| 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|-----------|----------------|------------------|
| 저장 성공 | `body` | `snapshot.id` 또는 `id`, `snapshotName`, `description`, `yyyy`, `mm` 등 | `expect(res.status).toBe(201)`; `expect(res.body.snapshot?.id ?? res.body.id).toBeDefined()`; `expect(res.body.snapshot?.snapshotName ?? res.body.snapshotName).toBe(요청한이름)` (해당 시) |
| 목록 반영 | GET snapshots 응답 | 목록 항목 `id`, `snapshotName`, `created_at` | `expect(snapshots.some(s => s.id === savedId)).toBe(true)`; 해당 항목 `expect(항목.snapshotName).toBeDefined()` |

---

## SC-ADM-009. 스냅샷 불러오기 및 롤백

**호출 순서**: GET snapshots → GET snapshots/:id → POST restore → GET monthly-summaries

| 단계 | 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|------|-------------|-----------|----------------|------------------|
| 목록 조회 | 200, 배열 | `body` | 배열 각 항목 `id`, `snapshotName`, `yyyy`, `mm` | `expect(res.status).toBe(200)`; `expect(Array.isArray(res.body)).toBe(true)`; 항목 있으면 `expect(res.body[0]).toHaveProperty('id')`, `expect(res.body[0]).toHaveProperty('snapshotName')` |
| GET :id 상세 | 200, 단건 | `body` | `id`, `snapshotName`, `description`, `yyyy`, `mm` | `expect(res.body.id).toBe(snapshotId)`; `expect(res.body).toHaveProperty('snapshotName')` |
| restore | 2xx, snapshotId | `body` | `snapshotId`, 복원 결과 관련 필드 | `expect(res.status).toBe(200)` (또는 201); `expect(res.body.snapshotId ?? res.body).toBeDefined()` |
| 존재하지 않는 스냅샷 | 404 | - | status 404 | `expect(res.status).toBe(404)` |

---

## SC-ADM-010. 스냅샷 결재 상신

**호출 순서**: GET snapshots → GET reviewers-by-department → PATCH snapshots/:id/approval

| 단계 | 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|------|-------------|-----------|----------------|------------------|
| 검토권한자 조회 | 200, 배열/객체 | `body` | `departments[]`, 각 부서 `departmentId`, `reviewers[]`, `employeeId`, `employeeName` 등 | `expect(res.status).toBe(200)`; `expect(res.body.departments ?? res.body).toBeDefined()`; 항목 있으면 `expect(부서).toHaveProperty('departmentId')` |
| 결재 상신 PATCH | 2xx | `body` | `id`, `snapshotName`, `approvalStatus`, `approverName`, `submittedAt` 등 | `expect(res.status).toBe(200)` (또는 204); `expect(res.body.id).toBe(snapshotId)`; 보냈다면 `expect(res.body.approverName).toBe(요청값)` |

---

## SC-ADM-011. 스냅샷 결재 조회

**호출**: GET dashboard/department/snapshots 또는 GET attendance-data/snapshots/:id, GET approval/snapshots/:id/content, PATCH approval

| 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|-----------|----------------|------------------|
| content 조회 | `body` | 부서별 스냅샷/결재 데이터, `snapshotId`, `approvalStatus`, `approverName`, `submittedAt` 등 | `expect(res.status).toBe(200)`; `expect(res.body).toBeDefined()`; 구조에 따라 `expect(res.body).toHaveProperty('departments')` 또는 `expect(res.body).toHaveProperty('snapshotId')` 등 |
| PATCH approval 후 | `body` | `id`, `approvalStatus`, `approverName` = 요청값 반영 | `expect(res.status).toBe(200)`; `expect(res.body.id).toBe(snapshotId)`; 요청한 `approverName` 보냈다면 `expect(res.body.approverName).toBe(요청값)` |

---

## SC-ADM-012. 근태유형 관리

**호출**: GET → POST → PATCH → DELETE /api/settings/attendance-types

| 단계 | 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|------|-------------|-----------|----------------|------------------|
| 목록 조회 | 200, 배열 | `body.attendanceTypes` 또는 `body` | 각 항목 `id`, `title`, `workTime`, `isActive`, `isRecognizedWorkTime` | `expect(res.status).toBe(200)`; `expect(Array.isArray(res.body.attendanceTypes ?? res.body)).toBe(true)`; 항목 있으면 `expect(항목).toHaveProperty('id')`, `expect(항목).toHaveProperty('title')` |
| POST 생성 | 201, id | `body.attendanceType` 또는 `body` | `id`, `title`=요청값, `workTime`, `isActive` | `expect(res.status).toBe(201)`; `expect(res.body.attendanceType?.id ?? res.body.id).toBeDefined()`; `expect(res.body.attendanceType?.title ?? res.body.title).toBe(요청한 title)` |
| 목록에 생성 id | 배열 내 id | 목록 항목 `id`, `title` | `expect(list.some(x => x.id === createdId)).toBe(true)`; 해당 항목 `expect(항목.title).toBe(생성 시 title)` |
| PATCH 수정 후 | 수정 반영 | `body` | `title`, `isActive` 등 요청 필드 | `expect(res.body.title).toBe(요청한 title)` (수정한 경우) |
| DELETE 후 목록 | 제거 반영 | 목록 | 삭제한 id 미포함 | `expect(list.some(x => x.id === deletedId)).toBe(false)` |

---

## SC-ADM-013. 부서 권한 관리

**호출 순서**: GET departments → GET permissions/departments/:id → PATCH permissions

| 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|-----------|----------------|------------------|
| 부서 목록 | 200, flatList 또는 배열 | `departments[]` 또는 항목 `id`, `name` | `expect(res.status).toBe(200)`; `expect(res.body.departments ?? res.body).toBeDefined()`; 항목 있으면 `expect(항목).toHaveProperty('id')` |
| 부서별 직원 권한 | 200, 배열/객체 | `permissions[]`, 각 항목 `employeeId`, `hasAccessPermission`, `hasReviewPermission` | `expect(res.status).toBe(200)`; `expect(res.body.permissions ?? res.body).toBeDefined()`; 항목 있으면 `expect(항목).toHaveProperty('hasAccessPermission')`, `expect(항목).toHaveProperty('hasReviewPermission')` |
| PATCH 후 반영 | GET 재조회 | 위와 동일, 요청한 권한값과 일치 | `expect(res.status).toBe(200)`; 재조회 후 `expect(해당직원권한.hasAccessPermission).toBe(요청한값)`, `expect(해당직원권한.hasReviewPermission).toBe(요청한값)` |

---

## SC-ADM-014. 집계 대상 관리

**호출 순서**: GET employees (또는 with-extra-info) → PATCH employee-extra-info

| 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|-----------|----------------|------------------|
| 직원 목록 | 200, 배열/객체 | 직원 항목 `id`, `employeeNumber`, `employeeName`, `isExcludedFromSummary`(with-extra-info 시) | `expect(res.status).toBe(200)`; `expect(res.body).toBeDefined()`; 항목 있으면 `expect(항목).toHaveProperty('id')`; with-extra-info면 `expect(항목).toHaveProperty('isExcludedFromSummary')` |
| PATCH 후 | `body.extraInfo` 또는 재조회 | `employeeId`, `isExcludedFromSummary` = 요청값 | `expect(res.status).toBe(200)`; `expect(res.body.extraInfo?.isExcludedFromSummary ?? res.body.isExcludedFromSummary).toBe(요청한값)`; 재조회 시 동일 직원의 `isExcludedFromSummary` 일치 |

---

## SC-ADM-015. 휴무일정 관리

**호출**: GET/POST/PATCH/DELETE holidays, GET/POST/PATCH/DELETE work-time-overrides

| 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|-----------|----------------|------------------|
| 휴일 목록 | `body` | `holidays[]` 또는 항목 `id`, `holidayName`, `holidayDate` | `expect(Array.isArray(res.body.holidays ?? res.body)).toBe(true)`; 항목 있으면 `expect(항목).toHaveProperty('holidayDate')`, `expect(항목).toHaveProperty('holidayName')` |
| 휴일 POST | `body.holidayInfo` 또는 `body` | `id`, `holidayName`=요청값, `holidayDate`=요청값 | `expect(res.status).toBe(201)`; `expect(res.body.holidayInfo?.id ?? res.body.id).toBeDefined()`; `expect(res.body.holidayInfo?.holidayDate ?? res.body.holidayDate).toBe(요청한날짜)` |
| 휴일 PATCH 후 | `body` | `holidayName`, `holidayDate` = 요청값 | `expect(res.body.holidayName).toBe(요청값)` (수정한 경우) |
| 휴일 DELETE 후 | 목록 | 삭제한 id 미포함 | GET 목록 후 `expect(list.some(x => x.id === id)).toBe(false)` |
| 특별근태 목록 | `body` | 항목 `id`, `date`, `startWorkTime`, `endWorkTime`, `reason` | 항목 있으면 `expect(항목).toHaveProperty('date')`, `expect(항목).toHaveProperty('startWorkTime')` |
| 특별근태 POST | `body` | `id`, `date`, `startWorkTime`, `endWorkTime` = 요청값 | `expect(res.body.workTimeOverride?.date ?? res.body.date).toBe(요청한날짜)` |
| 특별근태 DELETE 후 | 목록 | 삭제한 id 미포함 | GET 목록 후 해당 id 없음 검증 |

---

## SC-ADM-016. 파일 삭제

**호출 순서**: GET list → DELETE :id → GET list

| 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|-----------|----------------|------------------|
| GET list (삭제 전) | `body.files` | `files[].id`, `files[].year`, `files[].month` | 삭제할 fileId가 목록에 있음: `expect(beforeList.some(f => f.id === fileId)).toBe(true)` |
| DELETE | 200 또는 204 | (본문 없을 수 있음) | `expect(res.status).toBe(200)` (또는 204) |
| 삭제 후 목록 | `body.files` | `files[].id`에 삭제한 id 없음 | `expect(afterList.some(f => f.id === deletedId)).toBe(false)`; 삭제 전 개수 - 1 = 삭제 후 개수 등 |
| 존재하지 않는 파일 삭제 | - | status 404 | `expect(res.status).toBe(404)` |

---

## SC-ADM-017. 근태 대시보드 조회

**호출**: by-access-permission, department/snapshots, weekly-top-employees, attendance-detail, monthly-employee-attendance, monthly-employee-work-hours

| 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|-----------|----------------|------------------|
| 부서 스냅샷 | `body` | 스냅샷 목록 또는 `snapshots[]`, `snapshotId`, `snapshotName`, `yyyy`, `mm` | `expect(res.status).toBe(200)`; `expect(res.body).toBeDefined()`; 배열/객체 구조에 따라 `expect(항목).toHaveProperty('snapshotId')` 등 |
| 주차별 직원 | `body` | 주차별·직원 리스트, `employeeId`, `employeeName`, 근무시간 등 | `expect(res.status).toBe(200)`; `expect(res.body).toBeDefined()`; 항목 있으면 `expect(항목).toHaveProperty('employeeId')` 또는 해당 구조 필드 |
| 직원 근태 상세 | `body` | `employeeId`, `employeeName`, `yyyymm`, `statistics`, `dailyDetails[]`, `date`, `enter`, `leave` 등 | `expect(res.body.employeeId).toBe(요청한 employeeId)`; `expect(res.body).toHaveProperty('dailyDetails')`; `expect(Array.isArray(res.body.dailyDetails)).toBe(true)` |
| 월별 근무내역/근무시간 | `body` | 직원별 배열, `employeeId`, `totalWorkMinutes`, 주차별 데이터 등 | `expect(res.status).toBe(200)`; `expect(res.body).toBeDefined()`; 항목 있으면 `expect(항목).toHaveProperty('employeeId')`, `expect(항목).toHaveProperty('totalWorkMinutes')` 등 |

---

## SC-ADM-018. 시수 통계 조회

**호출**: statistics/by-employee, statistics/by-project

| 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|-----------|----------------|------------------|
| 직원 통계 | `body` | 직원별 시수 집계, `employeeId`, `employeeName`, `totalWorkMinutes`, 일자별/주차별 데이터 등 | `expect(res.status).toBe(200)`; `expect(res.body).toBeDefined()`; 배열이면 `expect(Array.isArray(res.body)).toBe(true)`; 항목 있으면 `expect(항목).toHaveProperty('employeeId')`, `expect(항목).toHaveProperty('totalWorkMinutes')` |
| 프로젝트 통계 | `body` | 프로젝트별 시수 집계, `projectId`, `projectName`, `totalWorkMinutes` 등 | `expect(res.status).toBe(200)`; 항목 있으면 `expect(항목).toHaveProperty('projectId')`, `expect(항목).toHaveProperty('totalWorkMinutes')` |

---

## SC-ADM-019. 프로젝트 할당 관리

**호출**: employees, projects, assigned-projects, PUT assign-projects

| 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|-----------|----------------|------------------|
| 프로젝트 목록 | `body` | `projects[]` 또는 항목 `id`, `name` | `expect(res.status).toBe(200)`; `expect(res.body).toBeDefined()`; 항목 있으면 `expect(항목).toHaveProperty('id')` |
| 할당 목록 조회 | `body` | `assignedProjects[]` 또는 항목 `id`, `employeeId`, `projectId`, `startDate`, `endDate`, `isActive` | `expect(res.status).toBe(200)`; 항목 있으면 `expect(항목).toHaveProperty('projectId')`, `expect(항목).toHaveProperty('isActive')` |
| assign-projects PUT | `body.assignedProjects` | 요청한 프로젝트 목록과 일치, `employeeId`, `projectId`, `isActive` | `expect(res.status).toBe(200)`; `expect(Array.isArray(res.body.assignedProjects)).toBe(true)`; 요청한 projectId들이 반환 목록에 포함되는지 검증 |

---

## SC-ADM-020. 근무 모드 관리

**호출**: (전용 API 없음 — USECASE_API_MAPPING 기준)

| 검증 포인트 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|----------------|------------------|
| 전용 API 구현 시 | 구현된 응답 필드(예: `mode`, `startDate`, `history[]`) | 해당 엔드포인트 200/2xx; `expect(res.body).toHaveProperty('mode')` 등 본문 컬럼 검증. 미구현 시 테스트 skip 또는 생략 |

---

## SC-ADM-021. 저장 전 확인 처리

**호출**: (프론트 전용 — UC83)

| 검증 포인트 | Jest expect 예시 |
|-------------|------------------|
| 백엔드 간접 검증 | 저장 API 호출 시에만 반영되는지 등. 프론트 E2E에서 다이얼로그 시나리오 검증 가능 |

---

## SC-ADM-022. 근태 조회 팝업 실행

**호출**: attendance-data/monthly-summaries 등 (파라미터 기반)

| 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|-------------|-----------|----------------|------------------|
| 파라미터로 조회 | `body.monthlySummaries` | 쿼리 year, month, departmentId와 일치하는 데이터; `monthlySummaries[].yyyymm`, `dailySummaries` | `expect(res.status).toBe(200)`; `expect(res.body.monthlySummaries).toBeDefined()`; `expect(Array.isArray(res.body.monthlySummaries)).toBe(true)`; 항목 있으면 `expect(항목.yyyyymm).toMatch(요청한 연월)` |

---

## SC-USR-001. 시수 입력·블록 관리

**호출**: monthly → POST work-hours → daily → DELETE

| 단계 | 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|------|-------------|-----------|----------------|------------------|
| monthly | 200, 데이터 존재 | `body` | `year`, `month`, `workHours[]`, 각 항목 `id`, `date`, `startTime`, `endTime`, `workMinutes` | `expect(res.status).toBe(200)`; `expect(res.body).toHaveProperty('year')`; `expect(res.body).toHaveProperty('month')`; `expect(Array.isArray(res.body.workHours)).toBe(true)` |
| POST work-hours | 생성 성공 | `body` | `id`, `assignedProjectId`, `date`, `startTime`, `endTime`, `workMinutes` = 요청 반영 | `expect(res.status).toBe(201)`; `expect(res.body.id).toBeDefined()`; `expect(res.body.date).toBe(요청한 date)`; `expect(res.body).toHaveProperty('workMinutes')` |
| 조회 | 추가한 블록 포함 | 목록 내 항목 | `id`, `date`, `startTime`, `endTime` | `expect(items.some(i => i.id === createdId)).toBe(true)`; 해당 항목 `expect(항목.date).toBe(생성 시 date)` |
| DELETE 후 | 해당 블록 제거 | 목록 | 삭제한 id 미포함 | `expect(items.some(i => i.id === deletedId)).toBe(false)` |
| 정책(8h/중복) | - | status 4xx, 본문 메시지 | `expect(res.status).toBeGreaterThanOrEqual(400)`; `expect(res.body.message ?? res.body.error).toBeDefined()` (에러 메시지 필드 있으면) |

---

## SC-USR-002. 내보고서 조회

**호출**: monthly-report-existence → confirmed-monthly-report

| 단계 | 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|------|-------------|-----------|----------------|------------------|
| 존재 여부 | 200, exists 또는 id | `body` | `exists`(boolean), `id`(있을 때), `year`, `month` | `expect(res.status).toBe(200)`; `expect(res.body).toHaveProperty('exists')`; 있으면 `expect(res.body.exists).toBe(true)` 및 `expect(res.body.id).toBeDefined()` |
| 확정 보고서 | 있으면 본문, 없으면 null/404 | `body` | `id`, `year`, `month`, `employeeId`, 확정 일시·내용 등 | 존재 시 `expect(res.body).toHaveProperty('id')`; `expect(res.body.year).toBe(요청한 year)`; `expect(res.body.month).toBe(요청한 month)`; 없을 때 404면 `expect(res.status).toBe(404)` |

---

## SC-USR-003. 수정요청 응답 제출

**호출 순서**: attendance-issues-to-review → attendance-issues/:id → apply → attendance-issues/:id

| 단계 | 검증 포인트 | 응답 경로 | 검증할 컬럼·값 | Jest expect 예시 |
|------|-------------|-----------|----------------|------------------|
| 목록 | 200, 배열 | `body` | 목록 항목 `id`, `status`, `employeeId`, `requestedAt` 등 | `expect(res.status).toBe(200)`; `expect(res.body).toBeDefined()`; 항목 있으면 `expect(항목).toHaveProperty('id')`, `expect(항목).toHaveProperty('status')` |
| apply 후 상세 | APPLIED, 제출 내용 반영 | `body` | `status`='APPLIED', `correctedEnterTime`, `correctedLeaveTime`, `appliedAt`, `id` | `expect(res.body.status).toBe('APPLIED')`; 제출한 값과 일치: `expect(res.body.correctedEnterTime).toBe(요청값)`; `expect(res.body).toHaveProperty('appliedAt')` |

---

## 참고: expect 패턴

- **상태 코드**: `expect(res.status).toBe(200)` — 최소 조건, **컬럼 검증과 함께 사용**
- **객체 필드 존재**: `expect(obj).toHaveProperty('key')`; **값 일치**: `expect(obj.key).toBe(value)`
- **배열 포함**: `expect(arr.some(x => x.id === id)).toBe(true)`; 포함된 항목의 **컬럼값** 검증: `expect(항목.title).toBe(기대값)`
- **배열 길이**: `expect(arr.length).toBeGreaterThan(0)`; 수정/삭제 전후 비교 시 **length 변화** 검증
- **응답 본문**: 실제 API 스펙에 맞게 `res.body` 경로 사용 (예: `res.body.data`, `res.body.monthlySummaries`)
- **검증 우선순위**: status → 필수 필드 존재(`toHaveProperty`) → 요청값 반영(`toBe(요청값)`) → 배열/객체 구조
