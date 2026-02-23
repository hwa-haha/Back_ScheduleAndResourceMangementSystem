attendance-data (AttendanceDataController)
GET /attendance-data/monthly-summaries — 월간 요약 조회
PATCH /attendance-data/daily-summaries/:id — 일간 요약 수정
POST /attendance-data/snapshots — 근태 스냅샷 저장
POST /attendance-data/snapshots/restore — 스냅샷 복원
GET /attendance-data/snapshots — 스냅샷 목록 조회

### 추가 필요 
스냅샷 - 상세조회

attendance-issues (AttendanceIssueController)
GET /attendance-issues — 근태 이슈 목록 조회
GET /attendance-issues/:id — 근태 이슈 상세 조회
PATCH /attendance-issues/:id/description — 근태 이슈 사유 수정
PATCH /attendance-issues/:id/correction — 근태 이슈 수정 정보 설정
PATCH /attendance-issues/:id/apply — 근태 이슈 반영

### 추가 필요 
근태이슈 - 수정요청, 재요청

organization-management (OrganizationManagementController)
GET /organization-management/departments — 부서 목록 조회

settings (SettingsController)
GET /settings/employees/managers — 관리자 직원 목록 조회
GET /settings/departments — 권한 관리용 부서 목록 조회
PATCH /settings/permissions — 직원-부서 권한 변경
PATCH /settings/employee-extra-info — 직원 추가 정보 변경
GET /settings/holidays — 휴일 목록 조회
POST /settings/holidays — 휴일 정보 생성
PATCH /settings/holidays — 휴일 정보 수정
DELETE /settings/holidays — 휴일 정보 삭제
GET /settings/work-time-overrides — 특별근태시간 목록 조회
POST /settings/work-time-overrides — 특별근태시간 생성
PATCH /settings/work-time-overrides — 특별근태시간 수정
DELETE /settings/work-time-overrides — 특별근태시간 삭제

### 추가 필요 
근태유형 - 목록조회, 생성, 수정, 삭제
권한 - 부서별조회

file-management (FileManagementController)
POST /file-management/upload — 파일 업로드
POST /file-management/reflect — 파일 내용 반영
POST /file-management/restore-from-history — 이력으로 되돌리기
GET /file-management/files — 파일 목록 + 반영이력 조회

### 추가 필요 
파일 - 다운로드, 삭제

user (UserController) — 업무관리시스템 유저용
GET /user/attendance-issues-to-review — 확인할 근태 이슈 목록
GET /user/confirmed-monthly-report — 전월 나의 근태현황보고서(스냅샷) 확정 정보 (query: year?, month?)