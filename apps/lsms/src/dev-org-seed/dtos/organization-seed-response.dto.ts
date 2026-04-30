import { ApiProperty } from '@nestjs/swagger';

export class OrganizationSeedInsertedCountsDto {
    @ApiProperty({ example: 3 })
    ranks: number;

    @ApiProperty({ example: 3 })
    positions: number;

    @ApiProperty({ example: 4 })
    departments: number;

    @ApiProperty({ example: 3 })
    employees: number;

    @ApiProperty({ example: 3 })
    employeeDepartmentPositions: number;
}

export class OrganizationSeedResponseDto {
    @ApiProperty({ example: '조직 연관 시드 데이터 삽입이 완료되었습니다.' })
    message: string;

    @ApiProperty({ type: OrganizationSeedInsertedCountsDto })
    inserted: OrganizationSeedInsertedCountsDto;
}
