/**
 * 52100 단위 테스트: DomainHolidayInfoService (공개 메서드별 검증)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DomainHolidayInfoService } from '../../../../../src/domain/holiday-info/holiday-info.service';
import { HolidayInfo } from '../../../../../src/domain/holiday-info/holiday-info.entity';

const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
};

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

describe('DomainHolidayInfoService', () => {
    let service: DomainHolidayInfoService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainHolidayInfoService,
                { provide: getRepositoryToken(HolidayInfo), useValue: mockRepository },
            ],
        }).compile();
        service = module.get<DomainHolidayInfoService>(DomainHolidayInfoService);
    });

    describe('생성한다', () => {
        it('저장 후 DTO 반환', async () => {
            const saved = { id: 'h-1', DTO변환한다: () => ({ id: 'h-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성한다({ holidayName: '설날', holidayDate: '2025-01-01' });
            expect(result).toBeDefined();
            expect(result.id).toBe('h-1');
        });
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/휴일 정보를 찾을 수 없습니다/);
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
        it('해당 날짜 없으면 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.날짜로조회한다('2025-12-25')).rejects.toThrow(NotFoundException);
            await expect(service.날짜로조회한다('2025-12-25')).rejects.toThrow(/휴일 정보를 찾을 수 없습니다/);
        });
        it('있으면 DTO 반환', async () => {
            const entity = { id: 'h-1', DTO변환한다: () => ({ id: 'h-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.날짜로조회한다('2025-12-25');
            expect(result).toBeDefined();
        });
    });

    describe('목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.목록조회한다();
            expect(result).toEqual([]);
        });
    });

    describe('연도별공휴일일괄삭제한다', () => {
        it('해당 연도 데이터 없으면 remove 미호출', async () => {
            mockRepository.find.mockResolvedValue([]);
            await service.연도별공휴일일괄삭제한다('2025');
            expect(mockRepository.remove).not.toHaveBeenCalled();
        });
        it('데이터 있으면 remove 호출', async () => {
            mockRepository.find.mockResolvedValue([{ id: 'h-1' }]);
            mockRepository.remove.mockResolvedValue(undefined);
            await service.연도별공휴일일괄삭제한다('2025');
            expect(mockRepository.remove).toHaveBeenCalled();
        });
    });

    describe('연도별목록조회한다', () => {
        it('배열 반환', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);
            const result = await service.연도별목록조회한다('2025');
            expect(result).toEqual([]);
        });
    });

    describe('수정한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.수정한다('00000000-0000-0000-0000-000000000000', { holidayName: '수정' }, 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('유효한 id 시 저장 후 DTO 반환', async () => {
            const existing = {
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'h-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.수정한다('h-1', { holidayName: '수정명' }, 'user-1');
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
            await service.삭제한다('h-1', 'user-1');
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
            const existing = { id: 'h-1' };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.remove.mockResolvedValue(undefined);
            await service.완전삭제한다('h-1', 'user-1');
            expect(mockRepository.remove).toHaveBeenCalledWith(existing);
        });
    });
});
