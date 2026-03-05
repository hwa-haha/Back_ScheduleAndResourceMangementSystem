/**
 * 52100 단위 테스트: DomainDataSnapshotInfoService (공개 메서드별 검증)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DomainDataSnapshotInfoService } from '../../../../../src/domain/data-snapshot-info/data-snapshot-info.service';
import { DataSnapshotInfo } from '../../../../../src/domain/data-snapshot-info/data-snapshot-info.entity';
import { SnapshotType } from '../../../../../src/domain/data-snapshot-info/data-snapshot-info.types';

const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
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

describe('DomainDataSnapshotInfoService', () => {
    let service: DomainDataSnapshotInfoService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainDataSnapshotInfoService,
                { provide: getRepositoryToken(DataSnapshotInfo), useValue: mockRepository },
            ],
        }).compile();
        service = module.get<DomainDataSnapshotInfoService>(DomainDataSnapshotInfoService);
    });

    describe('생성한다', () => {
        it('저장 후 DTO 반환', async () => {
            const saved = { id: 'snap-1', DTO변환한다: () => ({ id: 'snap-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성한다({
                snapshotName: '스냅샷1',
                snapshotType: SnapshotType.MONTHLY,
                yyyy: '2025',
                mm: '03',
                departmentId: '550e8400-e29b-41d4-a716-446655440001',
            });
            expect(result).toBeDefined();
            expect(result.id).toBe('snap-1');
        });
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/데이터 스냅샷 정보를 찾을 수 없습니다/);
        });
        it('유효한 id 시 DTO 반환', async () => {
            const snapshot = { id: 'snap-uuid-1', yyyy: '2025', mm: '03', DTO변환한다: () => ({ id: 'snap-uuid-1', yyyy: '2025', mm: '03' }) };
            mockRepository.findOne.mockResolvedValue(snapshot);
            const result = await service.ID로조회한다('snap-uuid-1');
            expect(result).toBeDefined();
            expect(result.id).toBe('snap-uuid-1');
        });
    });

    describe('자식포함목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.자식포함목록조회한다();
            expect(result).toEqual([]);
        });
    });

    describe('자식포함조회한다', () => {
        it('없으면 null 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const result = await service.자식포함조회한다('snap-1');
            expect(result).toBeNull();
        });
        it('있으면 DTO 반환', async () => {
            const snapshot = { id: 'snap-1', DTO변환한다: () => ({ id: 'snap-1' }) };
            mockRepository.findOne.mockResolvedValue(snapshot);
            const result = await service.자식포함조회한다('snap-1');
            expect(result).toBeDefined();
            expect(result!.id).toBe('snap-1');
        });
    });

    describe('연월로목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.연월로목록조회한다('2025', '03');
            expect(result).toEqual([]);
        });
    });

    describe('타입으로목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.타입으로목록조회한다(SnapshotType.MONTHLY);
            expect(result).toEqual([]);
        });
    });

    describe('제출연월로목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.제출연월로목록조회한다('2025', '03');
            expect(result).toEqual([]);
        });
    });

    describe('연월과타입으로목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.연월과타입으로목록조회한다('2025', '03', SnapshotType.MONTHLY);
            expect(result).toEqual([]);
        });
    });

    describe('연월과타입으로목록조회_자식직원필터한다', () => {
        it('employeeIds 비어 있으면 find로 조회 후 children 빈 배열', async () => {
            mockRepository.find.mockResolvedValue([{ id: 's1', DTO변환한다: () => ({ id: 's1' }) }]);
            const result = await service.연월과타입으로목록조회_자식직원필터한다('2025', '03', SnapshotType.MONTHLY, []);
            expect(result).toHaveLength(1);
            expect(result[0].children).toEqual([]);
        });
        it('employeeIds 있으면 createQueryBuilder로 조회', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([{ id: 's1', DTO변환한다: () => ({ id: 's1' }) }]);
            const result = await service.연월과타입으로목록조회_자식직원필터한다(
                '2025', '03', SnapshotType.MONTHLY, ['emp-1'],
            );
            expect(result).toHaveLength(1);
            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('snapshot');
        });
    });

    describe('연월부서별목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.연월부서별목록조회한다('2025', '03', '550e8400-e29b-41d4-a716-446655440001', SnapshotType.MONTHLY);
            expect(result).toEqual([]);
        });
    });

    describe('수정한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.수정한다('00000000-0000-0000-0000-000000000000', { snapshotName: '수정' }, 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('유효한 id 시 저장 후 DTO 반환', async () => {
            const existing = {
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'snap-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.수정한다('snap-1', { snapshotName: '수정명' }, 'user-1');
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
            await service.삭제한다('snap-1', 'user-1');
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
            const existing = { id: 'snap-1' };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.remove.mockResolvedValue(undefined);
            await service.완전삭제한다('snap-1', 'user-1');
            expect(mockRepository.remove).toHaveBeenCalledWith(existing);
        });
    });

    describe('동일연월다른스냅샷들을비현재로설정한다', () => {
        it('대상 없으면 save 미호출', async () => {
            mockRepository.find.mockResolvedValue([]);
            await service.동일연월다른스냅샷들을비현재로설정한다('2025', '03', 'snap-1', 'user-1');
            expect(mockRepository.save).not.toHaveBeenCalled();
        });
        it('대상 있으면 save 호출', async () => {
            const other = { id: 'snap-2', is_current: true, 업데이트한다: jest.fn(), 수정자설정한다: jest.fn(), 메타데이터업데이트한다: jest.fn() };
            mockRepository.find.mockResolvedValue([other]);
            mockRepository.save.mockResolvedValue(undefined);
            await service.동일연월다른스냅샷들을비현재로설정한다('2025', '03', 'snap-1', 'user-1');
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });

    describe('현재스냅샷으로설정한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.현재스냅샷으로설정한다('00000000-0000-0000-0000-000000000000', 'user-1')).rejects.toThrow(
                NotFoundException,
            );
        });
        it('유효한 id 시 동일연월 비현재 설정 후 저장', async () => {
            const existing = {
                id: 'snap-1',
                yyyy: '2025',
                mm: '03',
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'snap-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.find.mockResolvedValue([]);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.현재스냅샷으로설정한다('snap-1', 'user-1');
            expect(result).toBeDefined();
            expect(result.id).toBe('snap-1');
        });
    });
});
