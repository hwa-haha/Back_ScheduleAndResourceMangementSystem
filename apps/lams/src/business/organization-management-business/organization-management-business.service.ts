import { Injectable, Logger } from '@nestjs/common';
import { OrganizationManagementContextService } from '../../context/organization-management-context/organization-management-context.service';
import {
    IGetDepartmentListQuery,
    IGetDepartmentListResponse,
    IGetDepartmentListWithEmployeesResponse,
} from '../../context/organization-management-context/interfaces';

/**
 * 조직 관리 비즈니스 서비스
 *
 * 조직 관리 관련 비즈니스 로직을 오케스트레이션합니다.
 */
@Injectable()
export class OrganizationManagementBusinessService {
    private readonly logger = new Logger(OrganizationManagementBusinessService.name);

    constructor(private readonly organizationManagementContextService: OrganizationManagementContextService) {}

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
        this.logger.log(`부서 목록 조회: year=${query.year}, month=${query.month}`);
        return await this.organizationManagementContextService.부서목록을조회한다(query);
    }

    /**
     * 부서 목록과 부서별 소속 직원 정보를 조회한다 (시점 기준)
     *
     * 요청 연월을 기준으로 해당 시점에 유효했던 부서 목록과 각 부서별 소속 직원 목록을 반환합니다.
     */
    async 부서목록및부서별직원목록을조회한다(
        query: IGetDepartmentListQuery,
    ): Promise<IGetDepartmentListWithEmployeesResponse> {
        this.logger.log(`부서 목록+부서별 직원 조회: year=${query.year}, month=${query.month}`);
        return await this.organizationManagementContextService.부서목록및부서별직원목록을조회한다(query);
    }
}
