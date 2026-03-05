/**
 * 52100 단위 테스트: DomainFileService (공개 메서드별 검증)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DomainFileService } from '../../../../../src/domain/file/file.service';
import { File } from '../../../../../src/domain/file/file.entity';

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
};

describe('DomainFileService', () => {
    let service: DomainFileService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainFileService,
                { provide: getRepositoryToken(File), useValue: mockRepository },
            ],
        }).compile();
        service = module.get<DomainFileService>(DomainFileService);
    });

    describe('생성한다', () => {
        it('저장 후 DTO 반환', async () => {
            const saved = { id: 'f-1', DTO변환한다: () => ({ id: 'f-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성한다({
                fileName: 'test.xlsx',
                filePath: '/path/to/file',
                uploadBy: 'user-1',
            });
            expect(result).toBeDefined();
            expect(result.id).toBe('f-1');
        });
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/파일을 찾을 수 없습니다/);
        });
        it('유효한 id 시 DTO 반환', async () => {
            const entity = { id: 'uuid-1', DTO변환한다: () => ({ id: 'uuid-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.ID로조회한다('uuid-1');
            expect(result).toBeDefined();
            expect(result.id).toBe('uuid-1');
        });
    });

    describe('파일명으로조회한다', () => {
        it('없으면 null 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const result = await service.파일명으로조회한다('none.xlsx');
            expect(result).toBeNull();
        });
        it('있으면 DTO 반환', async () => {
            const entity = { id: 'f-1', DTO변환한다: () => ({ id: 'f-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.파일명으로조회한다('test.xlsx');
            expect(result).toBeDefined();
            expect(result!.id).toBe('f-1');
        });
    });

    describe('목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.목록조회한다();
            expect(result).toEqual([]);
        });
    });

    describe('연도월별목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.연도월별목록조회한다('2025', '03');
            expect(result).toEqual([]);
        });
    });

    describe('업로드자별목록조회한다', () => {
        it('배열 반환', async () => {
            mockRepository.find.mockResolvedValue([]);
            const result = await service.업로드자별목록조회한다('user-1');
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
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'f-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.수정한다('f-1', { fileOriginalName: 'renamed.xlsx' }, 'user-1');
            expect(result).toBeDefined();
            expect(existing.업데이트한다).toHaveBeenCalled();
        });
    });

    describe('연도월설정한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.연도월설정한다('00000000-0000-0000-0000-000000000000', '2025', '03', 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('유효한 id 시 연도월 설정 후 DTO 반환', async () => {
            const existing = {
                연도월설정한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'f-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.연도월설정한다('f-1', '2025', '03', 'user-1');
            expect(result).toBeDefined();
            expect(existing.연도월설정한다).toHaveBeenCalledWith('2025', '03');
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
            await service.삭제한다('f-1', 'user-1');
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
            const existing = { id: 'f-1' };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.remove.mockResolvedValue(undefined);
            await service.완전삭제한다('f-1', 'user-1');
            expect(mockRepository.remove).toHaveBeenCalledWith(existing);
        });
    });
});
