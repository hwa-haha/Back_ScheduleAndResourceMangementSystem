import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
    cleanupScenarioData,
    backupScenarioDataToFile,
    restoreScenarioDataFromFile,
    getLatestScenarioBackupFilePath,
    listScenarioBackupFiles,
    deleteScenarioBackupFile,
} from './cleanup-scenario-data';

/**
 * 시나리오 데이터 백업/삭제/복원 서비스
 *
 * domain.module.ts (48~79) 해당 테이블을 JSON 파일로 백업하거나, 삭제·복원한다.
 */
@Injectable()
export class ScenarioMigrationService {
    private readonly logger = new Logger(ScenarioMigrationService.name);

    constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

    /** 시나리오 데이터 삭제 */
    async 시나리오데이터를삭제한다(): Promise<void> {
        await cleanupScenarioData(this.dataSource);
        this.logger.log('✅ 시나리오 데이터 삭제 완료');
    }

    /** 시나리오 데이터를 JSON 파일로 백업 */
    async 시나리오데이터를백업한다(filePath?: string): Promise<{ filePath: string }> {
        const savedPath = await backupScenarioDataToFile(this.dataSource, filePath);
        this.logger.log(`✅ 시나리오 데이터 백업 완료: ${savedPath}`);
        return { filePath: savedPath };
    }

    /** backups 폴더에서 이름 기준 최신 백업 파일을 사용해 시나리오 데이터 복원 */
    async 시나리오데이터를복원한다(): Promise<void> {
        const filePath = getLatestScenarioBackupFilePath();
        await restoreScenarioDataFromFile(this.dataSource, filePath);
        this.logger.log(`✅ 시나리오 데이터 복원 완료: ${filePath}`);
    }

    /** backups 폴더의 시나리오 백업 파일 목록 조회 (이름 기준 최신순) */
    백업파일목록을조회한다(): string[] {
        return listScenarioBackupFiles();
    }

    /** backups 폴더에서 지정한 시나리오 백업 파일 삭제 */
    백업파일을삭제한다(fileName: string): void {
        deleteScenarioBackupFile(fileName);
        this.logger.log(`✅ 백업 파일 삭제 완료: ${fileName}`);
    }
}
