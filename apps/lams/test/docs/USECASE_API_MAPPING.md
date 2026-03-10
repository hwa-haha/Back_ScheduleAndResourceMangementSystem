# 유즈케이스–API 매핑

> 출처: `attendance_usecases.md`(프론트 기준) × `API_LIST.md`  
> **분석 기준**: 유즈케이스를 "프론트에서의 선택/표시(API 없음)" vs "그 선택값을 사용해 요청하는 API 호출"로 구분.

---

## 분석 원칙

| 구분 | 설명 | API 매핑 |
|------|------|-----------|
| **선택/표시(프론트 전용)** | 셀렉트바·탭·필터에서 항목을 선택하거나 화면만 전환. 서버 요청 없음. | **없음** (선택된 값은 다른 UC에서 API 파라미터로 사용) |
| **API 호출** | 선택된 연월·부서·ID 등을 **파라미터로 담아** 서버에 요청. | 해당 API 명시 + 필요 시 "사용하는 선택값: UCn" 표기 |

예: **UC2 부서 선택** = 사이드바에서 부서를 고르는 행위만 함 → API 없음.  
**UC3 근태 기록 조회** = UC1(연월), UC2(부서)에서 선택한 값을 가지고 요청 → `GET /api/attendance-data/monthly-summaries` 매핑.

---

## 1. 근태 데이터 조회/관리

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC1 | 연월 선택 | 조회할 연·월을 셀렉트로 선택 | **없음** | 선택 연월은 **UC3** 요청 시 사용 |
| UC2 | 부서 선택 | 사이드바(셀렉트바)에서 조회할 부서 선택 | **없음** | 선택 부서는 **UC3** 요청 시 사용 |
| UC3 | 근태 기록 조회 | **UC1 연월 + UC2 부서**를 가지고 근태 기록 요청 | GET /api/attendance-data/monthly-summaries | 월간 요약 조회 (연월·부서 등 파라미터) |
| UC4 | 근태 기록 셀 상세 조회 | 특정 직원·날짜 셀 클릭 시 상세 요청 | GET /api/attendance-data/daily-summaries/:id | 일간 요약 상세 |
| UC5 | 근태 기록 셀 수정 | 셀 수정 후 저장 요청 | PATCH /api/attendance-data/daily-summaries/:id | 일간 요약 수정 |
| UC6 | 월별 비고 조회 | 특정 직원 월별 비고 요청 | GET /api/attendance-data/monthly-summaries/:id/note | 월간 요약 노트 조회 |
| UC7 | 월별 비고 수정 | 월별 비고 저장 요청 | PATCH /api/attendance-data/monthly-summaries/:id/note | 월간 요약 노트 수정 |

---

## 2. 스냅샷 관리

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC8 | 스냅샷 목록 조회 | 스냅샷 목록 요청 | GET /api/attendance-data/snapshots | 스냅샷 목록 |
| UC9 | 스냅샷 불러오기 | 목록에서 스냅샷 선택 후 상세 요청, 보기 모드 전환 | GET /api/attendance-data/snapshots/:id | 상세 조회 후 보기 모드는 프론트 |
| UC10 | 스냅샷 저장 | 현재 화면 기준 스냅샷 저장 요청 | POST /api/attendance-data/snapshots | 근태 스냅샷 저장 |
| UC11 | 원래 버전으로 돌아가기 | 보기 모드 해제, 현재 버전 화면으로 전환 | **없음** | 프론트만(보기 모드 해제) |
| UC12 | 롤백하기 | 보기 중인 스냅샷을 현재 버전으로 복원 요청 | POST /api/attendance-data/snapshots/restore | 스냅샷으로부터 복원 |

---

## 3. 파일 관리

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC13 | 파일 업로드 | 파일 선택 후 업로드 요청 | POST /api/file-management/upload | 파일 업로드(엑셀 검증) |
| UC14 | 파일 목록 조회 | 파일 목록 요청 | GET /api/file-management/files/list | 파일 목록 |
| UC15 | 파일 반영 히스토리 조회 | 특정 파일의 반영 이력 요청 | GET /api/file-management/files/:fileId/reflection-history | 반영이력 조회 |
| UC16 | 파일 다운로드 | 파일 다운로드 요청 | GET /api/file-management/files/:id/download | 파일 다운로드 |
| UC17 | 파일 삭제 | 파일 삭제 요청 | DELETE /api/file-management/files/:id | 파일 삭제 |
| UC18 | 반영 작업 생성 | 업로드 파일을 근태 기록에 반영 요청 | POST /api/file-management/reflect | 파일 내용 반영 |
| UC19 | 특정 시점으로 이동 | 타임라인에서 시점 선택 후 해당 시점으로 되돌리기 요청 | POST /api/file-management/restore-from-history | 이력으로 되돌리기 |

---

## 4. 수정 내역 관리

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC20 | 셀 히스토리 조회 | 특정 셀의 수정 이력 요청 | GET /api/attendance-data/daily-summaries/:id/history | 일간 요약 수정이력 |

---

## 5. 근태 이슈 관리

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC21 | 근태 이슈 목록 조회 | 검토 대상 이슈 목록 요청(연월·부서 등 선택 시 해당 값으로 요청) | GET /api/attendance-issues<br>GET /api/attendance-issues/by-department | 목록 / 연월·부서별 |
| UC22 | 수정요청 전송 | 이슈에 대해 직원에게 수정 요청 전송 | POST /api/attendance-issues/request<br>POST /api/attendance-issues/:id/request | 복수 / 단건 요청 |
| UC23 | 근태 이슈 반영 | 직원 응답·변경사항 반영 요청 | PATCH /api/attendance-issues/:id/apply | 근태 이슈 반영 |

---

## 6. 근태유형 관리

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC24 | 근태유형 목록 조회 | 근태유형 목록 요청 | GET /api/settings/attendance-types | 근태유형 목록 |
| UC25 | 근태유형 생성 | 새 근태유형 생성 요청 | POST /api/settings/attendance-types | 근태유형 생성 |
| UC26 | 근태유형 사용여부 변경 | 사용 여부 변경 후 저장 요청 | PATCH /api/settings/attendance-types/:id | 근태유형 수정 |
| UC27 | 근태유형 삭제 | 근태유형 삭제 요청 | DELETE /api/settings/attendance-types/:id | 근태유형 삭제 |

---

## 7. 부서 권한 관리

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC28 | 부서 목록 조회 | 부서 목록 요청(사이드바 등 채울 때 사용) | GET /api/organization-management/departments<br>GET /api/settings/permissions/departments | 부서 목록 / 권한 관리용 |
| UC29 | 부서별 직원 권한 목록 조회 | 부서 선택 후 해당 부서 직원 권한 목록 요청 | GET /api/settings/permissions/departments/:departmentId | 부서별 직원 권한 목록 |
| UC30 | 부서별 권한 저장 | 직원별 권한 변경 후 저장 요청 | PATCH /api/settings/permissions | 부서별 직원 권한 변경 |

---

## 8. 집계 대상 관리

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC31 | 직원 목록 가져오기 | 직원 목록 요청 | GET /api/settings/permissions/employees<br>GET /api/settings/permissions/employees/with-extra-info | 권한·추가정보 포함 |
| UC32 | 계산제외 설정 변경 | 집계 제외/포함 변경 후 저장 요청 | PATCH /api/settings/employee-extra-info | 직원 추가 정보(대시보드 제외 등) |

---

## 9. 결재 관리

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC33 | 검토권한자 조회 | 부서별 검토권한자 목록 요청 | GET /api/approval/reviewers-by-department | 결재 부서별 권한자 |
| UC34 | 스냅샷 결재 상신 | 스냅샷 결재 상신 요청 | PATCH /api/approval/snapshots/:snapshotId/approval | 결재 상태 업데이트 |
| UC35 | 스냅샷 결재 조회 | 제출된 스냅샷 결재 상태 요청 | GET /api/dashboard/department/snapshots<br>GET /api/attendance-data/snapshots/:id | 부서·연월별 스냅샷 / 상세 |
| UC36 | 결재상태 업데이트 | 스냅샷 상신 상태 변경 요청 | PATCH /api/approval/snapshots/:snapshotId/approval | 스냅샷 결재 업데이트 |

---

## 10. 휴무일정 관리

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC37 | 공휴일 목록 조회 | 연도 등 선택 후 공휴일 목록 요청 | GET /api/settings/holidays | 휴일 목록 |
| UC38 | 공휴일 생성 | 새 공휴일 생성 요청 | POST /api/settings/holidays | 휴일 생성 |
| UC39 | 공휴일 수정 | 공휴일 수정 요청 | PATCH /api/settings/holidays | 휴일 수정 |
| UC40 | 공휴일 삭제 | 공휴일 삭제 요청 | DELETE /api/settings/holidays | 휴일 삭제 |
| UC41 | 특별근태 목록 조회 | 특별근태 목록 요청 | GET /api/settings/work-time-overrides | 특별근태시간 목록 |
| UC42 | 특별근태 생성 | 새 특별근태 생성 요청 | POST /api/settings/work-time-overrides | 특별근태시간 생성 |
| UC43 | 특별근태 수정 | 특별근태 수정 요청 | PATCH /api/settings/work-time-overrides | 특별근태시간 수정 |
| UC44 | 특별근태 삭제 | 특별근태 삭제 요청 | DELETE /api/settings/work-time-overrides | 특별근태시간 삭제 |

---

## 11. 근태 대시보드

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC45 | 연월 선택 | 대시보드에서 조회할 연·월 셀렉트 선택 | **없음** | 선택 연월은 **UC46·UC47·UC49** 등 요청 시 사용 |
| UC46 | 부서 목록 조회 | **UC45 연월**을 기준으로 근태 데이터가 있는 부서 조회 요청 | GET /api/organization-management/departments/by-access-permission<br>GET /api/dashboard/department/snapshots | 접근 권한 부서 / 연월·부서 스냅샷 |
| UC47 | 주차별 직원 리스트 조회 | **UC45 연월 + 선택 부서**로 주차별 직원 리스트 요청 | GET /api/dashboard/department/weekly-top-employees | 주간근무시간 상위 5명 |
| UC48 | 직원 근태 상세 조회 | 직원·연월 선택 후 근태 상세 요청 | GET /api/dashboard/employee/attendance-detail | 연도·월·직원 기준 근태상세 |
| UC49 | 하단 근태 관리 표 조회 | **UC45 연월 + 선택 부서**로 하단 표 데이터 요청 | GET /api/dashboard/department/monthly-employee-attendance<br>GET /api/dashboard/department/monthly-employee-work-hours | 근무내역 / 근무시간 |
| UC50 | 근무시간 최소·최대 설정 | 차트 Y축 범위만 변경 | **없음** | 프론트만(차트 옵션) |

---

## 12. 시수관리 (내근태) — User

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC51 | 연월 선택 | 조회할 연·월 셀렉트 선택 | **없음** | 선택 연월은 **UC54·UC59·UC60** 등 요청 시 사용 |
| UC52 | 프로젝트 목록 조회 | 특정 월(또는 현재 선택 연월) 기준 프로젝트 목록 요청 | GET /api/work-hours/projects | 프로젝트 목록 |
| UC53 | 프로젝트 순서 저장 | 표시 순서만 로컬/프론트 저장 | **없음** | 프론트/로컬 저장 |
| UC54 | 시수 캘린더 조회 | **UC51 연월**로 월별 시수 요청 | GET /api/work-hours/monthly | 월별 시수 현황 |
| UC55 | 시수 일자별 상세 조회 | 특정 일자 클릭 시 해당 일 시수 상세 요청 | GET /api/work-hours/daily | 일별 시수 상세 |
| UC56 | 시간 블록 저장 | 시간 블록 추가/수정 후 저장 요청 | POST /api/work-hours/work-hours<br>PUT /api/work-hours/work-hours/:id | 시수 입력 / 수정 |
| UC57 | 시간 블록 삭제 | 특정 블록 삭제 요청 | DELETE /api/work-hours/work-hours/:id | 시수 삭제 |
| UC58 | 시간 블록 일자별 모두 삭제 | 특정 일자 전체 삭제 요청 | DELETE /api/work-hours/work-hours/by-date/:date | 날짜별 시수 삭제 |
| UC59 | 내보고서 존재여부 확인 | **UC51 연월**로 해당 연월 보고서 존재 여부 요청 | GET /api/user/monthly-report-existence | 월별 근태현황 보고서 존재 여부 |
| UC60 | 내보고서 조회 | **UC51 연월**로 해당 연월 보고서 요청 | GET /api/user/confirmed-monthly-report | 전월 근태현황보고서 확정 정보 |
| UC61 | 수정요청 월별 조회 | 월별 수정요청(확인할 이슈/제출 스냅샷) 목록 요청 | GET /api/user/attendance-issues-to-review<br>GET /api/user/monthly-submitted-snapshots | 확인할 근태 이슈 / 제출 스냅샷 목록 |
| UC62 | 수정요청 날짜로 조회 | 목록에서 항목 선택 시 상세 요청 | GET /api/attendance-issues/:id | 근태 이슈 상세 |
| UC63 | 수정요청 응답 제출 | 수정요청에 대한 응답(반영) 제출 | PATCH /api/attendance-issues/:id/apply | 근태 이슈 반영 |
| UC64 | 어드민 통계 탭 표시 | 권한에 따라 통계 탭 노출 | **없음** | 프론트 권한/UI 분기 |
| UC65 | 어드민 설정 탭 표시 | 권한에 따라 설정 탭 노출 | **없음** | 프론트 권한/UI 분기 |
| UC66 | 어드민 직원 선택 및 조회 | 직원 선택 후 해당 직원 수정요청 목록 요청 | GET /api/attendance-issues<br>GET /api/attendance-issues/by-department | 근태 이슈 목록/부서별 |
| UC67 | 조회모드 제한 확인 | 권한에 따라 수정요청/보고서만 노출 | **없음** | 프론트 권한/UI 분기 |

---

## 13. 통계

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC68 | 연월 선택 | 통계 조회할 연·월 셀렉트 선택 | **없음** | 선택 연월은 **UC69·UC71·UC72** 요청 시 사용 |
| UC69 | 월별 부서 목록 조회 | **UC68 연월** 기준 사용 부서 목록 요청 | GET /api/organization-management/departments/with-employees<br>GET /api/work-hours/employees-with-assignments | 부서+직원 / 직원·할당 |
| UC70 | 부서별 직원 목록 조회 | 부서 선택 후 해당 부서 직원 목록 요청 | GET /api/organization-management/departments/with-employees<br>GET /api/work-hours/employees/:employeeId/assigned-projects | 부서별 직원 / 직원별 할당 |
| UC71 | 직원 통계 조회 | **UC68 연월**(+ 필터)으로 직원별 시수 통계 요청 | GET /api/work-hours/statistics/by-employee | 시수 통계(직원 기준) |
| UC72 | 프로젝트 통계 조회 | **UC68 연월**(+ 필터)으로 프로젝트별 시수 통계 요청 | GET /api/work-hours/statistics/by-project | 시수 통계(프로젝트 기준) |
| UC73 | 통계 필터 설정 | 프로젝트/부서/직원 필터 UI만 변경 | **없음** | 필터 값은 UC71·UC72 요청 시 사용 |
| UC74 | 통계 모드 전환 | 직원 통계 ↔ 프로젝트 통계 탭 전환 | **없음** | 전환 시 UC71 또는 UC72 호출 |

---

## 14. 설정

| UC ID | 유즈케이스명 | 프론트 동작 | 매핑 API | 비고 |
|-------|-------------|------------|----------|------|
| UC75 | 직원 목록 조회 | 직원 목록 요청 | GET /api/settings/permissions/employees<br>GET /api/settings/permissions/employees/with-extra-info | 권한/추가정보 포함 |
| UC76 | 프로젝트 목록 조회 | 프로젝트 목록 요청 | GET /api/work-hours/projects | 프로젝트 목록 |
| UC77 | 직원 프로젝트 할당 목록 조회 | 직원 선택 시 해당 직원 할당 목록 요청 | GET /api/work-hours/employees/:employeeId/assigned-projects<br>GET /api/work-hours/employees-with-assignments | 직원별 할당 / 전체 |
| UC78 | 프로젝트 할당 | 직원에게 프로젝트 할당 후 저장 요청 | PUT /api/work-hours/assign-projects | 프로젝트 할당 일괄 갱신 |
| UC79 | 프로젝트 할당 해제 | 할당 해제 후 저장 요청 | PUT /api/work-hours/assign-projects | 동일 API로 제거 포함 |
| UC80 | 프로젝트 할당 변경사항 저장 | 변경사항 일괄 저장 요청 | PUT /api/work-hours/assign-projects | 프로젝트 할당 일괄 갱신 |
| UC81 | 근무 모드 히스토리 조회 | 근무 모드 변경 이력 요청 | **없음** | 해당 전용 API 없음 |
| UC82 | 근무 모드 변경 | 고정/유연 모드 변경 요청 | **없음** | 해당 전용 API 없음 |

---

## 매핑 요약

| 구분 | 개수 | 설명 |
|------|------|------|
| **API 호출이 있는 유즈케이스** | 60 | 해당 UC에서 직접 API 호출 (선택값은 선행 UC에서 채움) |
| **프론트 전용(선택/표시)** | 20 | 셀렉트·탭·필터 선택 또는 권한/UI 분기. API 없음. 선택값은 다른 UC에서 사용 |
| **전용 API 없음** | 2 | UC81, UC82 (근무 모드 관련) |

### 프론트 전용으로 둔 유즈케이스 (선택값은 다른 UC에서 API 파라미터로 사용)

- **연월/부서/필터 선택**: UC1, UC2, UC45, UC51, UC68, UC73 → 각 구간의 "조회" UC에서 선택값으로 요청
- **화면/모드 전환만**: UC11(보기 모드 해제), UC50(차트 범위), UC53(순서 저장), UC64, UC65, UC67(탭/권한), UC74(통계 모드 전환)

### 연계 예시 (근태 데이터 화면)

1. **UC1** 연월 선택 (API 없음)  
2. **UC2** 부서 선택 (API 없음)  
3. **UC3** 근태 기록 조회 → `GET /api/attendance-data/monthly-summaries` **(UC1 연월 + UC2 부서)** 로 요청
