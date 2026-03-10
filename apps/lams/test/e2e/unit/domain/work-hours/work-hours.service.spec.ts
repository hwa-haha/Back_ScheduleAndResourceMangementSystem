/**
 * 52100 단위 테스트: DomainWorkHoursService (공개 메서드별 검증)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DomainWorkHoursService } from '../../../../../src/domain/work-hours/work-hours.service';
import { WorkHours } from '../../../../../src/domain/work-hours/work-hours.entity';

const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn(),
};

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

describe('DomainWorkHoursService', () => {
    let service: DomainWorkHoursService;
    const apId = '550e8400-e29b-41d4-a716-446655440000';

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainWorkHoursService,
                { provide: getRepositoryToken(WorkHours), useValue: mockRepository },
            ],
        }).compile();
        service = module.get<DomainWorkHoursService>(DomainWorkHoursService);
    });

    describe('생성한다', () => {
        it('저장 후 DTO 반환', async () => {
            const saved = { id: 'wh-1', DTO변환한다: () => ({ id: 'wh-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성한다({
                assignedProjectId: apId,
                date: '2025-03-01',
                workMinutes: 60,
            });
            expect(result).toBeDefined();
            expect(result.id).toBe('wh-1');
        });
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/시수를 찾을 수 없습니다/);
        });
        it('유효한 id 시 DTO 반환', async () => {
            const entity = { id: 'uuid-1', DTO변환한다: () => ({ id: 'uuid-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.ID로조회한다('uuid-1');
            expect(result).toBeDefined();
            expect(result.id).toBe('uuid-1');
        });
    });

    describe('할당된프로젝트ID로조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.할당된프로젝트ID로조회한다(apId);
            expect(result).toEqual([]);
        });
    });

    describe('날짜범위로조회한다', () => {
        it('QueryBuilder로 조회 후 배열 반환', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);
            const result = await service.날짜범위로조회한다(apId, '2025-03-01', '2025-03-31');
            expect(result).toEqual([]);
        });
    });

    describe('날짜로조회한다', () => {
        it('없으면 null 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const result = await service.날짜로조회한다(apId, '2025-03-01');
            expect(result).toBeNull();
        });
        it('있으면 DTO 반환', async () => {
            const entity = { id: 'wh-1', DTO변환한다: () => ({ id: 'wh-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.날짜로조회한다(apId, '2025-03-01');
            expect(result).toBeDefined();
        });
    });

    describe('연도별합계조회한다', () => {
        it('getRawOne으로 합계 반환', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue({ total: 120 });
            const result = await service.연도별합계조회한다(apId, '2025');
            expect(result).toBe(120);
        });
        it('결과 없으면 0 반환', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue(null);
            const result = await service.연도별합계조회한다(apId, '2025');
            expect(result).toBe(0);
        });
    });

    describe('월별합계조회한다', () => {
        it('getRawOne으로 합계 반환', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue({ total: 60 });
            const result = await service.월별합계조회한다(apId, '2025', '03');
            expect(result).toBe(60);
        });
    });

    describe('월별직원별시수합계조회한다', () => {
        it('employeeIds 비어 있으면 빈 배열', async () => {
            const result = await service.월별직원별시수합계조회한다([], '2025-03-01', '2025-03-31');
            expect(result).toEqual([]);
        });
        it('getRawMany로 배열 반환', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([{ employeeId: 'e1', totalMinutes: '120' }]);
            const result = await service.월별직원별시수합계조회한다([apId], '2025-03-01', '2025-03-31');
            expect(result).toHaveLength(1);
            expect(result[0].totalMinutes).toBe(120);
        });
    });

    describe('월별직원별일별시수합계조회한다', () => {
        it('employeeIds 비어 있으면 빈 배열', async () => {
            const result = await service.월별직원별일별시수합계조회한다([], '2025-03-01', '2025-03-31');
            expect(result).toEqual([]);
        });
        it('getRawMany로 배열 반환', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([]);
            const result = await service.월별직원별일별시수합계조회한다([apId], '2025-03-01', '2025-03-31');
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('월별프로젝트별일별시수합계조회한다', () => {
        it('getRawMany로 배열 반환', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([]);
            const result = await service.월별프로젝트별일별시수합계조회한다('2025-03-01', '2025-03-31');
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('생성또는수정한다', () => {
        it('기존 없으면 생성 후 DTO 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const saved = { id: 'wh-1', DTO변환한다: () => ({ id: 'wh-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성또는수정한다(
                { assignedProjectId: apId, date: '2025-03-01', workMinutes: 60 },
                'user-1',
            );
            expect(result).toBeDefined();
        });
        it('기존 있으면 수정 후 DTO 반환', async () => {
            const existing = {
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'wh-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.생성또는수정한다(
                { assignedProjectId: apId, date: '2025-03-01', workMinutes: 90 },
                'user-1',
            );
            expect(result).toBeDefined();
            expect(existing.업데이트한다).toHaveBeenCalled();
        });
    });

    describe('연도별일괄생성한다', () => {
        it('save 호출 후 배열 반환', async () => {
            mockRepository.save.mockResolvedValue([{ id: 'wh-1', DTO변환한다: () => ({ id: 'wh-1' }) }]);
            const result = await service.연도별일괄생성한다(apId, '2025');
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('수정한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.수정한다('00000000-0000-0000-0000-000000000000', { workMinutes: 90 }, 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('유효한 id 시 저장 후 DTO 반환', async () => {
            const existing = {
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'wh-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.수정한다('wh-1', { workMinutes: 90 }, 'user-1');
            expect(result).toBeDefined();
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
            await service.삭제한다('wh-1', 'user-1');
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
            const existing = { id: 'wh-1' };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.remove.mockResolvedValue(undefined);
            await service.완전삭제한다('wh-1', 'user-1');
            expect(mockRepository.remove).toHaveBeenCalledWith(existing);
        });
    });
});
