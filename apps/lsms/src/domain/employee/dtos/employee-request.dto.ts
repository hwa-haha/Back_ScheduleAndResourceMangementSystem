import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EmployeeRequestDto {
    @ApiPropertyOptional({
        description: '직원 ID로 조회',
        example: 'emp123',
    })
    @IsString()
    @IsOptional()
    employeeId?: string;

    @ApiPropertyOptional({
        description: '사번으로 조회',
        example: 'E2023001',
    })
    @IsString()
    @IsOptional()
    employeeNumber?: string;

    @ApiPropertyOptional({
        description: '상세 정보 포함 여부 (부서, 직책, 직급의 상세 정보)',
        example: true,
        type: Boolean,
    })
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    @IsOptional()
    withDetail?: boolean;
}
