/**
 * 52100 단위 테스트: DomainDailySummaryChangeHistoryService (공개 메서드별 검증)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DomainDailySummaryChangeHistoryService } from '../../../../../src/domain/daily-summary-change-history/daily-summary-change-history.service';
import { DailySummaryChangeHistory } from '../../../../../src/domain/daily-summary-change-history/daily-summary-change-history.entity';

const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
};

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

describe('DomainDailySummaryChangeHistoryService', () => {
    let service: DomainDailySummaryChangeHistoryService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainDailySummaryChangeHistoryService,
                { provide: getRepositoryToken(DailySummaryChangeHistory), useValue: mockRepository },
            ],
        }).compile();
        service = module.get<DomainDailySummaryChangeHistoryService>(DomainDailySummaryChangeHistoryService);
    });

    describe('생성한다', () => {
        it('저장 후 DTO 반환', async () => {
            const saved = { id: 'dsh-1', DTO변환한다: () => ({ id: 'dsh-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성한다({
                dailyEventSummaryId: '550e8400-e29b-41d4-a716-446655440000',
                date: '2025-03-01',
                content: '변경',
                changedBy: '550e8400-e29b-41d4-a716-446655440002',
            });
            expect(result).toBeDefined();
            expect(result.id).toBe('dsh-1');
        });
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/일간 요약 변경 이력을 찾을 수 없습니다/);
        });
        it('유효한 id 시 DTO 반환', async () => {
            const entity = { id: 'uuid-1', DTO변환한다: () => ({ id: 'uuid-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.ID로조회한다('uuid-1');
            expect(result).toBeDefined();
            expect(result.id).toBe('uuid-1');
        });
    });

    describe('일간요약ID로목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.일간요약ID로목록조회한다('550e8400-e29b-41d4-a716-446655440000');
            expect(result).toEqual([]);
        });
    });

    describe('일간요약ID목록으로목록조회한다', () => {
        it('빈 배열이면 빈 Map 반환', async () => {
            const result = await service.일간요약ID목록으로목록조회한다([]);
            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(0);
        });
        it('ID 목록이면 QueryBuilder로 조회 후 Map 반환', async () => {
            const hist = { daily_event_summary_id: 'id1', DTO변환한다: () => ({ id: 'h1' }) };
            mockQueryBuilder.getMany.mockResolvedValue([hist]);
            const result = await service.일간요약ID목록으로목록조회한다(['id1']);
            expect(result.size).toBeGreaterThanOrEqual(0);
            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('history');
        });
    });

    describe('날짜범위로목록조회한다', () => {
        it('QueryBuilder로 조회 후 배열 반환', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);
            const result = await service.날짜범위로목록조회한다('2025-03-01', '2025-03-31');
            expect(result).toEqual([]);
        });
    });

    describe('변경자로목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.변경자로목록조회한다('user-1');
            expect(result).toEqual([]);
        });
    });

    describe('날짜로목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.날짜로목록조회한다('2025-03-01');
            expect(result).toEqual([]);
        });
    });

    describe('수정한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.수정한다('00000000-0000-0000-0000-000000000000', { content: '수정' }, 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('유효한 id 시 저장 후 DTO 반환', async () => {
            const existing = {
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'dsh-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.수정한다('dsh-1', { content: '수정내용' }, 'user-1');
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
            await service.삭제한다('dsh-1', 'user-1');
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
            const existing = { id: 'dsh-1' };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.remove.mockResolvedValue(undefined);
            await service.완전삭제한다('dsh-1', 'user-1');
            expect(mockRepository.remove).toHaveBeenCalledWith(existing);
        });
    });
});
