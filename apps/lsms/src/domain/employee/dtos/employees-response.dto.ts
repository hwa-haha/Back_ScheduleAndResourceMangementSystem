import { ApiProperty } from '@nestjs/swagger';
import { EmployeeResponseDto } from './employee-response.dto';

export class EmployeesResponseDto {
    @ApiProperty({
        description: '직원 목록',
        type: [EmployeeResponseDto],
    })
    employees: EmployeeResponseDto[];

    @ApiProperty({
        description: '총 직원 수',
    })
    total: number;
}
