import * as fs from 'fs';
import * as path from 'path';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { AttendanceType } from '../../domain/attendance-type/attendance-type.entity';
import { AttendanceIssue } from '../../domain/attendance-issue/attendance-issue.entity';
import { DailyEventSummary } from '../../domain/daily-event-summary/daily-event-summary.entity';
import { EventInfo } from '../../domain/event-info/event-info.entity';
import { HolidayInfo } from '../../domain/holiday-info/holiday-info.entity';
import { UsedAttendance } from '../../domain/used-attendance/used-attendance.entity';
import { MonthlyEventSummary } from '../../domain/monthly-event-summary/monthly-event-summary.entity';
import { WorkTimeOverride } from '../../domain/work-time-override/work-time-override.entity';
import { WageCalculationType } from '../../domain/wage-calculation-type/wage-calculation-type.entity';
import { DataSnapshotInfo } from '../../domain/data-snapshot-info/data-snapshot-info.entity';
import { DataSnapshotChild } from '../../domain/data-snapshot-child/data-snapshot-child.entity';
import { File } from '../../domain/file/file.entity';
import { FileContentReflectionHistory } from '../../domain/file-content-reflection-history/file-content-reflection-history.entity';
import { DailySummaryChangeHistory } from '../../domain/daily-summary-change-history/daily-summary-change-history.entity';
import { Project } from '../../domain/project/project.entity';
import { AssignedProject } from '../../domain/assigned-project/assigned-project.entity';
import { WorkHours } from '../../domain/work-hours/work-hours.entity';
import { EmployeeDepartmentPermission } from '../../domain/employee-department-permission/employee-department-permission.entity';
import { EmployeeDepartmentPermissionHistory } from '../../domain/employee-department-permission/employee-department-permission-history.entity';
import { EmployeeExtraInfo } from '../../domain/employee-extra-info/employee-extra-info.entity';

/**
 * domain.module.ts (48~79) 와 1:1 대응하는 엔티티 목록.
 * 삭제 시 자식 → 부모 순서, 복원 시 부모 → 자식 순서로 사용.
 */
const SCENARIO_ENTITIES_DELETE_ORDER: EntityTarget<ObjectLiteral>[] = [
    FileContentReflectionHistory,
    DataSnapshotChild,
    DataSnapshotInfo,
    DailySummaryChangeHistory,
    AttendanceIssue,
    DailyEventSummary,
    MonthlyEventSummary,
    EventInfo,
    UsedAttendance,

    File,
    WorkHours,
    AssignedProject,
    WorkTimeOverride,
    Project,
    // AttendanceType,
    // HolidayInfo,
    WageCalculationType,
    EmployeeDepartmentPermissionHistory,
    EmployeeDepartmentPermission,
    EmployeeExtraInfo,
];

/** 복원 시 INSERT 순서 (FK 부모가 먼저) */
const SCENARIO_ENTITIES_INSERT_ORDER = [...SCENARIO_ENTITIES_DELETE_ORDER].reverse();

/** 백업 파일 스키마 */
export interface ScenarioBackupPayload {
    version: number;
    exportedAt: string;
    tables: Record<string, ObjectLiteral[]>;
}

const BACKUP_VERSION = 1;

/**
 * 시나리오 백업 파일을 저장할 디렉터리.
 * - 소스 기준: apps/lams 또는 모노레포 루트에서 migration/backups 사용
 * - EC2 등 dist 전용 배포: migration 폴더가 없으면 cwd/scenario-backups 사용 (항상 전용 폴더)
 * 반환하는 경로가 없으면 생성한다.
 */
function getMigrationBackupDir(): string {
    const cwd = process.cwd();
    const dir = path.join(cwd, 'apps', 'lams', 'src', 'integrations', 'migration', 'backups');

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
}
const DEFAULT_BACKUP_DIR = getMigrationBackupDir();

/** backups 폴더에서 이름 기준 가장 최신 시나리오 백업 파일 경로를 반환한다. (scenario-backup-*.json) */
export function getLatestScenarioBackupFilePath(): string {
    const dir = getMigrationBackupDir();
    if (!fs.existsSync(dir)) {
        throw new Error(`백업 폴더가 없습니다: ${dir}`);
    }
    const files = fs.readdirSync(dir).filter((f) => f.startsWith('scenario-backup-') && f.endsWith('.json'));
    if (files.length === 0) {
        throw new Error(`백업 파일이 없습니다: ${dir}`);
    }
    files.sort((a, b) => b.localeCompare(a));
    return path.join(dir, files[0]);
}

/** backups 폴더의 시나리오 백업 파일 목록을 반환한다. (이름 기준 최신순) */
export function listScenarioBackupFiles(): string[] {
    const dir = getMigrationBackupDir();
    if (!fs.existsSync(dir)) {
        return [];
    }
    const files = fs.readdirSync(dir).filter((f) => f.startsWith('scenario-backup-') && f.endsWith('.json'));
    files.sort((a, b) => b.localeCompare(a));
    return files;
}

/** backups 폴더에서 지정한 시나리오 백업 파일을 삭제한다. (파일명만 허용, scenario-backup-*.json) */
export function deleteScenarioBackupFile(fileName: string): void {
    const baseName = path.basename(fileName);
    if (!baseName.startsWith('scenario-backup-') || !baseName.endsWith('.json')) {
        throw new Error('시나리오 백업 파일만 삭제할 수 있습니다. (scenario-backup-*.json)');
    }
    const dir = getMigrationBackupDir();
    const fullPath = path.join(dir, baseName);
    if (!path.resolve(fullPath).startsWith(path.resolve(dir))) {
        throw new Error('잘못된 파일 경로입니다.');
    }
    if (!fs.existsSync(fullPath)) {
        throw new Error(`백업 파일을 찾을 수 없습니다: ${baseName}`);
    }
    fs.unlinkSync(fullPath);
}

/**
 * 엔티티 인스턴스를 컬럼만 가진 plain object 배열로 변환 (관계 제외, 모든 컬럼 포함).
 * DataSnapshotChild만 parentSnapshot 등 FK 프로퍼티가 없어, 관계 객체(relation.id)에서 값을 채운다.
 */
function entitiesToPlainRows<T extends ObjectLiteral>(
    dataSource: DataSource,
    entityClass: EntityTarget<T>,
    rows: T[],
): ObjectLiteral[] {
    const repo = dataSource.getRepository(entityClass);
    const isDataSnapshotChild = entityClass === DataSnapshotChild;
    return rows.map((e) => {
        const plain: ObjectLiteral = {};
        const record = e as Record<string, unknown>;
        for (const col of repo.metadata.columns) {
            let val = record[col.propertyName];
            if (isDataSnapshotChild && val === undefined && col.relationMetadata) {
                const rel = record[col.relationMetadata.propertyName];
                if (rel && typeof rel === 'object' && 'id' in rel) {
                    val = (rel as { id: unknown }).id;
                }
            }
            if (val !== undefined) plain[col.propertyName] = val;
        }
        return plain;
    });
}

/**
 * 복원용 row에서 관계 컬럼은 FK(id)만 남긴다. DataSnapshotChild일 때만 관계 객체를 id로 치환해 INSERT가 FK에 연결되도록 한다.
 */
function rowToInsertValues<T extends ObjectLiteral>(
    dataSource: DataSource,
    entityClass: EntityTarget<T>,
    row: ObjectLiteral,
): ObjectLiteral {
    const repo = dataSource.getRepository(entityClass);
    const isDataSnapshotChild = entityClass === DataSnapshotChild;
    const out: ObjectLiteral = {};
    for (const col of repo.metadata.columns) {
        const key = col.propertyName;
        let val = row[key];
        if (isDataSnapshotChild && col.relationMetadata && val && typeof val === 'object' && 'id' in val) {
            val = (val as { id: unknown }).id;
        }
        if (val !== undefined) out[key] = val;
    }
    return out;
}

/**
 * 시나리오 테스트 후 생성 데이터 정리
 *
 * domain.module.ts (48~79) 에 해당하는 LAMS 전용·공유 도메인 테이블 전체를 삭제한다.
 */
export const cleanupScenarioData = async (dataSource: DataSource): Promise<void> => {
    for (const entity of SCENARIO_ENTITIES_DELETE_ORDER) {
        await dataSource.manager.createQueryBuilder().delete().from(entity).execute();
    }
};

/**
 * 시나리오 관련 테이블 데이터를 JSON 파일로 백업한다.
 * 복원 시 restoreScenarioDataFromFile 로 같은 파일을 사용하면 된다.
 *
 * @param dataSource TypeORM DataSource
 * @param filePath 저장할 파일 경로. 미지정 시 backups/scenario-backup-{YYYYMMDD-HHmmss}.json
 * @returns 저장된 파일의 절대 경로
 */
export const backupScenarioDataToFile = async (dataSource: DataSource, filePath?: string): Promise<string> => {
    const defaultFileName = `scenario-backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
    const resolvedPath = filePath
        ? path.isAbsolute(filePath)
            ? filePath
            : path.join(DEFAULT_BACKUP_DIR, path.basename(filePath))
        : path.join(DEFAULT_BACKUP_DIR, defaultFileName);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const w = fs.createWriteStream(resolvedPath, { encoding: 'utf-8' });
    w.write('{"version":' + BACKUP_VERSION + ',"exportedAt":"' + new Date().toISOString() + '","tables":{');

    const entityList = SCENARIO_ENTITIES_INSERT_ORDER;
    for (let i = 0; i < entityList.length; i++) {
        const entity = entityList[i];
        const repo = dataSource.getRepository(entity);
        const findOptions =
            entity === DataSnapshotChild ? { withDeleted: true, relations: ['parentSnapshot'] } : { withDeleted: true };
        const rows = await repo.find(findOptions);
        const entityName = repo.metadata.name;
        const plainRows = entitiesToPlainRows(dataSource, entity, rows as ObjectLiteral[]);
        const safeKey = JSON.stringify(entityName);
        w.write((i === 0 ? '' : ',') + safeKey + ':[');
        for (let j = 0; j < plainRows.length; j++) {
            w.write((j === 0 ? '' : ',') + JSON.stringify(plainRows[j]));
        }
        w.write(']');
    }

    w.write('}}');
    w.end();

    await new Promise<void>((resolve, reject) => {
        w.on('finish', resolve);
        w.on('error', reject);
    });

    return path.resolve(resolvedPath);
};

/**
 * 백업 파일에서 시나리오 데이터를 복원한다.
 * 단일 트랜잭션으로 삭제·INSERT를 수행하고, 배치 크기를 키워 성능을 높인다.
 *
 * @param dataSource TypeORM DataSource
 * @param filePath backupScenarioDataToFile 에서 저장한 JSON 파일 경로
 */
export const restoreScenarioDataFromFile = async (dataSource: DataSource, filePath: string): Promise<void> => {
    if (filePath == null || typeof filePath !== 'string' || filePath.trim() === '') {
        throw new Error('복원할 백업 파일 경로(filePath)가 필요합니다.');
    }
    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(DEFAULT_BACKUP_DIR, filePath);
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`백업 파일을 찾을 수 없습니다: ${resolvedPath}`);
    }

    const raw = fs.readFileSync(resolvedPath, 'utf-8');
    const payload = JSON.parse(raw) as ScenarioBackupPayload;
    if (payload.version !== BACKUP_VERSION || !payload.tables || typeof payload.tables !== 'object') {
        throw new Error(`지원하지 않는 백업 형식입니다. version=${payload.version}`);
    }

    /** 한 번에 INSERT할 행 수 (트랜잭션 + 큰 배치로 round-trip 감소) */
    const INSERT_BATCH_SIZE = 500;

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
        for (const entity of SCENARIO_ENTITIES_DELETE_ORDER) {
            await queryRunner.manager.createQueryBuilder().delete().from(entity).execute();
        }

        for (const entity of SCENARIO_ENTITIES_INSERT_ORDER) {
            const repo = queryRunner.manager.getRepository(entity);
            const entityName = repo.metadata.name;
            const rows = payload.tables[entityName];
            if (!Array.isArray(rows) || rows.length === 0) continue;

            for (let i = 0; i < rows.length; i += INSERT_BATCH_SIZE) {
                const chunk = rows.slice(i, i + INSERT_BATCH_SIZE);
                const batch = chunk.map((row) => rowToInsertValues(dataSource, entity, row));
                await repo.createQueryBuilder().insert().into(entity).values(batch).execute();
            }
        }
        await queryRunner.commitTransaction();
    } catch (e) {
        await queryRunner.rollbackTransaction();
        throw e;
    } finally {
        await queryRunner.release();
    }
};
