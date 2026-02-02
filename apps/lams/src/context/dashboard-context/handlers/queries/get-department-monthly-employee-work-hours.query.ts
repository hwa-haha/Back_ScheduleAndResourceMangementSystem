import { IQuery } from '@nestjs/cqrs';
import { IGetDepartmentMonthlyEmployeeWorkHoursQuery } from '../../interfaces';

/**
 * 부서별 월별 직원별 근무시간 조회 쿼리
 */
export class GetDepartmentMonthlyEmployeeWorkHoursQuery implements IQuery {
    constructor(public readonly data: IGetDepartmentMonthlyEmployeeWorkHoursQuery) {}
}
