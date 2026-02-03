export * from './queries';

// Handler 배열 export (Module 등록용)
import { GetDepartmentListHandler, GetDepartmentListWithEmployeesHandler } from './queries';

export const QUERY_HANDLERS = [GetDepartmentListHandler, GetDepartmentListWithEmployeesHandler];
