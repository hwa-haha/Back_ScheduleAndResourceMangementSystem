/**
 * 52100 단위 테스트: DomainAssignedProjectService
 * 서비스 공개 메서드별 검증 (생성·조회·수정·삭제·비활성화·활성화또는생성)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DomainAssignedProjectService } from '../../../../../src/domain/assigned-project/assigned-project.service';
import { AssignedProject } from '../../../../../src/domain/assigned-project/assigned-project.entity';

const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
};

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

describe('DomainAssignedProjectService', () => {
    let service: DomainAssignedProjectService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainAssignedProjectService,
                { provide: getRepositoryToken(AssignedProject), useValue: mockRepository },
            ],
        }).compile();
        service = module.get<DomainAssignedProjectService>(DomainAssignedProjectService);
    });

    describe('생성한다', () => {
        it('이미 동일 직원·프로젝트 할당이 있으면 ConflictException', async () => {
            mockRepository.findOne.mockResolvedValue({ id: 'existing' });
            await expect(
                service.생성한다({
                    employeeId: 'emp-1',
                    projectId: 'proj-1',
                }),
            ).rejects.toThrow(ConflictException);
            await expect(
                service.생성한다({ employeeId: 'emp-1', projectId: 'proj-1' }),
            ).rejects.toThrow(/이미 할당된 프로젝트입니다/);
        });
        it('중복 없으면 저장 후 DTO 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const saved = { id: 'new-1', DTO변환한다: () => ({ id: 'new-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성한다({
                employeeId: '550e8400-e29b-41d4-a716-446655440000',
                projectId: '550e8400-e29b-41d4-a716-446655440001',
            });
            expect(result).toBeDefined();
            expect(result.id).toBe('new-1');
        });
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id로 조회 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/할당된 프로젝트를 찾을 수 없습니다/);
        });
        it('유효한 id로 조회 시 DTO 반환', async () => {
            const entity = { id: 'uuid-1', DTO변환한다: () => ({ id: 'uuid-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.ID로조회한다('uuid-1');
            expect(result).toBeDefined();
            expect(result.id).toBe('uuid-1');
        });
    });

    describe('직원ID로조회한다', () => {
        it('직원 ID로 조회 시 배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.직원ID로조회한다('emp-1');
            expect(result).toEqual([]);
        });
    });

    describe('활성할당전체조회한다', () => {
        it('활성 할당 전체 조회 시 배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.활성할당전체조회한다();
            expect(result).toEqual([]);
        });
    });

    describe('프로젝트ID로조회한다', () => {
        it('프로젝트 ID로 조회 시 배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.프로젝트ID로조회한다('proj-1');
            expect(result).toEqual([]);
        });
    });

    describe('직원과프로젝트로조회한다', () => {
        it('없으면 null 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const result = await service.직원과프로젝트로조회한다('emp-1', 'proj-1');
            expect(result).toBeNull();
        });
        it('있으면 DTO 반환', async () => {
            const entity = { id: 'ap-1', DTO변환한다: () => ({ id: 'ap-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.직원과프로젝트로조회한다('emp-1', 'proj-1');
            expect(result).toBeDefined();
            expect(result!.id).toBe('ap-1');
        });
    });

    describe('활성화된목록조회한다', () => {
        it('활성화된 목록 조회 시 배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.활성화된목록조회한다();
            expect(result).toEqual([]);
        });
    });

    describe('날짜로활성화된목록조회한다', () => {
        it('날짜로 활성화된 목록 조회 시 배열 반환', async () => {
            mockQueryBuilder.getMany.mockResolvedValue([]);
            const result = await service.날짜로활성화된목록조회한다('2025-03-01');
            expect(result).toEqual([]);
        });
    });

    describe('수정한다', () => {
        it('존재하지 않는 id로 수정 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.수정한다('00000000-0000-0000-0000-000000000000', { isActive: false }, 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('유효한 id로 수정 시 저장 후 DTO 반환', async () => {
            const existing = {
                id: 'ap-1',
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'ap-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.수정한다('ap-1', { startDate: '2025-01-01' }, 'user-1');
            expect(result).toBeDefined();
            expect(existing.업데이트한다).toHaveBeenCalled();
        });
    });

    describe('삭제한다', () => {
        it('존재하지 않는 id로 삭제 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.삭제한다('00000000-0000-0000-0000-000000000000', 'user-1')).rejects.toThrow(
                NotFoundException,
            );
        });
        it('유효한 id로 삭제 시 저장 호출', async () => {
            const existing = {
                id: 'ap-1',
                deleted_at: null,
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(undefined);
            await service.삭제한다('ap-1', 'user-1');
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });

    describe('직원별할당전체비활성화한다', () => {
        it('할당 없으면 save 미호출', async () => {
            mockRepository.find.mockResolvedValue([]);
            await service.직원별할당전체비활성화한다('emp-1', 'user-1');
            expect(mockRepository.save).not.toHaveBeenCalled();
        });
        it('할당 있으면 비활성화 후 save 호출', async () => {
            const ap = {
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
            };
            mockRepository.find.mockResolvedValue([ap]);
            mockRepository.save.mockResolvedValue(undefined);
            await service.직원별할당전체비활성화한다('emp-1', 'user-1');
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });

    describe('직원프로젝트할당활성화또는생성한다', () => {
        it('기존 할당 있으면 갱신 후 DTO 반환', async () => {
            const existing = {
                id: 'ap-1',
                start_date: '2024-01-01',
                end_date: '2024-12-31',
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'ap-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.직원프로젝트할당활성화또는생성한다(
                'emp-1',
                'proj-1',
                '2025-01-01',
                '2025-12-31',
                'user-1',
            );
            expect(result).toBeDefined();
            expect(result.id).toBe('ap-1');
            expect(existing.업데이트한다).toHaveBeenCalled();
        });
        it('기존 할당 없으면 생성한다 호출 후 DTO 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            mockRepository.save.mockResolvedValue({ id: 'new-1', DTO변환한다: () => ({ id: 'new-1' }) });
            const result = await service.직원프로젝트할당활성화또는생성한다(
                '550e8400-e29b-41d4-a716-446655440000',
                '550e8400-e29b-41d4-a716-446655440001',
                undefined,
                undefined,
                'user-1',
            );
            expect(result).toBeDefined();
            expect(result.id).toBe('new-1');
        });
    });

    describe('완전삭제한다', () => {
        it('존재하지 않는 id로 완전삭제 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.완전삭제한다('00000000-0000-0000-0000-000000000000', 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('유효한 id로 완전삭제 시 remove 호출', async () => {
            const existing = { id: 'ap-1' };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.remove.mockResolvedValue(undefined);
            await service.완전삭제한다('ap-1', 'user-1');
            expect(mockRepository.remove).toHaveBeenCalledWith(existing);
        });
    });
});
