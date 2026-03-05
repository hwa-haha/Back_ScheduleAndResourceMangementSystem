/**
 * 52100 단위 테스트: DomainFileContentReflectionHistoryService
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DomainFileContentReflectionHistoryService } from '../../../../../src/domain/file-content-reflection-history/file-content-reflection-history.service';
import { FileContentReflectionHistory } from '../../../../../src/domain/file-content-reflection-history/file-content-reflection-history.entity';

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
};

describe('DomainFileContentReflectionHistoryService', () => {
    let service: DomainFileContentReflectionHistoryService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainFileContentReflectionHistoryService,
                { provide: getRepositoryToken(FileContentReflectionHistory), useValue: mockRepository },
            ],
        }).compile();
        service = module.get<DomainFileContentReflectionHistoryService>(DomainFileContentReflectionHistoryService);
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id로 조회 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/파일 내용 반영 이력을 찾을 수 없습니다/);
        });
        it('유효한 id로 조회 시 DTO 반환', async () => {
            const entity = { id: 'uuid-1', DTO변환한다: () => ({ id: 'uuid-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.ID로조회한다('uuid-1');
            expect(result).toBeDefined();
            expect(result.id).toBe('uuid-1');
        });
    });
});
