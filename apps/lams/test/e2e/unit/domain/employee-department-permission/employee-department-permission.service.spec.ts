/**
 * 52100 단위 테스트: DomainEmployeeDepartmentPermissionService (복수 Repository)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DomainEmployeeDepartmentPermissionService } from '../../../../../src/domain/employee-department-permission/employee-department-permission.service';
import { EmployeeDepartmentPermission } from '../../../../../src/domain/employee-department-permission/employee-department-permission.entity';
import { EmployeeDepartmentPermissionHistory } from '../../../../../src/domain/employee-department-permission/employee-department-permission-history.entity';

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
};
const mockHistoryRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
};

describe('DomainEmployeeDepartmentPermissionService', () => {
    let service: DomainEmployeeDepartmentPermissionService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainEmployeeDepartmentPermissionService,
                {
                    provide: getRepositoryToken(EmployeeDepartmentPermission),
                    useValue: mockRepository,
                },
                {
                    provide: getRepositoryToken(EmployeeDepartmentPermissionHistory),
                    useValue: mockHistoryRepository,
                },
            ],
        }).compile();
        service = module.get<DomainEmployeeDepartmentPermissionService>(DomainEmployeeDepartmentPermissionService);
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id로 조회 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/직원-부서 권한을 찾을 수 없습니다/);
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
