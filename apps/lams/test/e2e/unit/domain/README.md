# 도메인 단위 테스트 (52100)

`apps/lams/src/domain` 의 **모든** 도메인 서비스에 대응하는 `*.service.spec.ts` 가 이 디렉터리와 동일 구조로 있습니다.

**원칙**: 각 도메인 서비스의 **공개 메서드(함수) 개수만큼** 최소 1개 이상의 테스트(`describe`/`it`)를 둡니다.  
예: `DomainAssignedProjectService`는 공개 메서드 13개 → 생성한다, ID로조회한다, 직원ID로조회한다, 활성할당전체조회한다, 프로젝트ID로조회한다, 직원과프로젝트로조회한다, 활성화된목록조회한다, 날짜로활성화된목록조회한다, 수정한다, 삭제한다, 직원별할당전체비활성화한다, 직원프로젝트할당활성화또는생성한다, 완전삭제한다 각각 검증.

## 도메인 서비스 ↔ 스펙 파일 매핑 (19개)

| # | 도메인 (src/domain) | 스펙 파일 (test/e2e/unit/domain) |
|---|---------------------|----------------------------------|
| 1 | attendance-issue | attendance-issue/attendance-issue.service.spec.ts |
| 2 | attendance-type | attendance-type/attendance-type.service.spec.ts |
| 3 | assigned-project | assigned-project/assigned-project.service.spec.ts |
| 4 | data-snapshot-child | data-snapshot-child/data-snapshot-child.service.spec.ts |
| 5 | data-snapshot-info | data-snapshot-info/data-snapshot-info.service.spec.ts |
| 6 | daily-event-summary | daily-event-summary/daily-event-summary.service.spec.ts |
| 7 | daily-summary-change-history | daily-summary-change-history/daily-summary-change-history.service.spec.ts |
| 8 | employee-department-permission | employee-department-permission/employee-department-permission.service.spec.ts |
| 9 | employee-extra-info | employee-extra-info/employee-extra-info.service.spec.ts |
| 10 | event-info | event-info/event-info.service.spec.ts |
| 11 | file | file/file.service.spec.ts |
| 12 | file-content-reflection-history | file-content-reflection-history/file-content-reflection-history.service.spec.ts |
| 13 | holiday-info | holiday-info/holiday-info.service.spec.ts |
| 14 | monthly-event-summary | monthly-event-summary/monthly-event-summary.service.spec.ts |
| 15 | project | project/project.service.spec.ts |
| 16 | used-attendance | used-attendance/used-attendance.service.spec.ts |
| 17 | wage-calculation-type | wage-calculation-type/wage-calculation-type.service.spec.ts |
| 18 | work-hours | work-hours/work-hours.service.spec.ts |
| 19 | work-time-override | work-time-override/work-time-override.service.spec.ts |

## 엔티티 스펙 (문서 2.1·예시 2)

| 엔티티 | 스펙 파일 |
|--------|-----------|
| AttendanceIssue | attendance-issue/attendance-issue.entity.spec.ts |
| DataSnapshotChild | data-snapshot-child/data-snapshot-child.entity.spec.ts |

## 실행 (모노레포 루트에서)

**도메인 단위만 실행 (위 19 서비스 + 2 엔티티):**
```bash
npm run test -- --testPathPattern="e2e/unit/domain"
```

**전체 단위 테스트 (libs + apps 모든 *.spec.ts):**
```bash
npm run test
```

`roots`에 `apps/`가 포함되어 있으므로 `apps/lams/test/e2e/unit/domain/**/*.spec.ts` 는 위 명령으로 모두 실행됩니다.
