// Command 클래스 export
export * from './generate-daily-summaries.command';
export * from './generate-monthly-summaries.command';
export * from './update-daily-summary.command';
export * from './update-monthly-summary-note.command';
export * from './update-monthly-summary-for-employee.command';
export * from './soft-delete-daily-summaries.command';
export * from './soft-delete-monthly-summaries.command';
export * from './restore-daily-summaries-from-snapshot.command';
export * from './restore-monthly-summaries-from-snapshot.command';
export * from './re-judge-daily-summary.command';

// Handler 클래스 export
export * from './generate-daily-summaries.handler';
export * from './generate-monthly-summaries.handler';
export * from './update-daily-summary.handler';
export * from './update-monthly-summary-note.handler';
export * from './update-monthly-summary-for-employee.handler';
export * from './soft-delete-daily-summaries.handler';
export * from './soft-delete-monthly-summaries.handler';
export * from './restore-daily-summaries-from-snapshot.handler';
export * from './restore-monthly-summaries-from-snapshot.handler';
export * from './re-judge-daily-summary.handler';

// Handler 배열 export (Module 등록용)
import { GenerateDailySummariesHandler } from './generate-daily-summaries.handler';
import { GenerateMonthlySummariesHandler } from './generate-monthly-summaries.handler';
import { UpdateDailySummaryHandler } from './update-daily-summary.handler';
import { UpdateMonthlySummaryNoteHandler } from './update-monthly-summary-note.handler';
import { UpdateMonthlySummaryForEmployeeHandler } from './update-monthly-summary-for-employee.handler';
import { SoftDeleteDailySummariesHandler } from './soft-delete-daily-summaries.handler';
import { SoftDeleteMonthlySummariesHandler } from './soft-delete-monthly-summaries.handler';
import { RestoreDailySummariesFromSnapshotHandler } from './restore-daily-summaries-from-snapshot.handler';
import { RestoreMonthlySummariesFromSnapshotHandler } from './restore-monthly-summaries-from-snapshot.handler';
import { ReJudgeDailySummaryHandler } from './re-judge-daily-summary.handler';

export const ATTENDANCE_DATA_COMMAND_HANDLERS = [
    GenerateDailySummariesHandler,
    GenerateMonthlySummariesHandler,
    UpdateDailySummaryHandler,
    UpdateMonthlySummaryNoteHandler,
    UpdateMonthlySummaryForEmployeeHandler,
    SoftDeleteDailySummariesHandler,
    SoftDeleteMonthlySummariesHandler,
    RestoreDailySummariesFromSnapshotHandler,
    RestoreMonthlySummariesFromSnapshotHandler,
    ReJudgeDailySummaryHandler,
];
