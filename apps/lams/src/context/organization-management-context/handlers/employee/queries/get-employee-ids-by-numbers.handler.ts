import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger, BadRequestException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { GetEmployeeIdsByNumbersQuery } from './get-employee-ids-by-numbers.query';
import { IGetEmployeeIdsByNumbersResponse } from '../../../interfaces';
import { Employee } from '@libs/modules/employee/employee.entity';

/**
 * 직원 번호 목록으로 직원 ID 목록 조회 Query Handler
 */
@QueryHandler(GetEmployeeIdsByNumbersQuery)
export class GetEmployeeIdsByNumbersHandler implements IQueryHandler<
    GetEmployeeIdsByNumbersQuery,
    IGetEmployeeIdsByNumbersResponse
> {
    private readonly logger = new Logger(GetEmployeeIdsByNumbersHandler.name);

    constructor(private readonly dataSource: DataSource) {}

    async execute(query: GetEmployeeIdsByNumbersQuery): Promise<IGetEmployeeIdsByNumbersResponse> {
        const { employeeNumbers } = query.data;

        const normalizedNumbers = employeeNumbers.map((number) => number.trim()).filter((number) => number.length > 0);
        const uniqueNumbers = Array.from(new Set(normalizedNumbers));
        if (uniqueNumbers.length === 0) {
            throw new BadRequestException('직원 번호 목록이 비어 있습니다.');
        }

        const repository = this.dataSource.getRepository(Employee);
        const employees = await repository.find({
            where: { employeeNumber: In(uniqueNumbers) },
        });

        const employeeIdByNumber = new Map<string, string>();
        employees.forEach((employee) => {
            if (employee.employeeNumber && employee.id) {
                employeeIdByNumber.set(employee.employeeNumber, employee.id);
            }
        });

        const missingNumbers = uniqueNumbers.filter((number) => !employeeIdByNumber.has(number));
        if (missingNumbers.length > 0) {
            this.logger.warn(`직원 번호 조회 실패: ${missingNumbers.join(', ')}`);
            // throw new BadRequestException(`직원 번호를 찾을 수 없습니다: ${missingNumbers.join(', ')}`);
        }

        const employeeIds = uniqueNumbers
            .map((number) => employeeIdByNumber.get(number))
            .filter((id): id is string => Boolean(id));

        return { employeeIds };
    }
}
