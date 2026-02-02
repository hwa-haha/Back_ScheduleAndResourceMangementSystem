import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { GetEmployeeExtraInfoListQuery } from './get-employee-extra-info-list.query';
import {
    IGetEmployeeExtraInfoListResponse,
    IEmployeeWithExtraInfo,
} from '../../../interfaces/response/get-employee-extra-info-list-response.interface';
import { Employee, EmployeeStatus } from '@libs/modules/employee/employee.entity';
import { EmployeeDepartmentPosition } from '@libs/modules/employee-department-position/employee-department-position.entity';
import { EmployeeExtraInfo } from '../../../../../domain/employee-extra-info/employee-extra-info.entity';

/**
 * 직원 목록 및 추가정보 조회 Query Handler
 *
 * 모든 직원 목록을 조회하고, 각 직원의 추가정보(EmployeeExtraInfo)를 함께 반환합니다.
 */
@QueryHandler(GetEmployeeExtraInfoListQuery)
export class GetEmployeeExtraInfoListHandler implements IQueryHandler<
    GetEmployeeExtraInfoListQuery,
    IGetEmployeeExtraInfoListResponse
> {
    private readonly logger = new Logger(GetEmployeeExtraInfoListHandler.name);

    constructor(private readonly dataSource: DataSource) {}

    async execute(query: GetEmployeeExtraInfoListQuery): Promise<IGetEmployeeExtraInfoListResponse> {
        this.logger.log('직원 목록 및 추가정보 조회 시작');

        // 1. 현재 조직도에 재직 중인 직원 조회 (employee-department-position 기반, 퇴사자 제외)
        const employees = await this.dataSource.manager
            .createQueryBuilder(Employee, 'emp')
            .innerJoin(EmployeeDepartmentPosition, 'edp', 'edp.employeeId = emp.id')
            .where('emp.status = :status', { status: EmployeeStatus.Active })
            .distinct(true)
            .orderBy('emp.employeeNumber', 'ASC')
            .getMany();

        if (employees.length === 0) {
            this.logger.warn('조건에 맞는 직원이 없습니다.');
            return { employees: [], totalCount: 0 };
        }

        const employeeIds = employees.map((emp) => emp.id);

        // 2. 직원 ID 목록으로 추가정보 조회
        const allExtraInfos = await this.dataSource.manager
            .createQueryBuilder(EmployeeExtraInfo, 'eei')
            .where('eei.employee_id IN (:...employeeIds)', { employeeIds })
            .andWhere('eei.deleted_at IS NULL')
            .getMany();

        // 3. 직원 ID별 추가정보 맵 (1:1)
        const extraInfoByEmployeeId = new Map<string, (typeof allExtraInfos)[0]>();
        for (const eei of allExtraInfos) {
            extraInfoByEmployeeId.set(eei.employee_id, eei);
        }

        // 4. 직원 정보와 추가정보 결합
        const employeesWithExtraInfo: IEmployeeWithExtraInfo[] = employees.map((employee) => {
            const eei = extraInfoByEmployeeId.get(employee.id);
            const extraInfo =
                eei != null
                    ? {
                          id: eei.id,
                          employeeId: eei.employee_id,
                          isExcludedFromSummary: eei.is_excluded_from_summary,
                      }
                    : null;

            return {
                id: employee.id,
                employeeNumber: employee.employeeNumber,
                employeeName: employee.name,
                extraInfo,
            };
        });

        this.logger.log(`직원 목록 및 추가정보 조회 완료: totalCount=${employeesWithExtraInfo.length}`);

        return {
            employees: employeesWithExtraInfo,
            totalCount: employeesWithExtraInfo.length,
        };
    }
}
