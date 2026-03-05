테스트 시나리오 상세(비교 기준 포함)

## 시나리오 1-2 비교. 출입내역 반영 전/후 근태신청 반영 비교

- 기능 매칭:
    - 출입내역 파일 업로드 → 파일 반영 → 일간요약/월간요약 생성
    - 근태신청 파일 업로드 → 파일 반영 → 일간요약/월간요약 재계산
- 사용 API:
    - POST /file-management/upload
    - POST /file-management/reflect
    - GET /file-management/files
    - GET /attendance-data/monthly-summaries
- 호출 순서:
    - 출입내역 반영(A): upload → reflect → monthly-summaries
    - 근태신청 반영(B): upload → reflect → monthly-summaries
- 비교 대상(응답 경로 기준):
    - A/B 월간요약: `monthlySummaries[].dailySummaries[].usedAttendances` 개수
    - A/B 월간요약: `monthlySummaries[].dailySummaries[].enter/leave` 또는 근무시간 변화
- 비교 포인트:
    - A(출입내역만 반영) 대비 B(근태신청 반영)에서 비정상 처리 근태/usedAttendances 변화 유무 확인

## 시나리오 3. 일간요약 수정 - 변경이력 저장 - 월간요약 반영

- 기능 매칭:
    - 일간요약 수정 → 변경이력 저장 → 월간요약 재반영
- 사용 API:
    - PATCH /attendance-data/daily-summaries/:id
    - GET /attendance-data/monthly-summaries
- 호출 순서:
    - daily-summaries 수정 → monthly-summaries 조회
- 비교 대상(응답 경로 기준):
    - 수정 전/후: `monthlySummaries[].dailySummaries[].enter/leave`
    - 변경이력: `monthlySummaries[].dailySummaries[].history.length`
- 비교 포인트:
    - 수정 전/후 값 차이 확인, 변경이력 증가 여부 확인

## 시나리오 4. 근태 이슈 처리 - 일간요약 수정 - 이슈 상태 변경

- 기능 매칭:
    - 근태 이슈 보정 입력 → 반영 → 이슈 상태 변경
- 사용 API:
    - PATCH /attendance-issues/:id/correction
    - PATCH /attendance-issues/:id/apply
    - GET /attendance-issues/:id
- 호출 순서:
    - correction → apply → issue 조회
- 비교 대상(응답 경로 기준):
    - 보정값: `correctedEnterTime`, `correctedLeaveTime`
    - 상태값: `status` (APPLIED)
- 비교 포인트:
    - 보정값 반영 여부, 상태 변경 여부 확인

## 시나리오 5. 월간요약 확정 - 스냅샷 저장

- 기능 매칭:
    - 월간요약 조회 → 스냅샷 저장
- 사용 API:
    - GET /attendance-data/monthly-summaries
    - POST /attendance-data/snapshots
    - GET /attendance-data/snapshots
- 호출 순서:
    - monthly-summaries 조회 → snapshots 저장 → snapshots 조회
- 비교 대상(응답 경로 기준):
    - 스냅샷 목록: `snapshots.length` 또는 `snapshots[].id`
- 비교 포인트:
    - 저장 전/후 스냅샷 개수 증가 또는 신규 ID 존재 여부 확인



## 시나리오 6. 스냅샷 복원 - 요약 재구성

- 기능 매칭:
    - 스냅샷 복원 → 일간/월간요약 재구성
- 사용 API:
    - GET /attendance-data/snapshots
    - POST /attendance-data/snapshots/restore
    - GET /attendance-data/monthly-summaries
- 호출 순서:
    - snapshots 조회 → snapshots/restore → monthly-summaries 조회
- 비교 대상(응답 경로 기준):
    - 복원 전/후: `monthlySummaries[].dailySummaries` 구성/개수
- 비교 포인트:
    - 복원 전후 데이터 차이 또는 스냅샷 기준 일치 여부 확인

## 시나리오 7. 파일 반영 이력 복원 - 요약 재생성

- 기능 매칭:
    - 파일 반영 이력 복원 → 일간/월간요약 재생성
- 사용 API:
    - GET /file-management/files
    - POST /file-management/restore-from-history
    - GET /attendance-data/monthly-summaries
- 호출 순서:
    - files 조회 → restore-from-history → monthly-summaries 조회
- 비교 대상(응답 경로 기준):
    - 복원 전/후: `monthlySummaries[].dailySummaries` 구성/개수
    - 파일 이력: `files[].reflectionHistories[].id`
- 비교 포인트:
    - 복원 대상 이력 기준으로 요약 데이터가 일관되게 재생성되었는지 확인

## 시나리오 8. 출입내역 수정본 반영 - 기존 내용과 변경점 비교

- 기능 매칭:
    - 수정본 출입내역 업로드 → 반영 → 기존 요약과 변경점 비교
- 사용 파일:
    - `storage/local-files/출입내역_수정본.xlsx`
- 사용 API:
    - POST /file-management/upload
    - POST /file-management/reflect
    - GET /attendance-data/monthly-summaries
- 호출 순서:
    - monthly-summaries(반영 전) → upload → reflect → monthly-summaries(반영 후)
- 비교 대상(응답 경로 기준):
    - 반영 전/후: `monthlySummaries[].dailySummaries[].enter/leave`
    - 반영 전/후: `monthlySummaries[].dailySummaries[].usedAttendances`
- 비교 포인트:
    - 수정본 반영으로 인해 바뀐 일자/직원에 대해 enter/leave 또는 usedAttendances가 변경되었는지 확인
