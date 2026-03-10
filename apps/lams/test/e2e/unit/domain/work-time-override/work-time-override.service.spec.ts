/**
 * 52100 단위 테스트: DomainWorkTimeOverrideService (공개 메서드별 검증)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DomainWorkTimeOverrideService } from '../../../../../src/domain/work-time-override/work-time-override.service';
import { WorkTimeOverride } from '../../../../../src/domain/work-time-override/work-time-override.entity';

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
};

describe('DomainWorkTimeOverrideService', () => {
    let service: DomainWorkTimeOverrideService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainWorkTimeOverrideService,
                { provide: getRepositoryToken(WorkTimeOverride), useValue: mockRepository },
            ],
        }).compile();
        service = module.get<DomainWorkTimeOverrideService>(DomainWorkTimeOverrideService);
    });

    describe('생성한다', () => {
        it('저장 후 DTO 반환', async () => {
            const saved = { id: 'wto-1', DTO변환한다: () => ({ id: 'wto-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성한다(
                { date: '2025-03-01', startWorkTime: '09:00:00', endWorkTime: '18:00:00', reason: '사유' },
                'user-1',
            );
            expect(result).toBeDefined();
            expect(result.id).toBe('wto-1');
        });
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/근무시간 커스터마이징을 찾을 수 없습니다/);
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
            const entity = { id: 'wto-1', DTO변환한다: () => ({ id: 'wto-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.날짜로조회한다('2025-03-01');
            expect(result).toBeDefined();
        });
    });

    describe('날짜목록으로조회한다', () => {
        it('빈 배열이면 빈 Map 반환', async () => {
            const result = await service.날짜목록으로조회한다([]);
            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(0);
        });
        it('날짜 목록이면 Map 반환', async () => {
            const entities = [{ date: '2025-03-01', DTO변환한다: () => ({ id: 'a' }) }];
            mockRepository.find.mockResolvedValue(entities);
            const result = await service.날짜목록으로조회한다(['2025-03-01']);
            expect(result.size).toBe(1);
            expect(result.get('2025-03-01')).toBeDefined();
        });
    });

    describe('목록조회한다', () => {
        it('연도 없이 조회 시 배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.목록조회한다();
            expect(result).toEqual([]);
        });
        it('연도로 조회 시 배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.목록조회한다('2025');
            expect(result).toEqual([]);
        });
    });

    describe('수정한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.수정한다('00000000-0000-0000-0000-000000000000', { startWorkTime: '10:00' }, 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('유효한 id 시 저장 후 DTO 반환', async () => {
            const existing = {
                date: '2025-03-01',
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'wto-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.수정한다('wto-1', { startWorkTime: '10:00' }, 'user-1');
            expect(result).toBeDefined();
            expect(existing.업데이트한다).toHaveBeenCalled();
        });
    });

    describe('날짜로수정한다', () => {
        it('해당 날짜 없으면 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.날짜로수정한다('2025-03-01', { startWorkTime: '10:00' }, 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('있으면 저장 후 DTO 반환', async () => {
            const existing = {
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'wto-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.날짜로수정한다('2025-03-01', { startWorkTime: '10:00' }, 'user-1');
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
            await service.삭제한다('wto-1', 'user-1');
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });

    describe('날짜로삭제한다', () => {
        it('해당 날짜 없으면 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.날짜로삭제한다('2025-03-01', 'user-1')).rejects.toThrow(NotFoundException);
        });
        it('있으면 save 호출', async () => {
            const existing = { deleted_at: null, 수정자설정한다: jest.fn(), 메타데이터업데이트한다: jest.fn() };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(undefined);
            await service.날짜로삭제한다('2025-03-01', 'user-1');
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
            const existing = { id: 'wto-1' };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.remove.mockResolvedValue(undefined);
            await service.완전삭제한다('wto-1', 'user-1');
            expect(mockRepository.remove).toHaveBeenCalledWith(existing);
        });
    });
});
