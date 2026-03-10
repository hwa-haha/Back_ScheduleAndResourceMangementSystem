/**
 * 52100 단위 테스트: DomainUsedAttendanceService (공개 메서드별 검증)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DomainUsedAttendanceService } from '../../../../../src/domain/used-attendance/used-attendance.service';
import { UsedAttendance } from '../../../../../src/domain/used-attendance/used-attendance.entity';

const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
};

const mockDataSource = {
    manager: {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
    },
};

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

describe('DomainUsedAttendanceService', () => {
    let service: DomainUsedAttendanceService;
    const empId = '550e8400-e29b-41d4-a716-446655440000';
    const typeId = '550e8400-e29b-41d4-a716-446655440001';

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainUsedAttendanceService,
                { provide: getRepositoryToken(UsedAttendance), useValue: mockRepository },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();
        service = module.get<DomainUsedAttendanceService>(DomainUsedAttendanceService);
    });

    describe('생성한다', () => {
        it('동일 직원·날짜·유형 있으면 ConflictException', async () => {
            mockRepository.findOne.mockResolvedValue({ id: 'existing' });
            await expect(
                service.생성한다({
                    employeeId: empId,
                    usedAt: '2025-03-01',
                    attendanceTypeId: typeId,
                }),
            ).rejects.toThrow(ConflictException);
            await expect(
                service.생성한다({
                    employeeId: empId,
                    usedAt: '2025-03-01',
                    attendanceTypeId: typeId,
                }),
            ).rejects.toThrow(/이미 해당 날짜에 사용된 근태가 존재합니다/);
        });
        it('중복 없으면 저장 후 DTO 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const saved = { id: 'ua-1', DTO변환한다: () => ({ id: 'ua-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성한다({
                employeeId: empId,
                usedAt: '2025-03-01',
                attendanceTypeId: typeId,
            });
            expect(result).toBeDefined();
            expect(result.id).toBe('ua-1');
        });
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/사용된 근태를 찾을 수 없습니다/);
        });
        it('유효한 id 시 DTO 반환', async () => {
            const entity = { id: 'uuid-1', DTO변환한다: () => ({ id: 'uuid-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.ID로조회한다('uuid-1');
            expect(result).toBeDefined();
            expect(result.id).toBe('uuid-1');
        });
    });

    describe('목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.목록조회한다();
            expect(result).toEqual([]);
        });
    });

    describe('직원ID목록과날짜범위로조회한다', () => {
        it('dataSource.manager.createQueryBuilder로 조회 후 배열 반환', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);
            const result = await service.직원ID목록과날짜범위로조회한다([empId], '2025-03-01', '2025-03-31');
            expect(result).toEqual([]);
            expect(mockDataSource.manager.createQueryBuilder).toHaveBeenCalled();
        });
    });

    describe('직원ID와날짜범위로조회한다', () => {
        it('dataSource.manager.createQueryBuilder로 조회 후 배열 반환', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);
            const result = await service.직원ID와날짜범위로조회한다(empId, '2025-03-01', '2025-03-31');
            expect(result).toEqual([]);
        });
    });

    describe('수정한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.수정한다('00000000-0000-0000-0000-000000000000', {}, 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('유효한 id 시 저장 후 DTO 반환', async () => {
            const existing = {
                id: 'ua-1',
                employee_id: empId,
                used_at: '2025-03-01',
                attendance_type_id: typeId,
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'ua-1' }),
            };
            mockRepository.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(null);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.수정한다('ua-1', { usedAt: '2025-03-02' }, 'user-1');
            expect(result).toBeDefined();
            expect(existing.업데이트한다).toHaveBeenCalled();
        });
    });

    describe('삭제한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.삭제한다('00000000-0000-0000-0000-000000000000', 'user-1')).rejects.toThrow(
                NotFoundException,
            );
        });
        it('유효한 id 시 save 호출', async () => {
            const existing = { deleted_at: null, 수정자설정한다: jest.fn(), 메타데이터업데이트한다: jest.fn() };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(undefined);
            await service.삭제한다('ua-1', 'user-1');
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });

    describe('완전삭제한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.완전삭제한다('00000000-0000-0000-0000-000000000000', 'user-1')).rejects.toThrow(
                NotFoundException,
            );
        });
        it('유효한 id 시 remove 호출', async () => {
            const existing = { id: 'ua-1' };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.remove.mockResolvedValue(undefined);
            await service.완전삭제한다('ua-1', 'user-1');
            expect(mockRepository.remove).toHaveBeenCalledWith(existing);
        });
    });

    describe('날짜범위로조회한다', () => {
        it('repository.createQueryBuilder로 조회 후 배열 반환', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);
            const result = await service.날짜범위로조회한다('2025-03-01', '2025-03-31');
            expect(Array.isArray(result)).toBe(true);
            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('ua');
        });
    });
});
