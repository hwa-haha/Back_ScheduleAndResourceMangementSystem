import { GetDepartmentMonthlySnapshotChildrenHandler } from './queries/get-department-monthly-snapshot-children.handler';
import { ComputeDepartmentMonthlyAveragesHandler } from './queries/compute-department-monthly-averages.handler';
import { ComputeDepartmentMonthlyEmployeeWorkHoursHandler } from './queries/compute-department-monthly-employee-work-hours.handler';
import { ComputeDepartmentMonthlyEmployeeAttendanceHandler } from './queries/compute-department-monthly-employee-attendance.handler';
import { ComputeDepartmentWeeklyTopEmployeesHandler } from './queries/compute-department-weekly-top-employees.handler';
import { GetDepartmentSnapshotsHandler } from './queries/get-department-snapshots.handler';
import { GetEmployeeAttendanceDetailHandler } from './queries/get-employee-attendance-detail.handler';

export const QUERY_HANDLERS = [
    GetDepartmentMonthlySnapshotChildrenHandler,
    ComputeDepartmentMonthlyAveragesHandler,
    ComputeDepartmentMonthlyEmployeeWorkHoursHandler,
    ComputeDepartmentMonthlyEmployeeAttendanceHandler,
    ComputeDepartmentWeeklyTopEmployeesHandler,
    GetDepartmentSnapshotsHandler,
    GetEmployeeAttendanceDetailHandler,
];

export * from './queries';
