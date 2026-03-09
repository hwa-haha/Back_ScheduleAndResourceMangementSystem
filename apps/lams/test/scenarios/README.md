# 시나리오 테스트 문서 (25개, Jest E2E)

`attendance_scenarios_full.md`에 정의된 **시나리오 25개 전체**를 Jest E2E로 검증하기 위한 문서 모음이다.

## 문서 구성

| 파일                                             | 설명                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| [rule.md](./rule.md)                             | Jest 테스트 구조(describe/it), 공통 setup, 검증 방식, 파일 위치·명명                                      |
| [scenarios.md](./scenarios.md)                   | 시나리오 **25개** 전체: 목적, 전제, UC, API 호출 순서, 입력값, **Jest 테스트 제안**(describe/it, fixture) |
| [verification-notes.md](./verification-notes.md) | 시나리오별 **응답 경로**와 **Jest expect 예시** (복붙·수정용)                                             |

## 시나리오 목록 (25개, attendance_scenarios_full.md 기준)

| ID         | 시나리오명                           | 역할  |
| ---------- | ------------------------------------ | ----- |
| SC-ADM-001 | 파일 업로드 및 반영                  | Admin |
| SC-ADM-002 | 파일 타임라인 조회 및 특정 시점 복원 | Admin |
| SC-ADM-003 | 근태 기록 조회                       | Admin |
| SC-ADM-004 | 근태 이슈 관리                       | Admin |
| SC-ADM-005 | 근태 기록 수정                       | Admin |
| SC-ADM-006 | 월별 비고 관리                       | Admin |
| SC-ADM-007 | 수정 내역 조회                       | Admin |
| SC-ADM-008 | 스냅샷 저장                          | Admin |
| SC-ADM-009 | 스냅샷 불러오기 및 롤백              | Admin |
| SC-ADM-010 | 스냅샷 결재 상신                     | Admin |
| SC-ADM-011 | 스냅샷 결재 조회                     | Admin |
| SC-ADM-012 | 근태유형 관리                        | Admin |
| SC-ADM-013 | 부서 권한 관리                       | Admin |
| SC-ADM-014 | 집계 대상 관리                       | Admin |
| SC-ADM-015 | 휴무일정 관리                        | Admin |
| SC-ADM-016 | 파일 삭제                            | Admin |
| SC-ADM-017 | 근태 대시보드 조회                   | Admin |
| SC-ADM-018 | 시수 통계 조회                       | Admin |
| SC-ADM-019 | 프로젝트 할당 관리                   | Admin |
| SC-ADM-020 | 근무 모드 관리                       | Admin |
| SC-ADM-021 | 저장 전 확인 처리                    | Admin |
| SC-ADM-022 | 근태 조회 팝업 실행                  | Admin |
| SC-USR-001 | 시수 입력 및 블록 관리               | User  |
| SC-USR-002 | 내보고서 조회                        | User  |
| SC-USR-003 | 수정요청 응답 제출                   | User  |

## Jest 테스트 작성 시

1. **scenarios.md**에서 해당 시나리오의 API 순서·입력값·제안된 it 목록 확인
2. **verification-notes.md**에서 응답 경로와 `expect(...)` 예시 참고
3. **rule.md**에 따라 describe/it 구조·setup·검증 방식 적용

테스트 스펙 파일은 `test/e2e/scenarios/` 또는 `test/scenarios/specs/`에 `scenario-SC-XXX-nnn.e2e-spec.ts` 형식으로 두면 된다.
