import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EmployeeManagementService } from '../employee-management.service';

/**
 * 직원 동기화 크론 작업 (EC2 등 서버 환경)
 * 호환용 기존 API: GET /v1/employees/sync?execute=true (Authorization 헤더 필요)
 * 크론 실행 시 CRON_EMPLOYEE_SYNC_AUTHORIZATION 환경변수 사용 (Bearer 토큰 값)
 */
@Injectable()
export class EmployeeCronService {
    private readonly logger = new Logger(EmployeeCronService.name);

    constructor(private readonly employeeManagementService: EmployeeManagementService) {}

    /** 매일 0시(At 12:00 AM) 직원 동기화. */
    @Cron('0 0 0 * * *', { timeZone: 'Asia/Seoul' })
    async syncEmployees(): Promise<void> {
        this.logger.log('Cron: 직원 동기화 실행');
        try {
            await this.employeeManagementService.syncEmployees('');
            this.logger.log('Cron: 직원 동기화 완료');
        } catch (error) {
            this.logger.error('Cron: 직원 동기화 실패', error);
        }
    }
}
