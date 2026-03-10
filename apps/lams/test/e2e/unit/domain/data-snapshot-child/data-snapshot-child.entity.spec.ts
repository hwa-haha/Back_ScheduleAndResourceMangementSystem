/**
 * 52100 단위 테스트: DataSnapshotChild 엔티티 유효성 (문서 6 예시 2 반영)
 * - 부모데이터로부터생성한다: 필수값(직원명·직원번호·연도·월) 없으면 BadRequestException
 * - 유효한 부모데이터로 생성 시 인스턴스 반환
 */
import { BadRequestException } from '@nestjs/common';
import { DataSnapshotChild } from '../../../../../src/domain/data-snapshot-child/data-snapshot-child.entity';

describe('DataSnapshotChild 유효성', () => {
    it('필수값(직원명) 공백만 있으면 BadRequestException', () => {
        expect(() =>
            DataSnapshotChild.부모데이터로부터생성한다([
                {
                    employeeId: '550e8400-e29b-41d4-a716-446655440000',
                    employeeName: '   ',
                    employeeNumber: '10001',
                    yyyymm: '2025-03',
                },
            ]),
        ).toThrow(BadRequestException);
        expect(() =>
            DataSnapshotChild.부모데이터로부터생성한다([
                {
                    employeeId: '550e8400-e29b-41d4-a716-446655440000',
                    employeeName: '   ',
                    employeeNumber: '10001',
                    yyyymm: '2025-03',
                },
            ]),
        ).toThrow(/직원명은 필수입니다/);
    });

    it('필수값(직원번호) 공백만 있으면 BadRequestException', () => {
        expect(() =>
            DataSnapshotChild.부모데이터로부터생성한다([
                {
                    employeeId: '550e8400-e29b-41d4-a716-446655440000',
                    employeeName: '홍길동',
                    employeeNumber: '   ',
                    yyyymm: '2025-03',
                },
            ]),
        ).toThrow(BadRequestException);
        expect(() =>
            DataSnapshotChild.부모데이터로부터생성한다([
                {
                    employeeId: '550e8400-e29b-41d4-a716-446655440000',
                    employeeName: '홍길동',
                    employeeNumber: '   ',
                    yyyymm: '2025-03',
                },
            ]),
        ).toThrow(/직원번호는 필수입니다/);
    });

    it('유효한 부모데이터로 생성 시 인스턴스 반환', () => {
        const valid = DataSnapshotChild.부모데이터로부터생성한다([
            {
                employeeId: '550e8400-e29b-41d4-a716-446655440000',
                employeeName: '홍길동',
                employeeNumber: '10001',
                yyyymm: '2025-03',
            },
        ]);
        expect(valid.length).toBeGreaterThan(0);
        expect(valid[0]).toBeInstanceOf(DataSnapshotChild);
        expect(valid[0].employee_name).toBe('홍길동');
        expect(valid[0].employee_number).toBe('10001');
        expect(valid[0].yyyy).toBe('2025');
        expect(valid[0].mm).toBe('03');
    });
});
