/**
 * 52100 단위 테스트: AttendanceIssue 엔티티 유효성 (문서 2.1 반영)
 * - 업데이트한다: 필드 길이·형식 검증 시 BadRequestException
 */
import { BadRequestException } from '@nestjs/common';
import { AttendanceIssue } from '../../../../../src/domain/attendance-issue/attendance-issue.entity';
import { AttendanceIssueStatus } from '../../../../../src/domain/attendance-issue/attendance-issue.types';

describe('AttendanceIssue 유효성', () => {
    const validIds = {
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        dailySummaryId: '550e8400-e29b-41d4-a716-446655440001',
    };

    it('업데이트한다 시 문제가 된 출근 시간 50자 초과하면 BadRequestException', () => {
        const issue = new AttendanceIssue(
            validIds.employeeId,
            '2025-03-01',
            validIds.dailySummaryId,
            '09:00',
            '18:00',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        );
        expect(() => issue.업데이트한다('a'.repeat(51))).toThrow(BadRequestException);
        expect(() => issue.업데이트한다('a'.repeat(51))).toThrow(/문제가 된 출근 시간은 50자 이하여야 합니다/);
    });

    it('업데이트한다 시 유효한 길이면 예외 없음', () => {
        const issue = new AttendanceIssue(
            validIds.employeeId,
            '2025-03-01',
            validIds.dailySummaryId,
            '09:00',
            '18:00',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        );
        expect(() => issue.업데이트한다('09:00:00', '18:00:00')).not.toThrow();
    });
});
