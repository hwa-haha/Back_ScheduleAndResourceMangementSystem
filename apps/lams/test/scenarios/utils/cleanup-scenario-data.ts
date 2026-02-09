import { DataSource } from 'typeorm';
import { File } from '../../../src/domain/file/file.entity';
import { FileContentReflectionHistory } from '../../../src/domain/file-content-reflection-history/file-content-reflection-history.entity';
import { EventInfo } from '../../../src/domain/event-info/event-info.entity';
import { UsedAttendance } from '../../../src/domain/used-attendance/used-attendance.entity';
import { DailyEventSummary } from '../../../src/domain/daily-event-summary/daily-event-summary.entity';
import { MonthlyEventSummary } from '../../../src/domain/monthly-event-summary/monthly-event-summary.entity';
import { AttendanceIssue } from '../../../src/domain/attendance-issue/attendance-issue.entity';
import { DailySummaryChangeHistory } from '../../../src/domain/daily-summary-change-history/daily-summary-change-history.entity';
import { DataSnapshotChild } from '../../../src/domain/data-snapshot-child/data-snapshot-child.entity';
import { DataSnapshotInfo } from '../../../src/domain/data-snapshot-info/data-snapshot-info.entity';
import { WorkTimeOverride } from '../../../src/domain/work-time-override/work-time-override.entity';

/**
 * 시나리오 테스트 후 생성 데이터 정리
 *
 * InitService에서 생성하는 데이터(근태유형/휴일/조직 데이터)는 제외합니다.
 */
export const cleanupScenarioData = async (dataSource: DataSource): Promise<void> => {
    await dataSource.manager.createQueryBuilder().delete().from(DataSnapshotChild).execute();
    await dataSource.manager.createQueryBuilder().delete().from(DataSnapshotInfo).execute();
    await dataSource.manager.createQueryBuilder().delete().from(DailySummaryChangeHistory).execute();
    await dataSource.manager.createQueryBuilder().delete().from(AttendanceIssue).execute();
    await dataSource.manager.createQueryBuilder().delete().from(DailyEventSummary).execute();
    await dataSource.manager.createQueryBuilder().delete().from(MonthlyEventSummary).execute();
    await dataSource.manager.createQueryBuilder().delete().from(EventInfo).execute();
    await dataSource.manager.createQueryBuilder().delete().from(UsedAttendance).execute();
    await dataSource.manager.createQueryBuilder().delete().from(FileContentReflectionHistory).execute();
    // await dataSource.manager.createQueryBuilder().delete().from(File).execute();
    // await dataSource.manager.createQueryBuilder().delete().from(WorkTimeOverride).execute();
};
