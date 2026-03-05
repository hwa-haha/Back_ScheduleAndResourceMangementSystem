/**
 * 52100 단위 테스트: DomainAttendanceIssueService
 * - ID로조회한다: 없으면 NotFoundException, 있으면 DTO 반환
 * - ID목록으로조회한다: 빈 배열 입력 시 빈 배열 반환
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DomainAttendanceIssueService } from '../../../../../src/domain/attendance-issue/attendance-issue.service';
import { AttendanceIssue } from '../../../../../src/domain/attendance-issue/attendance-issue.entity';
import { AttendanceIssueStatus } from '../../../../../src/domain/attendance-issue/attendance-issue.types';

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
    })),
};

describe('DomainAttendanceIssueService', () => {
    let service: DomainAttendanceIssueService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainAttendanceIssueService,
                {
                    provide: getRepositoryToken(AttendanceIssue),
                    useValue: mockRepository,
                },
            ],
        }).compile();
        service = module.get<DomainAttendanceIssueService>(DomainAttendanceIssueService);
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id로 조회 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(
                /근태 이슈를 찾을 수 없습니다/,
            );
        });

        it('유효한 id로 조회 시 DTO 반환', async () => {
            const issue = {
                id: 'a1b2c3d4-0000-0000-0000-000000000001',
                employee_id: 'emp-uuid',
                date: '2025-03-01',
                status: AttendanceIssueStatus.REQUEST,
                DTO변환한다: () => ({
                    id: 'a1b2c3d4-0000-0000-0000-000000000001',
                    employeeId: 'emp-uuid',
                    date: '2025-03-01',
                    status: AttendanceIssueStatus.REQUEST,
                }),
            };
            mockRepository.findOne.mockResolvedValue(issue);
            const result = await service.ID로조회한다('a1b2c3d4-0000-0000-0000-000000000001');
            expect(result).toBeDefined();
            expect(result.id).toBe(issue.id);
            expect(result.status).toBe(AttendanceIssueStatus.REQUEST);
        });
    });

    describe('ID목록으로조회한다', () => {
        it('빈 배열 입력 시 빈 배열 반환', async () => {
            const result = await service.ID목록으로조회한다([]);
            expect(result).toEqual([]);
            expect(mockRepository.find).not.toHaveBeenCalled();
        });
    });

    describe('생성한다', () => {
        it('유효한 데이터로 생성 시 저장 후 DTO 반환', async () => {
            const savedIssue = {
                id: 'new-uuid',
                employee_id: 'emp-1',
                date: '2025-03-01',
                status: AttendanceIssueStatus.PENDING,
                DTO변환한다: () => ({
                    id: 'new-uuid',
                    employeeId: 'emp-1',
                    date: '2025-03-01',
                    status: AttendanceIssueStatus.PENDING,
                }),
            };
            mockRepository.save.mockResolvedValue(savedIssue);
            const result = await service.생성한다({
                employeeId: 'emp-1',
                date: '2025-03-01',
            });
            expect(result).toBeDefined();
            expect(result.id).toBe('new-uuid');
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });

    describe('수정한다', () => {
        it('존재하지 않는 id로 수정 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(
                service.수정한다('00000000-0000-0000-0000-000000000000', { description: '수정' }, 'user-1'),
            ).rejects.toThrow(NotFoundException);
            await expect(
                service.수정한다('00000000-0000-0000-0000-000000000000', { description: '수정' }, 'user-1'),
            ).rejects.toThrow(/근태 이슈를 찾을 수 없습니다/);
        });
        it('유효한 id로 수정 시 저장 후 DTO 반환', async () => {
            const existingIssue = {
                id: 'uuid-1',
                업데이트한다: jest.fn(),
                수정자설정한다: jest.fn(),
                메타데이터업데이트한다: jest.fn(),
                DTO변환한다: () => ({ id: 'uuid-1', description: '수정됨' }),
            };
            mockRepository.findOne.mockResolvedValue(existingIssue);
            mockRepository.save.mockResolvedValue(existingIssue);
            const result = await service.수정한다('uuid-1', { description: '수정됨' }, 'user-1');
            expect(result).toBeDefined();
            expect(result.description).toBe('수정됨');
            expect(existingIssue.업데이트한다).toHaveBeenCalled();
            expect(mockRepository.save).toHaveBeenCalled();
        });
    });
});
