/**
 * 52100 단위 테스트: DomainProjectService (공개 메서드별 검증)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DomainProjectService } from '../../../../../src/domain/project/project.service';
import { Project } from '../../../../../src/domain/project/project.entity';

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

describe('DomainProjectService', () => {
    let service: DomainProjectService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainProjectService,
                { provide: getRepositoryToken(Project), useValue: mockRepository },
            ],
        }).compile();
        service = module.get<DomainProjectService>(DomainProjectService);
    });

    describe('생성한다', () => {
        it('동일 projectCode 있으면 ConflictException', async () => {
            mockRepository.findOne.mockResolvedValue({ id: 'existing' });
            await expect(
                service.생성한다({ projectCode: 'P001', projectName: '프로젝트1' }),
            ).rejects.toThrow(ConflictException);
            await expect(
                service.생성한다({ projectCode: 'P001', projectName: '프로젝트1' }),
            ).rejects.toThrow(/이미 존재하는 프로젝트 코드입니다/);
        });
        it('중복 없으면 저장 후 DTO 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const saved = { id: 'p-1', DTO변환한다: () => ({ id: 'p-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성한다({ projectCode: 'P001', projectName: '프로젝트1' });
            expect(result).toBeDefined();
            expect(result.id).toBe('p-1');
        });
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/프로젝트를 찾을 수 없습니다/);
        });
        it('유효한 id 시 DTO 반환', async () => {
            const entity = { id: 'uuid-1', DTO변환한다: () => ({ id: 'uuid-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.ID로조회한다('uuid-1');
            expect(result).toBeDefined();
            expect(result.id).toBe('uuid-1');
        });
    });

    describe('코드로조회한다', () => {
        it('없으면 null 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const result = await service.코드로조회한다('P999');
            expect(result).toBeNull();
        });
        it('있으면 DTO 반환', async () => {
            const entity = { id: 'p-1', DTO변환한다: () => ({ id: 'p-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.코드로조회한다('P001');
            expect(result).toBeDefined();
            expect(result!.id).toBe('p-1');
        });
    });

    describe('목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.목록조회한다();
            expect(result).toEqual([]);
        });
    });

    describe('활성화된목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.활성화된목록조회한다();
            expect(result).toEqual([]);
        });
    });

    describe('이름으로검색한다', () => {
        it('배열 반환', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);
            const result = await service.이름으로검색한다('키워드');
            expect(result).toEqual([]);
        });
    });

    describe('수정한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.수정한다('00000000-0000-0000-0000-000000000000', { projectName: '수정' }, 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('유효한 id 시 저장 후 DTO 반환', async () => {
            const existing = {
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'p-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.수정한다('p-1', { projectName: '수정명' }, 'user-1');
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
            await service.삭제한다('p-1', 'user-1');
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
            const existing = { id: 'p-1' };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.remove.mockResolvedValue(undefined);
            await service.완전삭제한다('p-1', 'user-1');
            expect(mockRepository.remove).toHaveBeenCalledWith(existing);
        });
    });
});
