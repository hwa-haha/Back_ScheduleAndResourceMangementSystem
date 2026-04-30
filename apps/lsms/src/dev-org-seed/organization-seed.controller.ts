import { Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../libs/decorators/public.decorator';
import { OrganizationSeedResponseDto } from './dtos/organization-seed-response.dto';
import { OrganizationSeedService } from './organization-seed.service';

@ApiTags('Dev · 조직 시드')
@Controller('v1/dev/organization-seed')
export class OrganizationSeedController {
    constructor(private readonly organizationSeedService: OrganizationSeedService) {}

    @Public()
    @Post()
    @ApiOperation({
        summary: '조직 연관 시드 데이터 삽입',
        description:
            '직급(ranks)·직책(positions)·부서(departments)·직원(employees)·직원-부서-직책(employee_department_positions) 샘플 행을 삽입합니다. 이미 동일 ID가 있으면 건너뜁니다.\n\n' +
            '활성 조건: ORG_SEED_ENDPOINT_ENABLED=true 이거나 NODE_ENV가 local 또는 development. ORG_SEED_ENDPOINT_ENABLED=false 는 비활성. process.env 를 우선으로 읽습니다.',
    })
    @ApiOkResponse({ type: OrganizationSeedResponseDto })
    async 조직시드데이터를삽입한다(): Promise<OrganizationSeedResponseDto> {
        return this.organizationSeedService.조직연관시드데이터를삽입한다();
    }
}
