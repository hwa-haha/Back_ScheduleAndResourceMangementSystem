import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../libs/decorators/public.decorator';
import { PrvDbMgrService } from './prv-db-mgr.service';

@ApiTags('prv-db-mgr')
@Controller('prv-db-mgr')
export class PrvDbMgrController {
    constructor(private readonly prvDbMgrService: PrvDbMgrService) {}

    @Public()
    @Get('test/snapshots')
    @ApiOperation({ summary: '스냅샷 데이터 조회 (테스트용)' })
    async 스냅샷데이터를조회한다() {
        return await this.prvDbMgrService.스냅샷데이터를조회한다();
    }

    @Public()
    @Post('migrate')
    @ApiOperation({ summary: 'PRV DB 마이그레이션 실행' })
    async 마이그레이션을실행한다(): Promise<{ message: string }> {
        await this.prvDbMgrService.마이그레이션을실행한다();
        return { message: 'PRV DB 마이그레이션 실행 완료' };
    }

    @Public()
    @Post('cleanup-scenarios')
    @ApiOperation({ summary: '시나리오 테스트 데이터 정리 (migration 모듈의 POST /migration/scenarios/cleanup 과 동일)' })
    async 시나리오데이터를정리한다(): Promise<{ message: string }> {
        await this.prvDbMgrService.시나리오데이터를정리한다();
        return { message: '시나리오 데이터 정리 완료' };
    }
}
