/**
 * 52100 단위 테스트: DomainEmployeeExtraInfoService (공개 메서드별 검증)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DomainEmployeeExtraInfoService } from '../../../../../src/domain/employee-extra-info/employee-extra-info.service';
import { EmployeeExtraInfo } from '../../../../../src/domain/employee-extra-info/employee-extra-info.entity';

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
};

describe('DomainEmployeeExtraInfoService', () => {
    let service: DomainEmployeeExtraInfoService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainEmployeeExtraInfoService,
                { provide: getRepositoryToken(EmployeeExtraInfo), useValue: mockRepository },
            ],
        }).compile();
        service = module.get<DomainEmployeeExtraInfoService>(DomainEmployeeExtraInfoService);
    });

    describe('생성한다', () => {
        it('저장 후 DTO 반환', async () => {
            const saved = { id: 'eei-1', DTO변환한다: () => ({ id: 'eei-1' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.생성한다({
                employeeId: '550e8400-e29b-41d4-a716-446655440000',
                isExcludedFromSummary: false,
            });
            expect(result).toBeDefined();
            expect(result.id).toBe('eei-1');
        });
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/직원 추가 정보를 찾을 수 없습니다/);
        });
        it('유효한 id 시 DTO 반환', async () => {
            const entity = { id: 'uuid-1', DTO변환한다: () => ({ id: 'uuid-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.ID로조회한다('uuid-1');
            expect(result).toBeDefined();
            expect(result.id).toBe('uuid-1');
        });
    });

    describe('직원ID로조회한다', () => {
        it('없으면 null 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const result = await service.직원ID로조회한다('550e8400-e29b-41d4-a716-446655440000');
            expect(result).toBeNull();
        });
        it('있으면 DTO 반환', async () => {
            const entity = { id: 'eei-1', DTO변환한다: () => ({ id: 'eei-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.직원ID로조회한다('550e8400-e29b-41d4-a716-446655440000');
            expect(result).toBeDefined();
            expect(result!.id).toBe('eei-1');
        });
    });

    describe('수정한다', () => {
        it('존재하지 않는 id 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.수정한다('00000000-0000-0000-0000-000000000000', { isExcludedFromSummary: true }, 'user-1'),
            ).rejects.toThrow(NotFoundException);
        });
        it('유효한 id 시 저장 후 DTO 반환', async () => {
            const existing = {
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'eei-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.수정한다('eei-1', { isExcludedFromSummary: true }, 'user-1');
            expect(result).toBeDefined();
            expect(existing.업데이트한다).toHaveBeenCalled();
        });
    });

    describe('직원ID로생성또는수정한다', () => {
        it('기존 정보 있으면 업데이트 후 DTO 반환', async () => {
            const existing = {
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'eei-1' }),
            };
            mockRepository.findOne.mockResolvedValue(existing);
            mockRepository.save.mockResolvedValue(existing);
            const result = await service.직원ID로생성또는수정한다(
                '550e8400-e29b-41d4-a716-446655440000',
                { isExcludedFromSummary: true },
                'user-1',
            );
            expect(result).toBeDefined();
            expect(existing.업데이트한다).toHaveBeenCalled();
        });
        it('기존 정보 없으면 생성 후 DTO 반환', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            const saved = { id: 'eei-new', DTO변환한다: () => ({ id: 'eei-new' }) };
            mockRepository.save.mockResolvedValue(saved);
            const result = await service.직원ID로생성또는수정한다(
                '550e8400-e29b-41d4-a716-446655440000',
                { isExcludedFromSummary: false },
                'user-1',
            );
            expect(result).toBeDefined();
            expect(result.id).toBe('eei-new');
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
            await service.삭제한다('eei-1', 'user-1');
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });
});
