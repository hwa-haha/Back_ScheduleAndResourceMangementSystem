# LAMS (Lumir Attendance Management System) 애플리케이션 정의서

## 1. 개요

### 1.1 목적

본 문서는 **LAMS(Lumir Attendance Management System)** 애플리케이션의 구조와 기능을 정의하여 개발·테스트·운영의 기준으로 활용하는 것을 목적으로 한다.

### 1.2 범위

| 구분 | 내용 |
|------|------|
| **대상 시스템** | Lumir 일정 및 자원 관리 시스템(Back_ScheduleAndResourceMangementSystem) 내 근태 관리 백엔드 API (LAMS) |
| **포함 범위** | 출입/근태 데이터 조회·수정, 일간/월간 요약 생성·재판정, 근태 이슈 관리, 설정(휴일·특별근무시간·근태유형), 근무시간·프로젝트 배정, 파일 업로드·반영, 대시보드, 인증/인가, 조직(부서) 조회 |
| **제외 범위** | 프론트엔드 UI, SSO·ERP 등 외부 시스템 내부 구현 상세 |

### 1.3 용어 정의

| 용어 | 설명 |
|------|------|
| LAMS | Lumir Attendance Management System. 근태 관리 백엔드 애플리케이션 |
| API | Application Programming Interface |
| 일간 요약 | Daily Event Summary. 직원별 일별 출퇴근·근태 요약 정보 |
| 월간 요약 | Monthly Event Summary. 직원별 월별 근태 집계 |
| 근태 이슈 | Attendance Issue. 결근·지각·조퇴 등 판정 이슈 |
| 특별근태시간 | Work Time Override. 특정 일자의 정상 출퇴근 시간 커스터마이징 |
| 스냅샷 | 특정 시점의 월간/일간 요약 데이터 백업 |

---

## 2. 시스템 개요

### 2.1 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│  Client (Web / Mobile)                                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAMS Backend API (NestJS)                                       │
│  - Interface (Controller)  - Business  - Context (CQRS)          │
│  - Domain  - Integrations (SSO, 공휴일 API, Storage, ...)       │
└─────────────────────────────┬───────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  PostgreSQL     │  │  External (SSO,   │  │  Storage         │
│  (TypeORM)      │  │  공휴일 API 등)  │  │  (S3 / Local)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2 기술 스택

| 구분 | 기술 |
|------|------|
| Backend | NestJS, TypeScript |
| DB | PostgreSQL (TypeORM) |
| 인증 | JWT, SSO (@lumir-company/sso-sdk) |
| 스케줄링 | @nestjs/schedule (Cron, 공휴일 동기화 등) |
| 문서화 | Swagger/OpenAPI |
| Infra | AWS / On-Premise (배포 환경에 따름) |

---

## 3. 요구사항 정의

### 3.1 기능 요구사항

| ID | 기능명 | 설명 |
|----|--------|------|
| FR-01 | 로그인/토큰 | SSO 연동 로그인, 토큰 발급·검증 |
| FR-02 | 출입/근태 데이터 | 월간·일간 요약 조회, 일간 요약 수정, 스냅샷 저장·복원 |
| FR-03 | 근태 이슈 | 이슈 목록 조회, 부서별 조회, 상세·설명 수정·적용·재요청 |
| FR-04 | 설정 | 휴일·특별근태시간·근태유형 CRUD, 권한(부서/직원) 관리 |
| FR-05 | 근무시간 | 월별 근무시간 조회, 프로젝트 배정, 근무시간 입력, 급여계산유형 |
| FR-06 | 파일 관리 | 파일 업로드, 내용 반영, 이력 조회·복원, 다운로드 |
| FR-07 | 조직 관리 | 부서 목록 조회 |
| FR-08 | 대시보드 | 부서 월평균 근무시간, 부서 월별 직원 근태, 주간 상위 직원, 스냅샷, 직원 근태 상세 |

### 3.2 비기능 요구사항

- **성능**: API 응답 시간 3초 이내 목표
- **보안**: JWT 기반 인가, 개인정보 암호화·접근 제어
- **가용성**: 99.9% 목표 (환경에 따름)

---

## 4. 애플리케이션 구조 설계

### 4.1 전체 구조

**Layered Architecture (Interface → Business → Context → Domain)**

| 레이어 | 설명 | 위치 예 |
|--------|------|----------|
| **Interface** | HTTP API 노출, DTO·유효검사 | `interface/attendance-data`, `interface/settings` |
| **Business** | 유스케이스 오케스트레이션, 트랜잭션 경계 | `business/attendance-data-business`, `business/settings-business` |
| **Context** | CQRS Command/Query Handler, 도메인 서비스 조합 | `context/attendance-data-context`, `context/settings-context` |
| **Domain** | 엔티티, 도메인 서비스, 비즈니스 규칙 | `domain/daily-event-summary`, `domain/holiday-info` |
| **Integrations** | 외부 연동 (SSO, 공휴일 API, Storage, Migration) | `integrations/holiday-sync`, `integrations/s3-storage` |

### 4.2 모듈 구성

| 모듈명 | 설명 |
|--------|------|
| Auth | 로그인, 토큰 발급·검증, 조직 마이그레이션 |
| AttendanceData | 월간/일간 요약 조회·수정, 스냅샷 저장·복원, 일간 재판정·월간 요약 생성 |
| AttendanceIssue | 근태 이슈 조회, 부서별 조회, 상세·설명 수정·적용·재요청 |
| Settings | 휴일·특별근태시간·근태유형 CRUD, 권한(부서/직원)·직원 추가정보 관리 |
| WorkHours | 근무시간 월별 조회, 프로젝트 배정, 근무시간 입력, 급여계산유형 |
| FileManagement | 파일 업로드·반영·이력·복원·다운로드 |
| OrganizationManagement | 부서 목록 조회 |
| Dashboard | 부서/직원 기준 집계·대시보드 API |

---

## 5. 화면 설계

### 5.1 화면 목록 (API 관점)

| 화면/기능 ID | 설명 (API 제공 기능) |
|--------------|------------------------|
| UI-01 | 로그인·토큰 |
| UI-02 | 월간/일간 요약 조회·수정, 스냅샷 |
| UI-03 | 근태 이슈 목록·상세·처리 |
| UI-04 | 설정(휴일·특별근무·근태유형·권한) |
| UI-05 | 근무시간·프로젝트 배정 |
| UI-06 | 파일 업로드·반영·이력 |
| UI-07 | 부서 목록 |
| UI-08 | 대시보드(부서/직원 집계) |

### 5.2 화면 흐름도

(※ 실제 프론트엔드 화면 설계 시 피그마 등으로 별도 정의)

로그인 → 메인/대시보드 → 월간 요약 조회 → 일간 요약 수정 / 근태 이슈 처리 / 설정 / 파일 반영 등

---

## 6. 데이터 설계

### 6.1 ERD (주요 엔티티)

| 엔티티 | 설명 |
|--------|------|
| DailyEventSummary | 일간 요약 (날짜·직원·출퇴근·결근/지각/조퇴·근무시간·휴일여부 등) |
| MonthlyEventSummary | 월간 요약 (연월·직원·일간 요약 집계) |
| EventInfo | 출입/이벤트 원본 |
| UsedAttendance | 사용된 근태 유형(연차·반차 등) |
| AttendanceIssue | 근태 이슈 (결근·지각·조퇴 등) |
| HolidayInfo | 휴일 정보 |
| WorkTimeOverride | 특별근태시간(일별 정상근무 시간 커스터마이징) |
| WorkHours | 근무시간 (날짜·직원·프로젝트·시간) |
| AssignedProject / Project | 배정 프로젝트·프로젝트 |
| File / FileContentReflectionHistory | 업로드 파일·반영 이력 |
| DataSnapshotInfo / DataSnapshotChild | 스냅샷 메타·자식 데이터 |
| AttendanceType, WageCalculationType | 근태유형·급여계산유형 |
| Employee, Department (libs) | 직원·부서 (공통 모듈) |

### 6.2 테이블 정의 (예시)

| 테이블 | 설명 |
|--------|------|
| daily_event_summaries | 일간 요약 |
| monthly_event_summaries | 월간 요약 |
| event_info | 출입/이벤트 원시 데이터 |
| used_attendances | 사용 근태 유형 |
| attendance_issues | 근태 이슈 |
| holiday_info | 휴일 |
| work_time_overrides | 특별근태시간 |
| work_hours | 근무시간 |
| files | 파일 메타 |
| data_snapshot_info / data_snapshot_child | 스냅샷 |

(전체 테이블 목록은 TypeORM 엔티티 및 마이그레이션 참고)

---

## 7. 인터페이스 설계 (API)

### 7.1 API 목록 (요약)

| Method | URL (prefix 제외) | 설명 |
|--------|-------------------|------|
| **Auth** | | |
| POST | /auth/login | 로그인 |
| POST | /auth/generate-token | 토큰 발급 |
| POST | /auth/verify-token | 토큰 검증 |
| POST | /auth/migrate-organization | 조직 마이그레이션 |
| **Attendance Data** | | |
| GET | /attendance-data/monthly-summaries | 월간 요약 조회 |
| PATCH | /attendance-data/daily-summaries/:id | 일간 요약 수정 |
| GET | /attendance-data/daily-summaries/:id/history | 일간 요약 수정이력 |
| GET | /attendance-data/daily-summaries/:id | 일간 요약 상세 |
| POST | /attendance-data/snapshots | 스냅샷 저장 |
| POST | /attendance-data/snapshots/restore | 스냅샷 복원 |
| GET | /attendance-data/snapshots | 스냅샷 목록 |
| GET | /attendance-data/snapshots/:id | 스냅샷 상세 |
| GET | /attendance-data/monthly-summaries/:id/note | 월간 요약 노트 조회 |
| PATCH | /attendance-data/monthly-summaries/:id/note | 월간 요약 노트 수정 |
| **Attendance Issues** | | |
| GET | /attendance-issues | 근태 이슈 목록 |
| GET | /attendance-issues/by-department | 부서별 근태 이슈 |
| GET | /attendance-issues/:id | 근태 이슈 상세 |
| PATCH | /attendance-issues/:id/description | 설명 수정 |
| PATCH | /attendance-issues/:id/apply | 적용 |
| PATCH | /attendance-issues/:id/re-request | 재요청 |
| **Settings** | | |
| GET | /settings/permissions/departments | 권한용 부서 목록 |
| GET | /settings/permissions/employees | 권한용 직원 목록 |
| GET | /settings/permissions/employees/:employeeId | 직원 권한 목록 |
| PATCH | /settings/permissions | 권한 변경 |
| PATCH | /settings/employee-extra-info | 직원 추가정보 변경 |
| GET | /settings/holidays | 휴일 목록 |
| POST | /settings/holidays | 휴일 생성 |
| PATCH | /settings/holidays | 휴일 수정 |
| DELETE | /settings/holidays | 휴일 삭제 |
| GET | /settings/work-time-overrides | 특별근태시간 목록 |
| POST | /settings/work-time-overrides | 특별근태시간 생성 |
| PATCH | /settings/work-time-overrides | 특별근태시간 수정 |
| DELETE | /settings/work-time-overrides | 특별근태시간 삭제 |
| GET | /settings/attendance-types | 근태유형 목록 |
| POST | /settings/attendance-types | 근태유형 생성 |
| PATCH | /settings/attendance-types/:id | 근태유형 수정 |
| DELETE | /settings/attendance-types/:id | 근태유형 삭제 |
| **Work Hours** | | |
| POST | /work-hours/assign-project | 프로젝트 배정 |
| DELETE | /work-hours/assign-project/:id | 프로젝트 배정 삭제 |
| POST | /work-hours/work-hours | 근무시간 입력 |
| DELETE | /work-hours/work-hours/by-date/:date | 근무시간 삭제 |
| GET | /work-hours/monthly | 월별 근무시간 조회 |
| GET | /work-hours/projects | 프로젝트 목록 |
| GET | /work-hours/wage-calculation-types | 급여계산유형 목록 |
| POST | /work-hours/wage-calculation-types | 급여계산유형 생성 |
| **File Management** | | |
| POST | /file-management/upload | 파일 업로드 |
| POST | /file-management/reflect | 파일 내용 반영 |
| POST | /file-management/restore-from-history | 이력 기준 복원 |
| GET | /file-management/files/list | 파일 목록 |
| GET | /file-management/files/:fileId/reflection-history | 반영 이력 |
| GET | /file-management/files/:fileId/org-data | 원본 데이터 |
| GET | /file-management/files/:id/download | 다운로드 |
| DELETE | /file-management/files/:id | 파일 삭제 |
| **Organization** | | |
| GET | /organization-management/departments | 부서 목록 |
| **Dashboard** | | |
| GET | /dashboard/department/monthly-average-work-hours | 부서 월평균 근무시간 |
| GET | /dashboard/department/monthly-employee-attendance | 부서 월별 직원 근태 |
| GET | /dashboard/department/weekly-top-employees | 부서 주간 상위 직원 |
| GET | /dashboard/department/snapshots | 부서 스냅샷 |
| GET | /dashboard/employee/attendance-detail | 직원 근태 상세 |

### 7.2 API 상세

- Request/Response 형식: JSON. DTO는 Swagger 데코레이터로 정의.
- 인증: `Authorization: Bearer <JWT>` (로그인·토큰 API 제외).
- 에러: NestJS 표준 HTTP 상태 코드 및 `message` 등 일관된 예외 응답.

---

## 8. 보안 설계

- **인증/인가**: JWT Bearer 토큰, 전역 `JwtAuthGuard` 적용(필요 시 엔드포인트별 예외).
- **권한 관리**: 부서/직원 단위 권한 설정(설정 모듈), API별 필요 시 부서·직원 검증.
- **개인정보**: 접근 제어 및 저장·전송 시 암호화 정책 적용.

---

## 9. 운영 및 배포

- **실행**: `npm run start:lams` (개발 감시), `nest start lams` (프로덕션).
- **배포**: CI/CD·환경별 설정에 따라 빌드 후 Node 프로세스 또는 컨테이너로 배포.
- **로그**: NestJS Logger 및 애플리케이션 로그 수준·포맷 정의.
- **장애 대응**: 로그·헬스체크·알림 연동 등 운영 정책에 따름.

---

## 10. 부록

### 10.1 참고 문서

- AGENTS.md (커밋·코딩 규칙)
- libs/database README, ENTITY_LOADING_PATTERN.md
- context별 README (attendance-data-context, settings-context 등)

### 10.2 변경 이력

| 일자 | 버전 | 변경 내용 |
|------|------|-----------|
| (작성일) | 0.1 | LAMS 애플리케이션 정의서 최초 작성 (문서 틀에 맞춰 내용 채움) |
