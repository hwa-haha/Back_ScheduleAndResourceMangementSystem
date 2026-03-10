# 근태 시스템 시나리오 정의

---

  시나리오 ID  시나리오명   역할    목적                 전제 조건 유즈케이스   관련 페이지 / 모달         주요 정책               예외 처리
                                                                   흐름                                                            

---

  SC-ADM-001   근태유형     Admin   근태유형             Admin     UC24 → UC25  SET_LEAVE_TYPE(P),         코드·항목 필수 /        사용중 코드
               관리                 생성·삭제·사용여부   권한      / UC26 /     SET_LEAVE_TYPE_NEW(L)      근무시간 124 검증     삭제 제한
                                    관리                           UC27                                                            

  SC-ADM-002   부서 권한    Admin   직원별 부서          Admin     UC28 → UC29  SET_DEPT_AUTH(P),          부서 + 직원 권한 구조   존재하지
               관리                 접근·검토 권한 관리  권한      → UC30       SET_DEPT_AUTH_EXCLUDE(L)                           않는 직원:
                                                                                                                                   404

  SC-ADM-003   집계 대상    Admin   직원 집계 대상       Admin     UC31 → UC32  SET_AGG_TARGET(P)          직원 검색 기능 / 계산   권한 없음
               관리                 포함·제외 관리       권한                                              제외 설정               

  SC-ADM-004   휴무일정     Admin   공휴일 및 특별근태   Admin     UC37  UC44 SET_HOLIDAY(P),            연도별 조회 / 인라인    시간 형식
               관리                 관리                 권한                   SET_HOLIDAY_NEW(L)         수정                    오류

  SC-ADM-005   파일 업로드  Admin   근태 데이터 파일     Admin     UC13 → UC14  ATT_FILE_UPLOAD(L),        파일관리 탭 사용 / 파일 잘못된 형식:
               및 반영              업로드 및 반영       권한      → UC18       ATT_FILE_LIST(L),          형식 검증 / 반영 시     업로드 실패
                                                                                ATT_FILE_APPLY(L)          직원·부서 범위 선택 /   / 파싱 오류:
                                                                                                           반영 후 타임라인 추가   에러 메시지
                                                                                                                                   / 트랜잭션
                                                                                                                                   실패: 롤백

  SC-ADM-006   파일         Admin   업로드 파일 반영     Admin     UC14 → UC15  ATT_FILE_LIST(L),          파일 선택 시 상세       권한 없음:
               타임라인             히스토리 조회        권한,     → UC19       ATT_FILE_DTL(L)            정보·orgData·타임라인   접근 거부 /
               조회                                      UC14 완료                                         표시 / 특정 시점 선택   존재하지
                                                                                                           시 보기 모드 전환       않는 파일:
                                                                                                                                   404

  SC-ADM-007   근태 기록    Admin   연월/부서별 근태     Admin     UC1 → UC2 →  ATT_MAIN(P)                연월 선택 시 자동 조회  권한 없음:
               조회                 기록 조회            권한      UC3                                     / 부서 선택 시 데이터   403 / 데이터
                                                                                                           표시 / 편집·보기 모드   없음: Empty
                                                                                                           전환 가능               State

  SC-ADM-008   근태 이슈    Admin   이슈 조회 및         Admin     UC21 → UC22  ATT_ISSUE_LIST(P),         헤더 검토사항 버튼 진입 존재하지
               관리                 수정요청 전송·반영   권한,     → UC23       ATT_ISSUE_CONFIRM(L)       / 부서 필터 / 미처리    않는 이슈:
                                                         UC1·UC2                                           배지 / 수정요청 알림    404 / 알림
                                                         완료                                              발송                    실패: 재시도
                                                                                                                                   / 트랜잭션
                                                                                                                                   실패: 롤백

  SC-ADM-009   근태 기록    Admin   특정 직원 근태 기록  Admin     UC3 → UC4 →  ATT_MAIN(P),               출입시간·유형·비고 수정 필수값 누락:
               수정                 수정                 권한,     UC5          ATT_REC_DTL(L),            / 셀 클릭 시 수정 모달  저장 불가 /
                                                         편집 모드              ATT_REC_EDIT(L)            / 변경 이력 기록        보기 모드:
                                                                                                                                   수정 불가 /
                                                                                                                                   트랜잭션
                                                                                                                                   실패

  SC-ADM-010   월별 비고    Admin   월별 비고 조회 및    Admin     UC3 → UC6 →  ATT_MAIN(P),               편집 모드에서만 수정    권한 없음:
               관리                 수정                 권한,     UC7          ATT_REMARKS(L)             가능 / 보기 모드 읽기   접근 거부 /
                                                         편집 모드                                         전용                    편집 모드
                                                                                                                                   비활성화

  SC-ADM-011   수정 내역    Admin   근태 기록 수정 이력  Admin     UC1 → UC20   ATT_HIST_LIST(L)           하단 패널 수정내역 탭 / 권한 없음 /
               조회                 조회                 권한, UC1                                         셀 클릭 시 수정 이력    데이터 없음
                                                         완료                                              표시 / 필터 제공        

  SC-ADM-012   스냅샷 저장  Admin   현재 근태 데이터를   Admin     UC3 → UC10   ATT_MAIN(P),               설명 필수 / 전체 데이터 설명 누락 /
                                    스냅샷 저장          권한                   ATT_SNAP_NEW(L)            저장 / 트랜잭션 처리    트랜잭션
                                                                                                                                   실패

  SC-ADM-013   스냅샷       Admin   저장된 스냅샷 조회   Admin     UC8 → UC9 →  ATT_SNAP_LIST(L)           보기 모드 전환 / 롤백   존재하지
               불러오기 및          및 롤백              권한      UC11 / UC12                             시 현재 시점 기준점     않는 스냅샷:
               롤백                                                                                        설정                    404

  SC-ADM-014   스냅샷 결재  Admin   스냅샷 결재 시스템   Admin     UC8 → UC10 → ATT_SNAP_LIST(L),          검토권한자 선택 필수 /  검토권한자
               상신                 상신                 권한      UC33 → UC34  ATT_APPROVAL_REVIEWER(L)   결재 시스템 연동        미선택 /
                                                                                                                                   연동 실패

  SC-ADM-015   스냅샷 결재  Admin   상신된 스냅샷 결재   Admin     UC35 → UC36  ATT_APPROVAL_UPDATE(L)     결재 문서               존재하지
               조회                 상태 조회            권한                                              ID·일시·결재자 표시     않는 결재:
                                                                                                                                   404

  SC-ADM-016   파일 삭제    Admin   업로드 파일 삭제     Admin     UC14 → UC17  ATT_FILE_LIST(L),          삭제 확인 팝업 / 복구   존재하지
                                                         권한                   ATT_FILE_DEL(L)            불가                    않는 파일

  SC-ADM-017   근태         Admin   부서별 근태 통계     Admin     UC45  UC50 DASH_MAIN(P),              차트 및 리스트 표시     데이터 없음
               대시보드             조회                 권한                   DASH_EMP_DTL(L)  
               조회                                                                                                                

  SC-ADM-018   시수 통계    Admin   직원·프로젝트 시수   Admin     UC64 → UC68  MY_STAT(P),                Admin만 탭 표시 / 모드  권한 없음
               조회                 통계 조회            권한       UC74      MY_STAT_FILTER(L)          전환                    

  SC-ADM-019   프로젝트     Admin   직원 프로젝트 할당   Admin     UC65 → UC75  MY_SET(P),                 임시 저장 후 최종 저장  존재하지
               할당 관리            관리                 권한       UC80      MY_PROJ_ASSIGN(L)          시 반영                 않는
                                                                                                                                   프로젝트

  SC-ADM-020   근무 모드    Admin   근무 모드 변경 및    Admin     UC81 → UC82  MY_SET(P), MY_WORK_MODE(L) 적용 시작일 필수        시작일
               관리                 히스토리 조회        권한                                                                      미설정

  SC-ADM-021   저장 전 확인 Admin   편집 중 미저장       Admin     UC83         ATT_SAVE_CONFIRM(L)        저장/저장안함/취소 선택 없음
               처리                 변경사항 확인        권한                                                                      

  SC-ADM-022   근태 조회    Admin   팝업으로 근태 조회   Admin     UC84 → UC85  VIEW_MAIN(P), DEMO_MAIN(P) 읽기 전용 / URL         파라미터
               팝업 실행                                 권한                                              파라미터 기반 조회      누락

  SC-USR-001   시수 입력    User    월별 시수 캘린더 및  User 권한 UC51  UC58 MY_MAIN(P), MY_DAY_DTL(L)  시간 중복 및 8시간 검증 시간 중복
                                    블록 관리                                                                                      

  SC-USR-002   내보고서     User    특정 연월 내보고서   User 권한 UC51 → UC59  MY_MAIN(P), MY_REPORT(L)   보고서 존재 여부 확인   보고서 없음
               조회                 조회                           → UC60                                                          

  SC-USR-003   수정요청     User    수정요청 응답 제출   User 권한 UC51 → UC61  MY_REVISION_LIST(L),       댓글 입력 후 제출       댓글 누락
           응답                                                 UC63      MY_REVISION_RESP(L)                                

---

