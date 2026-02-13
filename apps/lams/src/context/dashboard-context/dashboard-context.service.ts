import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
    GetDepartmentMonthlySnapshotChildrenQuery,
    ComputeDepartmentMonthlyAveragesQuery,
    ComputeDepartmentMonthlyEmployeeWorkHoursQuery,
    ComputeDepartmentMonthlyEmployeeAttendanceQuery,
    ComputeDepartmentWeeklyTopEmployeesQuery,
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
 * QueryBus를 통해 Handler를 호출하며, 스냅샷 조회와 집계를 조합합니다.
 * (직원 목록 등은 각 핸들러가 필요 시 QueryBus로 다른 핸들러를 호출해 조회합니다.)
 */
@Injectable()
export class DashboardContextService {
    constructor(private readonly queryBus: QueryBus) {}

    /**
     * 부서별 월별 일평균 근무시간 조회 (1~12월 연간)
     * 1~12월 각각 스냅샷 child 조회 후 월별 일평균 계산 Handler로 조합합니다.
     */
    async 부서별월별일평균근무시간을조회한다(
        query: IGetDepartmentMonthlyAverageWorkHoursQuery,
    ): Promise<IGetDepartmentMonthlyAverageWorkHoursResponse> {
        const { departmentId, year } = query;
        const monthlySelections: Array<{ month: string; selectedChildren: any[] }> = [];

        for (let month = 1; month <= 12; month++) {
            const monthStr = month.toString().padStart(2, '0');
            const snapshotResult = await this.queryBus.execute(
                new GetDepartmentMonthlySnapshotChildrenQuery({ departmentId, year, month: monthStr }),
            );
            monthlySelections.push({
                month: monthStr,
                selectedChildren: snapshotResult.selectedChildren,
            });
        }

        return await this.queryBus.execute(
            new ComputeDepartmentMonthlyAveragesQuery({
                departmentId,
                year,
                monthlySelections,
            }),
        );
    }

    /**
     * 부서별 월별 직원별 근무시간 조회 (특정 연·월)
     * 해당 연·월 스냅샷 child 조회 후 직원별 근무시간 계산 Handler로 조합합니다.
     */
    async 부서별월별직원별근무시간을조회한다(
        query: IGetDepartmentMonthlyEmployeeWorkHoursQuery,
    ): Promise<IGetDepartmentMonthlyEmployeeWorkHoursResponse> {
        const { departmentId, year, month } = query;
        const snapshotResult = await this.queryBus.execute(
            new GetDepartmentMonthlySnapshotChildrenQuery({ departmentId, year, month }),
        );
        return await this.queryBus.execute(
            new ComputeDepartmentMonthlyEmployeeWorkHoursQuery({
                departmentId,
                year,
                month,
                selectedChildren: snapshotResult.selectedChildren,
            }),
        );
    }

    /**
     * 부서별 월별 직원별 근무내역 조회
     * 해당 연·월 스냅샷 child 조회 후 근무내역 계산 Handler로 조합합니다.
     */
    async 부서별월별직원별근무내역을조회한다(
        query: IGetDepartmentMonthlyEmployeeAttendanceQuery,
    ): Promise<IGetDepartmentMonthlyEmployeeAttendanceResponse> {
        const { departmentId, year, month } = query;
        const monthStr = month.padStart(2, '0');
        const snapshotResult = await this.queryBus.execute(
            new GetDepartmentMonthlySnapshotChildrenQuery({ departmentId, year, month: monthStr }),
        );
        return await this.queryBus.execute(
            new ComputeDepartmentMonthlyEmployeeAttendanceQuery({
                departmentId,
                year,
                month: monthStr,
                selectedChildren: snapshotResult.selectedChildren,
            }),
        );
    }

    /**
     * 부서별 월별 주차별 주간근무시간 상위 5명 조회
     * 해당 연·월 스냅샷 child 조회 후 주차별 상위 5명 계산 Handler로 조합합니다.
     */
    async 부서별월별주차별주간근무시간상위5명을조회한다(
        query: IGetDepartmentWeeklyTopEmployeesQuery,
    ): Promise<IGetDepartmentWeeklyTopEmployeesResponse> {
        const { departmentId, year, month } = query;
        const snapshotResult = await this.queryBus.execute(
            new GetDepartmentMonthlySnapshotChildrenQuery({ departmentId, year, month }),
        );
        return await this.queryBus.execute(
            new ComputeDepartmentWeeklyTopEmployeesQuery({
                departmentId,
                year,
                month,
                selectedChildren: snapshotResult.selectedChildren,
            }),
        );
    }

    /**
     * 부서별 연도, 월별 스냅샷 조회
     */
    async 부서별연도월별스냅샷을조회한다(
        query: IGetDepartmentSnapshotsQuery,
    ): Promise<IGetDepartmentSnapshotsResponse> {
        return await this.queryBus.execute(new GetDepartmentSnapshotsQuery(query));
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
