import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ComputeDepartmentMonthlyEmployeeAttendanceQuery } from './compute-department-monthly-employee-attendance.query';
import { IGetDepartmentMonthlyEmployeeAttendanceResponse } from '../../interfaces/response/get-department-monthly-employee-attendance-response.interface';
import { DomainUsedAttendanceService } from '../../../../domain/used-attendance/used-attendance.service';
import { startOfMonth, endOfMonth, format } from 'date-fns';

/**
 * 부서별 월별 직원별 근무내역 계산 Handler (선택된 child 기반)
 * 스냅샷에서 지각·결근, 근태사용내역에서 출장·연차를 집계합니다.
 */
@QueryHandler(ComputeDepartmentMonthlyEmployeeAttendanceQuery)
export class ComputeDepartmentMonthlyEmployeeAttendanceHandler implements IQueryHandler<
    ComputeDepartmentMonthlyEmployeeAttendanceQuery,
    IGetDepartmentMonthlyEmployeeAttendanceResponse
> {
    private readonly logger = new Logger(ComputeDepartmentMonthlyEmployeeAttendanceHandler.name);

    constructor(private readonly usedAttendanceService: DomainUsedAttendanceService) {}

    async execute(
        query: ComputeDepartmentMonthlyEmployeeAttendanceQuery,
    ): Promise<IGetDepartmentMonthlyEmployeeAttendanceResponse> {
        const { departmentId, year, month, selectedChildren } = query.data;
        const monthStr = month.padStart(2, '0');

        this.logger.log(
            `부서별 월별 직원별 근무내역 계산: departmentId=${departmentId}, year=${year}, month=${monthStr}`,
        );

        if (selectedChildren.length === 0) {
            return {
                departmentId,
                year,
                month: monthStr,
                employeeAttendances: [],
            };
        }

        const employeeIds = selectedChildren.map((c) => c.employee_id).filter((id) => id);
        const startDate = format(startOfMonth(new Date(`${year}-${monthStr}-01`)), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(new Date(`${year}-${monthStr}-01`)), 'yyyy-MM-dd');

        const usedAttendances = await this.usedAttendanceService.직원ID목록과날짜범위로조회한다(
            employeeIds,
            startDate,
            endDate,
        );

        const employeeAttendanceMap = new Map<
            string,
            {
                employeeId: string;
                employeeName: string;
                employeeNumber: string;
                attendanceUsage: {
                    businessTrip: number;
                    annualLeave: number;
                    absence: number;
                    late: number;
                    earlyLeave: number;
                };
            }
        >();

        selectedChildren.forEach((child) => {
            let late = 0;
            let absence = 0;
            let earlyLeave = 0;
            try {
                const snapshotData =
                    typeof child.snapshot_data === 'string' ? JSON.parse(child.snapshot_data) : child.snapshot_data;
                const attendanceTypeCount = snapshotData?.attendanceTypeCount || {};
                late = attendanceTypeCount['지각'] || 0;
                absence = attendanceTypeCount['결근'] || 0;
                earlyLeave = attendanceTypeCount['조퇴'] || 0;
            } catch {
                // 파싱 실패 시 0 유지
            }
            employeeAttendanceMap.set(child.employee_id, {
                employeeId: child.employee_id,
                employeeName: child.employee_name || '',
                employeeNumber: child.employee_number || '',
                attendanceUsage: {
                    businessTrip: 0,
                    annualLeave: 0,
                    absence,
                    late,
                    earlyLeave,
                },
            });
        });

        usedAttendances.forEach((ua) => {
            const employeeAttendance = employeeAttendanceMap.get(ua.employeeId);
            if (!employeeAttendance) return;

            const title = ua.attendanceType?.title || '';
            if (title === '출장') {
                employeeAttendance.attendanceUsage.businessTrip++;
            } else if (title === '연차' || title === '오전반차' || title === '오후반차') {
                employeeAttendance.attendanceUsage.annualLeave++;
            }
        });

        const employeeAttendances = Array.from(employeeAttendanceMap.values());

        return {
            departmentId,
            year,
            month: monthStr,
            employeeAttendances,
        };
    }
}
