export * from './queries';
export * from './commands';

import { GetReviewersByDepartmentHandler } from './queries/get-reviewers-by-department.handler';
import { GetSnapshotContentForApprovalHandler } from './queries/get-snapshot-content-for-approval.handler';
import { UpdateSnapshotApprovalHandler } from './commands/update-snapshot-approval.handler';

export const QUERY_HANDLERS = [GetReviewersByDepartmentHandler, GetSnapshotContentForApprovalHandler];
export const COMMAND_HANDLERS = [UpdateSnapshotApprovalHandler];
