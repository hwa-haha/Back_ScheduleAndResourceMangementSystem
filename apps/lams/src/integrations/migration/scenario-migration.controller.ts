import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiProperty, ApiPropertyOptional, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Public } from '../../../libs/decorators/public.decorator';
import { ScenarioMigrationService } from './scenario-migration.service';
import { ScenarioMigrationPortGuard } from './scenario-migration-port.guard';

/** 시나리오 백업 요청 (filePath 미지정 시 자동 경로 생성) */
class BackupScenarioDto {
    @ApiPropertyOptional({
        description: '저장할 파일 경로. 미지정 시 backups 폴더에 자동 생성',
        example: 'scenario-backup-2026-03-05T06-24-20.json',
    })
    @IsOptional()
    @IsString()
    filePath?: string;
}

/** 시나리오 백업 파일 삭제 요청 */
class DeleteBackupScenarioDto {
    @ApiProperty({
        description: '삭제할 백업 파일명',
        example: 'scenario-backup-2026-03-05T06-24-20.json',
    })
    @IsString()
    fileName!: string;
}

@ApiTags('migration')
@Controller('migration')
@UseGuards(ScenarioMigrationPortGuard)
export class ScenarioMigrationController {
    constructor(private readonly scenarioMigrationService: ScenarioMigrationService) {}

    @Public()
    @Post('scenarios/backup')
    @ApiOperation({ summary: '시나리오 데이터 백업' })
    @ApiBody({ type: BackupScenarioDto, required: false })
    @ApiResponse({ status: 201, description: '백업 완료', schema: { properties: { filePath: { type: 'string' } } } })
    async 시나리오데이터를백업한다(@Body() body?: BackupScenarioDto): Promise<{ filePath: string }> {
        return await this.scenarioMigrationService.시나리오데이터를백업한다(body?.filePath);
    }

    @Public()
    @Post('scenarios/cleanup')
    @ApiOperation({ summary: '시나리오 데이터 삭제' })
    @ApiResponse({ status: 200, description: '삭제 완료', schema: { properties: { message: { type: 'string' } } } })
    async 시나리오데이터를삭제한다(): Promise<{ message: string }> {
        await this.scenarioMigrationService.시나리오데이터를삭제한다();
        return { message: '시나리오 데이터 삭제 완료' };
    }

    @Public()
    @Post('scenarios/restore')
    @ApiOperation({ summary: '시나리오 데이터 복원 (backups 폴더에서 이름 기준 최신 파일 사용)' })
    @ApiResponse({ status: 200, description: '복원 완료', schema: { properties: { message: { type: 'string' } } } })
    async 시나리오데이터를복원한다(): Promise<{ message: string }> {
        await this.scenarioMigrationService.시나리오데이터를복원한다();
        return { message: '시나리오 데이터 복원 완료' };
    }

    @Public()
    @Get('scenarios/backups')
    @ApiOperation({ summary: 'backups 폴더의 시나리오 백업 파일 목록 조회 (이름 기준 최신순)' })
    @ApiResponse({
        status: 200,
        description: '백업 파일 목록',
        schema: { properties: { files: { type: 'array', items: { type: 'string' } } } },
    })
    백업파일목록을조회한다(): { files: string[] } {
        const files = this.scenarioMigrationService.백업파일목록을조회한다();
        return { files };
    }

    @Public()
    @Post('scenarios/backups/delete')
    @ApiOperation({ summary: 'backups 폴더에서 시나리오 백업 파일 삭제' })
    @ApiBody({ type: DeleteBackupScenarioDto })
    @ApiResponse({ status: 200, description: '삭제 완료', schema: { properties: { message: { type: 'string' } } } })
    백업파일을삭제한다(@Body() body: DeleteBackupScenarioDto): { message: string } {
        const fileName = body?.fileName?.trim();
        if (!fileName) {
            throw new BadRequestException('fileName은 필수입니다.');
        }
        this.scenarioMigrationService.백업파일을삭제한다(fileName);
        return { message: '백업 파일 삭제 완료' };
    }
}
