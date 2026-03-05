/**
 * 52100 단위 테스트: DomainWageCalculationTypeService (공개 메서드별 검증)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DomainWageCalculationTypeService } from '../../../../../src/domain/wage-calculation-type/wage-calculation-type.service';
import { WageCalculationType } from '../../../../../src/domain/wage-calculation-type/wage-calculation-type.entity';
import { CalculationType } from '../../../../../src/domain/wage-calculation-type/wage-calculation-type.types';

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
};

describe('DomainWageCalculationTypeService', () => {
    let service: DomainWageCalculationTypeService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainWageCalculationTypeService,
                { provide: getRepositoryToken(WageCalculationType), useValue: mockRepository },
            ],
        }).compile();
        service = module.get<DomainWageCalculationTypeService>(DomainWageCalculationTypeService);
    });

    describe('생성한다', () => {
        it('기존 적용 중 없으면 저장 후 DTO 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const saved = { id: 'wct-1', DTO변환한다: () => ({ id: 'wct-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성한다(
                { calculationType: CalculationType.REGULAR_WAGE, startDate: '2025-01-01' },
                'user-1',
            );
            expect(result).toBeDefined();
            expect(result.id).toBe('wct-1');
        });
        it('기존 적용 중 있으면 비활성화 후 새로 저장', async () => {
            const existingActive = {
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
            };
            mockRepository.findOne.mockResolvedValue(existingActive);
            const saved = { id: 'wct-1', DTO변환한다: () => ({ id: 'wct-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성한다(
                { calculationType: CalculationType.REGULAR_WAGE, startDate: '2025-01-01' },
                'user-1',
            );
            expect(result).toBeDefined();
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/임금 계산 유형을 찾을 수 없습니다/);
        });
        it('유효한 id 시 DTO 반환', async () => {
            const entity = { id: 'uuid-1', DTO변환한다: () => ({ id: 'uuid-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.ID로조회한다('uuid-1');
            expect(result).toBeDefined();
            expect(result.id).toBe('uuid-1');
        });
    });

    describe('날짜로조회한다', () => {
        it('없으면 null 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const result = await service.날짜로조회한다('2025-03-01');
            expect(result).toBeNull();
        });
        it('있으면 DTO 반환', async () => {
            const entity = { id: 'wct-1', DTO변환한다: () => ({ id: 'wct-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.날짜로조회한다('2025-03-01');
            expect(result).toBeDefined();
        });
    });

    describe('현재적용중조회한다', () => {
        it('없으면 null 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const result = await service.현재적용중조회한다();
            expect(result).toBeNull();
        });
        it('있으면 DTO 반환', async () => {
            const entity = { id: 'wct-1', DTO변환한다: () => ({ id: 'wct-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.현재적용중조회한다();
            expect(result).toBeDefined();
        });
    });

    describe('기간범위로조회한다', () => {
        it('find 후 필터링하여 배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.기간범위로조회한다('2025-01-01', '2025-12-31');
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.목록조회한다();
            expect(result).toEqual([]);
        });
    });

    describe('수정한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.수정한다('00000000-0000-0000-0000-000000000000', { startDate: '2025-02-01' }, 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('유효한 id 시 저장 후 DTO 반환', async () => {
            const existing = {
                is_currently_applied: false,
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'wct-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.수정한다('wct-1', { startDate: '2025-02-01' }, 'user-1');
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
            await service.삭제한다('wct-1', 'user-1');
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
            const existing = { id: 'wct-1' };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.remove.mockResolvedValue(undefined);
            await service.완전삭제한다('wct-1', 'user-1');
            expect(mockRepository.remove).toHaveBeenCalledWith(existing);
        });
    });
});
