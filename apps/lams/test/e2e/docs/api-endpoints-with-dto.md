# LAMS API 엔드포인트 · 요청/응답 DTO

> auth 제외. 전역 prefix: `/api`. 모든 API Bearer JWT 인증 필요.

---

## 1. 출입/근태 데이터 (attendance-data)

### GET /attendance-data/monthly-summaries

- **요청 (Query)**  
  - `year` (string, 필수): 연도  
  - `month` (string, 필수): 월  
  - `departmentId` (UUID, 필수): 부서 ID  
- **응답**  
  - `monthlySummaries`: 월간 요약 배열 (id, employeeId, yyyymm, dailySummaries, note 등)

---

### PATCH /attendance-data/daily-summaries/:id

- **요청 (Param)**  
  - `id` (UUID): 일간 요약 ID  
- **요청 (Body)** – `UpdateDailySummaryRequestDto`  
  - `enter?` (string): 출근 시간 (HH:mm:ss)  
  - `leave?` (string): 퇴근 시간  
  - `attendanceTypeIds?` (UUID[], 최대 2개): 근태 유형 ID  
  - `note?` (string): 수정 사유  
  - ※ enter/leave **또는** attendanceTypeIds 중 하나만 필수  
- **응답**  
  - 일간 요약 수정 결과 (id, enter, leave, attendanceTypeIds, note 등)

---

### GET /attendance-data/daily-summaries/:id/history

- **요청 (Param)**  
  - `id` (UUID): 일간 요약 ID  
- **응답** – `IGetDailySummaryHistoryResponse`  
  - `dailyEventSummaryId`, `histories[]` (id, date, content, changedBy, changedAt, reason, employeeInfo, changerInfo), `total`

---

### GET /attendance-data/daily-summaries/:id

- **요청 (Param)**  
  - `id` (UUID): 일간 요약 ID  
- **응답**  
  - `dailySummary`: 일간 요약 상세 (history, issues 포함)

---

### POST /attendance-data/snapshots

- **요청 (Body)** – `SaveAttendanceSnapshotRequestDto`  
  - `year` (string, 필수), `month` (string, 필수)  
- **응답**  
  - `snapshotId`, `year`, `month` 등

---

### POST /attendance-data/snapshots/restore

- **요청 (Body)** – `RestoreFromSnapshotRequestDto`  
  - `snapshotId` (UUID, 필수)  
- **응답**  
  - `year`, `month`

---

### GET /attendance-data/snapshots

- **요청 (Query)** – `GetSnapshotListRequestDto`  
  - `year` (필수), `month` (필수), `sortBy?` (latest|oldest|name|type), `filters?`  
- **응답**  
  - `snapshots[]`, 정렬/필터 결과

---

### GET /attendance-data/snapshots/:id

- **요청 (Param)** `id`: 스냅샷 ID  
- **요청 (Query)** `departmentId` (UUID, 필수)  
- **응답**  
  - 스냅샷 상세 및 하위 child 목록

---

### GET /attendance-data/monthly-summaries/:id/note

- **요청 (Param)** `id`: 월간 요약 ID  
- **응답**  
  - `monthlySummaryId`, `note`

---

### PATCH /attendance-data/monthly-summaries/:id/note

- **요청 (Param)** `id`: 월간 요약 ID  
- **요청 (Body)** – `UpdateMonthlySummaryNoteRequestDto`  
  - `note?` (string)  
- **응답**  
  - `monthlySummaryId`, `note`

---

## 2. 근태 이슈 (attendance-issues)

### GET /attendance-issues

- **요청 (Query)** – `GetAttendanceIssuesRequestDto`  
  - `employeeId?`, `startDate?`, `endDate?`, `status?` (enum)  
- **응답**  
  - `issues[]`: 근태 이슈 목록

---

### GET /attendance-issues/by-department

- **요청 (Query)**  
  - `year` (필수), `month` (필수), `departmentId` (UUID, 필수)  
- **응답**  
  - `employeeIssueGroups[]` (employeeId, employeeName, employeeNumber, issues[]), `totalIssues`, `totalEmployees`

---

### GET /attendance-issues/:id

- **요청 (Param)** `id`: 근태 이슈 ID  
- **응답**  
  - `AttendanceIssueResponseDto`: 이슈 상세 (issue 객체)

---

### PATCH /attendance-issues/:id/description

- **요청 (Param)** `id`: 근태 이슈 ID  
- **요청 (Body)** – `UpdateAttendanceIssueDescriptionRequestDto`  
  - `description` (string): 사유  
- **응답**  
  - 이슈 상세

---

### PATCH /attendance-issues/:id/apply

- **요청 (Param)** `id`: 근태 이슈 ID  
- **요청 (Body)** – `ApplyAttendanceIssueRequestDto`  
  - `confirmedBy?`, `correctedEnterTime?`, `correctedLeaveTime?`, `correctedAttendanceTypeIds?` (UUID[], 최대 2개)  
- **응답**  
  - 이슈 상세

---

### PATCH /attendance-issues/:id/re-request

- **요청 (Param)** `id`: 근태 이슈 ID  
- **응답**  
  - 이슈 상세

---

## 3. 대시보드 (dashboard)

### GET /dashboard/department/monthly-average-work-hours

- **요청 (Query)**  
  - `departmentId` (UUID, 필수), `year` (필수)  
- **응답**  
  - 부서별 월별 일평균 근무시간, 직원별 총 근무시간 등

---

### GET /dashboard/department/monthly-employee-attendance

- **요청 (Query)**  
  - `departmentId`, `year`, `month` (필수)  
- **응답**  
  - 출장/연차/결근/지각 등 직원별 근무내역

---

### GET /dashboard/department/weekly-top-employees

- **요청 (Query)**  
  - `departmentId`, `year`, `month` (필수)  
- **응답**  
  - 주차별 주간근무시간 상위 5명

---

### GET /dashboard/department/snapshots

- **요청 (Query)**  
  - `departmentId`, `year`, `month` (필수)  
- **응답**  
  - 부서별 연·월 스냅샷 목록

---

### GET /dashboard/employee/attendance-detail

- **요청 (Query)**  
  - `employeeId`, `year`, `month` (필수)  
- **응답**  
  - 직원 근태상세 (일별 요약 등)

---

## 4. 파일 관리 (file-management)

### POST /file-management/upload

- **요청 (multipart/form-data)** – `UploadFileRequestDto`  
  - `file` (binary, 필수): .xlsx/.xls/.csv  
  - `year?`, `month?`  
- **응답**  
  - `fileId`, `fileName`, `filePath`, `year`, `month`

---

### POST /file-management/reflect

- **요청 (Body)** – `ReflectFileContentRequestDto`  
  - `fileId` (UUID, 필수), `employeeNumbers` (string[], 필수), `year` (필수), `month` (필수), `info?`  
- **응답**  
  - `fileId`, `reflectionHistoryId`

---

### POST /file-management/restore-from-history

- **요청 (Body)** – `RestoreFromHistoryRequestDto`  
  - `reflectionHistoryId` (UUID, 필수), `year?`, `month?`  
- **응답**  
  - `reflectionHistoryId`, `restoreSnapshotResult` (year, month)

---

### GET /file-management/files/list

- **요청 (Query)**  
  - `year` (필수), `month` (필수)  
- **응답**  
  - `files[]`: 파일 목록

---

### GET /file-management/files/:fileId/reflection-history

- **요청 (Param)** `fileId`: 파일 ID  
- **응답**  
  - 반영이력 목록

---

### GET /file-management/files/:fileId/org-data

- **요청 (Param)** `fileId`: 파일 ID  
- **응답**  
  - 파일 orgData(조직/부서 정보)

---

### GET /file-management/files/:id/download

- **요청 (Param)** `id`: 파일 ID  
- **응답**  
  - 파일 스트림 (Content-Disposition: attachment)

---

### DELETE /file-management/files/:id

- **요청 (Param)** `id`: 파일 ID  
- **응답**  
  - `message`, `fileId`

---

## 5. 조직 관리 (organization-management)

### GET /organization-management/departments

- **요청 (Query)** – `GetDepartmentListRequestDto`  
  - `year` (필수), `month` (필수)  
- **응답**  
  - `hierarchy`: 부서 계층, `flatList`: 부서 평면 목록, `totalDepartments`, `totalEmployees`

---

## 6. 설정 (settings)

### GET /settings/permissions/departments

- **요청** 없음  
- **응답**  
  - 권한용 부서 목록 (퇴사자 부서 제외)

---

### GET /settings/permissions/employees

- **요청 (Query)**  
  - `employeeName?`, `departmentName?`  
- **응답**  
  - 직원 목록 + 부서별 권한 정보

---

### GET /settings/permissions/employees/:employeeId

- **요청 (Param)** `employeeId`: 직원 ID  
- **응답**  
  - 해당 직원의 부서별 권한 목록

---

### PATCH /settings/permissions

- **요청 (Body)** – `UpdateEmployeeDepartmentPermissionRequestDto`  
  - `employeeId` (UUID), `departments[]` (departmentId, hasAccessPermission, hasReviewPermission)  
- **응답**  
  - 권한 변경 결과

---

### PATCH /settings/employee-extra-info

- **요청 (Body)** – `UpdateEmployeeExtraInfoRequestDto`  
  - `employeeId`, `isExcludedFromSummary`  
- **응답**  
  - 직원 추가정보 변경 결과

---

### GET /settings/holidays

- **요청 (Query)**  
  - `year?`: 연도 필터  
- **응답**  
  - `holidays[]`: 휴일 목록

---

### POST /settings/holidays

- **요청 (Body)** – `CreateHolidayInfoRequestDto`  
  - `holidayName`, `holidayDate`  
- **응답**  
  - 생성된 휴일 정보

---

### PATCH /settings/holidays

- **요청 (Body)** – `UpdateHolidayInfoRequestDto`  
  - `id`, `holidayName?`, `holidayDate?`  
- **응답**  
  - 수정된 휴일 정보

---

### DELETE /settings/holidays

- **요청 (Body)** – `DeleteHolidayInfoRequestDto`  
  - `id`  
- **응답**  
  - 삭제 결과

---

### GET /settings/work-time-overrides

- **요청 (Query)**  
  - `year?`  
- **응답**  
  - 특별근태시간 목록

---

### POST /settings/work-time-overrides

- **요청 (Body)** – `CreateWorkTimeOverrideRequestDto`  
  - `date`, `startWorkTime`, `endWorkTime`, `reason?`  
- **응답**  
  - 생성된 특별근태시간

---

### PATCH /settings/work-time-overrides

- **요청 (Body)** – `UpdateWorkTimeOverrideRequestDto`  
  - `id`, `date?`, `startWorkTime?`, `endWorkTime?`, `reason?`  
- **응답**  
  - 수정 결과

---

### DELETE /settings/work-time-overrides

- **요청 (Body)** – `DeleteWorkTimeOverrideRequestDto`  
  - `id`  
- **응답**  
  - 삭제 결과

---

### GET /settings/attendance-types

- **요청** 없음  
- **응답**  
  - `attendanceTypes[]`: 근태유형 목록

---

### POST /settings/attendance-types

- **요청 (Body)** – `CreateAttendanceTypeRequestDto`  
  - `title`, `workTime`, `isRecognizedWorkTime`, `startWorkTime`, `endWorkTime`, `deductedAnnualLeave`, `code`, `isActive` 등  
- **응답**  
  - 생성된 근태유형

---

### PATCH /settings/attendance-types/:id

- **요청 (Param)** `id`: 근태유형 ID  
- **요청 (Body)** – `UpdateAttendanceTypeRequestDto`  
  - 동일 필드 (선택)  
- **응답**  
  - 수정된 근태유형

---

### DELETE /settings/attendance-types/:id

- **요청 (Param)** `id`: 근태유형 ID  
- **응답**  
  - 삭제 결과

---

## 7. 시수 관리 (work-hours)

### POST /work-hours/assign-project

- **요청 (Body)** – `AssignProjectRequestDto`  
  - `employeeId`, `projectId`, `startDate`, `endDate`  
- **응답**  
  - `id`, `employeeId`, `projectId`, `startDate`, `endDate`, `isActive`

---

### DELETE /work-hours/assign-project/:id

- **요청 (Param)** `id`: 할당된 프로젝트 ID  
- **응답**  
  - `{ success: true }`

---

### POST /work-hours/work-hours

- **요청 (Body)** – `CreateWorkHoursRequestDto`  
  - `assignedProjectId`, `date`, `startTime`, `endTime`, `workMinutes`, `note?`  
- **응답**  
  - `id`, `assignedProjectId`, `date`, `startTime`, `endTime`, `workMinutes`, `note`

---

### DELETE /work-hours/work-hours/by-date/:date

- **요청 (Param)** `date`: yyyy-MM-dd  
- **응답**  
  - `{ success: true }`

---

### GET /work-hours/monthly

- **요청 (Query)** – `GetMonthlyWorkHoursRequestDto`  
  - `employeeId` (필수), `year` (필수), `month` (필수)  
- **응답**  
  - `employeeId`, `year`, `month`, `workHours[]`, `totalWorkMinutes`

---

### GET /work-hours/projects

- **요청** 없음  
- **응답**  
  - `projects[]`, `totalCount`

---

### GET /work-hours/wage-calculation-types

- **요청** 없음  
- **응답**  
  - `wageCalculationTypes[]`

---

### POST /work-hours/wage-calculation-types

- **요청 (Body)** – `CreateWageCalculationTypeRequestDto`  
  - `calculationType`, `startDate`, `changedAt?`, `isCurrentlyApplied?`  
- **응답**  
  - 생성된 임금 계산 유형
