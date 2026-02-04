import { Injectable, Logger } from '@nestjs/common';
import { DashboardContextService } from '../../context/dashboard-context/dashboard-context.service';
import { GetDepartmentMonthlyAverageWorkHoursResponseDto } from '../../interface/dashboard/dto/get-department-monthly-average-work-hours.dto';
import { GetDepartmentMonthlyEmployeeWorkHoursResponseDto } from '../../interface/dashboard/dto/get-department-monthly-employee-work-hours.dto';
import { GetDepartmentMonthlyEmployeeAttendanceResponseDto } from '../../interface/dashboard/dto/get-department-monthly-employee-attendance.dto';
import { GetDepartmentWeeklyTopEmployeesResponseDto } from '../../interface/dashboard/dto/get-department-weekly-top-employees.dto';
import {
    GetDepartmentSnapshotsResponseDto,
    SnapshotInfoDto,
    SnapshotChildInfoDto,
} from '../../interface/dashboard/dto/get-department-snapshots.dto';
import { IGetDepartmentSnapshotsResponse } from '../../context/dashboard-context/interfaces/response/get-department-snapshots-response.interface';
import { GetEmployeeAttendanceDetailResponseDto } from '../../interface/dashboard/dto/get-employee-attendance-detail.dto';
import { IGetEmployeeAttendanceDetailResponse } from '../../context/dashboard-context/interfaces/response/get-employee-attendance-detail-response.interface';

/**
 * 대시보드 비즈니스 서비스
 *
 * 대시보드 관련 비즈니스 로직을 오케스트레이션합니다.
 */
@Injectable()
export class DashboardBusinessService {
    private readonly logger = new Logger(DashboardBusinessService.name);

    constructor(private readonly dashboardContextService: DashboardContextService) {}

    /**
     * 부서별 월별 일평균 근무시간 조회 (1~12월 연간)
     *
     * 연도별로 1월부터 12월까지의 월별 일평균 근무시간만 조회합니다.
     */
    async 부서별월별일평균근무시간을조회한다(
        departmentId: string,
        year: string,
    ): Promise<GetDepartmentMonthlyAverageWorkHoursResponseDto> {
        this.logger.log(`부서별 월별 일평균 근무시간 조회: departmentId=${departmentId}, year=${year}`);
        return await this.dashboardContextService.부서별월별일평균근무시간을조회한다({ departmentId, year });
    }

    /**
     * 부서별 월별 직원별 근무시간 조회 (특정 연·월)
     *
     * 선택한 연·월에 해당 부서 직원들의 근무시간 상세(총 근무시간, 지각·조퇴, 주차별 근무시간)를 내림차순으로 조회합니다.
     */
    async 부서별월별직원별근무시간을조회한다(
        departmentId: string,
        year: string,
        month: string,
    ): Promise<GetDepartmentMonthlyEmployeeWorkHoursResponseDto> {
        this.logger.log(`부서별 월별 직원별 근무시간 조회: departmentId=${departmentId}, year=${year}, month=${month}`);
        return await this.dashboardContextService.부서별월별직원별근무시간을조회한다({ departmentId, year, month });
    }

    /**
     * 부서별 월별 직원별 근무내역 조회
     *
     * 근태사용내역을 기준으로 출장, 연차, 결근, 지각에 대한 정보를 조회합니다.
     */
    async 부서별월별직원별근무내역을조회한다(
        departmentId: string,
        year: string,
        month: string,
    ): Promise<GetDepartmentMonthlyEmployeeAttendanceResponseDto> {
        this.logger.log(`부서별 월별 직원별 근무내역 조회: departmentId=${departmentId}, year=${year}, month=${month}`);
        return await this.dashboardContextService.부서별월별직원별근무내역을조회한다({ departmentId, year, month });
    }

    /**
     * 부서별 월별 주차별 주간근무시간 상위 5명 조회
     *
     * 각 주차별로 주간근무시간이 높은 상위 5명의 직원을 조회합니다.
     */
    async 부서별월별주차별주간근무시간상위5명을조회한다(
        departmentId: string,
        year: string,
        month: string,
    ): Promise<GetDepartmentWeeklyTopEmployeesResponseDto> {
        this.logger.log(
            `부서별 월별 주차별 주간근무시간 상위 5명 조회: departmentId=${departmentId}, year=${year}, month=${month}`,
        );
        return await this.dashboardContextService.부서별월별주차별주간근무시간상위5명을조회한다({
            departmentId,
            year,
            month,
        });
    }

    /**
     * 부서별 연도, 월별 스냅샷 조회
     *
     * 특정 부서의 연도, 월별 스냅샷 목록을 조회합니다.
     */
    async 부서별연도월별스냅샷을조회한다(
        departmentId: string,
        year: string,
        month: string,
    ): Promise<GetDepartmentSnapshotsResponseDto> {
        this.logger.log(`부서별 연도, 월별 스냅샷 조회: departmentId=${departmentId}, year=${year}, month=${month}`);
        const result = await this.dashboardContextService.부서별연도월별스냅샷을조회한다({ departmentId, year, month });

        // 인터페이스를 DTO로 변환
        if (!result) {
            return null;
        }

        const snapshotDto: SnapshotInfoDto = {
            id: result.id,
            snapshotName: result.snapshotName,
            year: result.year,
            month: result.month,
            createdAt: result.createdAt,
            children: result.children?.map((child) => ({
                id: child.id,
                employeeId: child.employeeId,
                employeeName: child.employeeName,
                employeeNumber: child.employeeNumber,
                yyyy: child.yyyy,
                mm: child.mm,
                snapshotData: child.snapshotData,
            })),
        };

        return snapshotDto;
    }

    /**
     * 연도, 월별 직원 근태상세 조회
     *
     * 특정 직원의 연도, 월별 근태 상세 정보를 조회합니다.
     */
    async 연도월별직원근태상세를조회한다(
        employeeId: string,
        year: string,
        month: string,
    ): Promise<IGetEmployeeAttendanceDetailResponse> {
        this.logger.log(`연도, 월별 직원 근태상세 조회: employeeId=${employeeId}, year=${year}, month=${month}`);
        return await this.dashboardContextService.연도월별직원근태상세를조회한다({ employeeId, year, month });
    }
}
