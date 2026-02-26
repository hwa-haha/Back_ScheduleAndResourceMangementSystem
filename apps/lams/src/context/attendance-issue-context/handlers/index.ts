import {
    GetAttendanceIssuesHandler,
    GetAttendanceIssuesToReviewHandler,
    GetAttendanceIssueHandler,
    GetAttendanceIssuesByDepartmentHandler,
} from './attendance-issue/queries';
import {
    CreateAttendanceIssuesHandler,
    UpdateAttendanceIssueDescriptionHandler,
    UpdateAttendanceIssueCorrectionHandler,
    ApplyAttendanceIssueHandler,
    RejectAttendanceIssueHandler,
    ReRequestAttendanceIssueHandler,
    ReRequestAttendanceIssuesHandler,
    RequestAttendanceIssueHandler,
    RequestAttendanceIssuesHandler,
} from './attendance-issue/commands';

export const QUERY_HANDLERS = [
    GetAttendanceIssuesHandler,
    GetAttendanceIssuesToReviewHandler,
    GetAttendanceIssueHandler,
    GetAttendanceIssuesByDepartmentHandler,
];

export const COMMAND_HANDLERS = [
    CreateAttendanceIssuesHandler,
    UpdateAttendanceIssueDescriptionHandler,
    UpdateAttendanceIssueCorrectionHandler,
    ApplyAttendanceIssueHandler,
    RejectAttendanceIssueHandler,
    ReRequestAttendanceIssueHandler,
    ReRequestAttendanceIssuesHandler,
    RequestAttendanceIssueHandler,
    RequestAttendanceIssuesHandler,
];
