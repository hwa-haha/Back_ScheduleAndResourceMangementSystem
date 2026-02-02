import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
    GetDepartmentMonthlyAverageWorkHoursQuery,
    GetDepartmentMonthlyEmployeeWorkHoursQuery,
    GetDepartmentMonthlyEmployeeAttendanceQuery,
    GetDepartmentWeeklyTopEmployeesQuery,
    GetDepartmentSnapshotsQuery,
    GetEmployeeAttendanceDetailQuery,
} from './handlers';
import {
    IGetDepartmentMonthlyAverageWorkHoursQuery,
    IGetDepartmentMonthlyAverageWorkHoursResponse,
    IGetDepartmentMonthlyEmployeeWorkHoursQuery,
    IGetDepartmentMonthlyEmployeeWorkHoursResponse,
    IGetDepartmentMonthlyEmployeeAttendanceQuery,
    IGetDepartmentMonthlyEmployeeAttendanceResponse,
    IGetDepartmentWeeklyTopEmployeesQuery,
    IGetDepartmentWeeklyTopEmployeesResponse,
    IGetDepartmentSnapshotsQuery,
    IGetDepartmentSnapshotsResponse,
    IGetEmployeeAttendanceDetailQuery,
    IGetEmployeeAttendanceDetailResponse,
} from './interfaces';

/**
 * 대시보드 Context Service
 *
 * QueryBus를 통해 Handler를 호출하는 서비스 레이어입니다.
 */
@Injectable()
export class DashboardContextService {
    constructor(private readonly queryBus: QueryBus) {}

    /**
     * 부서별 월별 일평균 근무시간 조회 (1~12월 연간)
     */
    async 부서별월별일평균근무시간을조회한다(
        query: IGetDepartmentMonthlyAverageWorkHoursQuery,
    ): Promise<IGetDepartmentMonthlyAverageWorkHoursResponse> {
        const queryInstance = new GetDepartmentMonthlyAverageWorkHoursQuery(query);
        return await this.queryBus.execute(queryInstance);
    }

    /**
     * 부서별 월별 직원별 근무시간 조회 (특정 연·월)
     */
    async 부서별월별직원별근무시간을조회한다(
        query: IGetDepartmentMonthlyEmployeeWorkHoursQuery,
    ): Promise<IGetDepartmentMonthlyEmployeeWorkHoursResponse> {
        const queryInstance = new GetDepartmentMonthlyEmployeeWorkHoursQuery(query);
        return await this.queryBus.execute(queryInstance);
    }

    /**
     * 부서별 월별 직원별 근무내역 조회
     */
    async 부서별월별직원별근무내역을조회한다(
        query: IGetDepartmentMonthlyEmployeeAttendanceQuery,
    ): Promise<IGetDepartmentMonthlyEmployeeAttendanceResponse> {
        const queryInstance = new GetDepartmentMonthlyEmployeeAttendanceQuery(query);
        return await this.queryBus.execute(queryInstance);
    }

    /**
     * 부서별 월별 주차별 주간근무시간 상위 5명 조회
     */
    async 부서별월별주차별주간근무시간상위5명을조회한다(
        query: IGetDepartmentWeeklyTopEmployeesQuery,
    ): Promise<IGetDepartmentWeeklyTopEmployeesResponse> {
        const queryInstance = new GetDepartmentWeeklyTopEmployeesQuery(query);
        return await this.queryBus.execute(queryInstance);
    }

    /**
     * 부서별 연도, 월별 스냅샷 조회
     */
    async 부서별연도월별스냅샷을조회한다(
        query: IGetDepartmentSnapshotsQuery,
    ): Promise<IGetDepartmentSnapshotsResponse> {
        const queryInstance = new GetDepartmentSnapshotsQuery(query);
        return await this.queryBus.execute(queryInstance);
    }

    /**
     * 연도, 월별 직원 근태상세 조회
     */
    async 연도월별직원근태상세를조회한다(
        query: IGetEmployeeAttendanceDetailQuery,
    ): Promise<IGetEmployeeAttendanceDetailResponse> {
        const queryInstance = new GetEmployeeAttendanceDetailQuery(query);
        return await this.queryBus.execute(queryInstance);
    }
}
