import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetDepartmentListQuery, GetDepartmentListWithEmployeesQuery } from './handlers/department/queries';
import { GetEmployeeIdsByNumbersQuery } from './handlers/employee/queries';
import {
    IGetDepartmentListQuery,
    IGetDepartmentListResponse,
    IGetDepartmentListWithEmployeesResponse,
    IGetEmployeeIdsByNumbersResponse,
} from './interfaces';

/**
 * 조직 관리 Context Service
 *
 * QueryBus를 통해 Handler를 호출하는 서비스 레이어입니다.
 */
@Injectable()
export class OrganizationManagementContextService {
    constructor(private readonly queryBus: QueryBus) {}

    /**
     * 부서 목록을 조회한다
     *
     * 요청받은 연월을 기준으로 해당 월에 유효했던 조직도 상태를 반환합니다.
     * 계층구조와 1차원 배열 두 가지 형태로 제공합니다.
     *
     * @param query 부서 목록 조회 쿼리
     * @returns 부서 목록 조회 결과
     */
    async 부서목록을조회한다(query: IGetDepartmentListQuery): Promise<IGetDepartmentListResponse> {
        const queryInstance = new GetDepartmentListQuery(query);
        return await this.queryBus.execute(queryInstance);
    }

    /**
     * 부서 목록과 부서별 소속 직원 정보를 조회한다 (시점 기준)
     *
     * 요청 연월을 기준으로 해당 시점에 유효했던 부서 목록과 각 부서별 소속 직원 목록을 반환합니다.
     */
    async 부서목록및부서별직원목록을조회한다(
        query: IGetDepartmentListQuery,
    ): Promise<IGetDepartmentListWithEmployeesResponse> {
        return await this.queryBus.execute(new GetDepartmentListWithEmployeesQuery(query));
    }

    async 직원번호목록을ID목록으로조회한다(employeeNumbers: string[]): Promise<string[]> {
        const queryInstance = new GetEmployeeIdsByNumbersQuery({ employeeNumbers });
        const result = await this.queryBus.execute(queryInstance);
        return result.employeeIds;
    }
}
