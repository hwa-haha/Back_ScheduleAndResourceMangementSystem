export * from './data-snapshot';

// Handler 배열 export (Module 등록용)
import { SaveCompanyMonthlySnapshotHandler } from './data-snapshot/commands';
import {
    GetSnapshotListHandler,
    GetSnapshotListBySubmittedYearMonthHandler,
    GetSnapshotListWithDepartmentChildrenHandler,
    GetSnapshotByIdHandler,
    CheckEmployeeSnapshotExistsHandler,
} from './data-snapshot/queries';

export const COMMAND_HANDLERS = [SaveCompanyMonthlySnapshotHandler];

export const QUERY_HANDLERS = [
    GetSnapshotListHandler,
    GetSnapshotListBySubmittedYearMonthHandler,
    GetSnapshotListWithDepartmentChildrenHandler,
    GetSnapshotByIdHandler,
    CheckEmployeeSnapshotExistsHandler,
];
