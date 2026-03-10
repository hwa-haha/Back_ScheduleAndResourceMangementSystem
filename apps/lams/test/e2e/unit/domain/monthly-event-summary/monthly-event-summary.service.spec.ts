/**
 * 52100 단위 테스트: DomainMonthlyEventSummaryService (Repository + DataSource + DomainAttendanceTypeService)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DomainMonthlyEventSummaryService } from '../../../../../src/domain/monthly-event-summary/monthly-event-summary.service';
import { MonthlyEventSummary } from '../../../../../src/domain/monthly-event-summary/monthly-event-summary.entity';
import { DomainAttendanceTypeService } from '../../../../../src/domain/attendance-type/attendance-type.service';

const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
};

describe('DomainMonthlyEventSummaryService', () => {
    let service: DomainMonthlyEventSummaryService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DomainMonthlyEventSummaryService,
                { provide: getRepositoryToken(MonthlyEventSummary), useValue: mockRepository },
                { provide: DataSource, useValue: {} },
                { provide: DomainAttendanceTypeService, useValue: {} },
            ],
        }).compile();
        service = module.get<DomainMonthlyEventSummaryService>(DomainMonthlyEventSummaryService);
    });

    describe('ID로조회한다', () => {
        it('존재하지 않는 id로 조회 시 NotFoundException', async () => {
            mockRepository.findOne.mockResolvedValue(null);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(NotFoundException);
            await expect(service.ID로조회한다('00000000-0000-0000-0000-000000000000')).rejects.toThrow(/월간 요약을 찾을 수 없습니다/);
        });
        it('유효한 id로 조회 시 DTO 반환', async () => {
            const entity = { id: 'uuid-1', DTO변환한다: () => ({ id: 'uuid-1' }) };
            mockRepository.findOne.mockResolvedValue(entity);
            const result = await service.ID로조회한다('uuid-1');
            expect(result).toBeDefined();
            expect(result.id).toBe('uuid-1');
        });
    });

    describe('생성한다', () => {
        it('이미 동일 직원·연월이 있으면 ConflictException', async () => {
            mockRepository.findOne.mockResolvedValue({ id: 'existing' });
            const data = {
                employeeId: 'emp-1',
                yyyymm: '2025-03',
                employeeNumber: '10001',
                employeeName: '홍길동',
                workDaysCount: 22,
                totalWorkableTime: 176,
                totalWorkTime: 160,
                avgWorkTimes: 8,
                attendanceTypeCount: {},
            };
            await expect(service.생성한다(data)).rejects.toThrow(ConflictException);
            await expect(service.생성한다(data)).rejects.toThrow(/이미 해당 연월의 월간 요약이 존재합니다/);
        });
    });
});
