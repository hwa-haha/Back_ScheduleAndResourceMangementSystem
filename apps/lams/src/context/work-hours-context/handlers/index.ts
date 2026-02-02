export * from './monthly-work-hours/queries/get-monthly-work-hours.handler';
export * from './project/queries/get-project-list.handler';
export * from './employee-assignments/queries/get-employee-with-assigned-projects.handler';
export * from './assigned-project/commands/replace-project-assignments.handler';
export * from './work-hours/commands/create-work-hours.handler';
export * from './work-hours/commands/delete-work-hours-by-date.handler';

import { GetMonthlyWorkHoursHandler } from './monthly-work-hours/queries/get-monthly-work-hours.handler';
import { GetProjectListHandler } from './project/queries/get-project-list.handler';
import { GetEmployeeWithAssignedProjectsHandler } from './employee-assignments/queries/get-employee-with-assigned-projects.handler';
import { ReplaceProjectAssignmentsHandler } from './assigned-project/commands/replace-project-assignments.handler';
import { CreateWorkHoursHandler } from './work-hours/commands/create-work-hours.handler';
import { DeleteWorkHoursByDateHandler } from './work-hours/commands/delete-work-hours-by-date.handler';

export const QUERY_HANDLERS = [
    GetMonthlyWorkHoursHandler,
    GetProjectListHandler,
    GetEmployeeWithAssignedProjectsHandler,
];

export const COMMAND_HANDLERS = [
    ReplaceProjectAssignmentsHandler,
    CreateWorkHoursHandler,
    DeleteWorkHoursByDateHandler,
];
