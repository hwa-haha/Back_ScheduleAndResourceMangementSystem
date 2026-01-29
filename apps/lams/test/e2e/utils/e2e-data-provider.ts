import { DataSource, IsNull, In } from 'typeorm';
import { EmployeeDepartmentPositionHistory } from '@libs/modules/employee-department-position-history/employee-department-position-history.entity';
import { Employee } from '@libs/modules/employee/employee.entity';
import { DailyEventSummary } from '../../../src/domain/daily-event-summary/daily-event-summary.entity';
import { MonthlyEventSummary } from '../../../src/domain/monthly-event-summary/monthly-event-summary.entity';
import { DataSnapshotInfo } from '../../../src/domain/data-snapshot-info/data-snapshot-info.entity';
import { File } from '../../../src/domain/file/file.entity';
import { FileContentReflectionHistory } from '../../../src/domain/file-content-reflection-history/file-content-reflection-history.entity';
import { AttendanceIssue } from '../../../src/domain/attendance-issue/attendance-issue.entity';
import { Project } from '../../../src/domain/project/project.entity';
import { AssignedProject } from '../../../src/domain/assigned-project/assigned-project.entity';
import { HolidayInfo } from '../../../src/domain/holiday-info/holiday-info.entity';
import { WorkTimeOverride } from '../../../src/domain/work-time-override/work-time-override.entity';
import { AttendanceType } from '../../../src/domain/attendance-type/attendance-type.entity';

export const TEST_DEPARTMENT_ID = 'd2860a56-99e0-4e79-b70e-0461eef212ac';

export interface E2EDataIds {
    departmentId: string;
    employeeIds: string[];
    employeeNumbers: string[];
    year: string;
    month: string;
    yyyymm: string;
    /** 일간 요약 ID (연·월·부서 기준 1건) */
    dailySummaryId: string | null;
    /** 월간 요약 ID (연·월·부서 기준 1건) */
    monthlySummaryId: string | null;
    /** 스냅샷 ID (연·월 기준 1건) */
    snapshotId: string | null;
    /** 파일 ID 1건 */
    fileId: string | null;
    /** 반영 이력 ID 1건 */
    reflectionHistoryId: string | null;
    /** 근태 이슈 ID 1건 */
    attendanceIssueId: string | null;
    /** 프로젝트 ID 1건 */
    projectId: string | null;
    /** 할당된 프로젝트 ID 1건 */
    assignedProjectId: string | null;
    /** 휴일 ID 1건 */
    holidayId: string | null;
    /** 특별근태시간 ID 1건 */
    workTimeOverrideId: string | null;
    /** 근태유형 ID 1건 */
    attendanceTypeId: string | null;
}

const DEFAULT_YEAR = '2026';
const DEFAULT_MONTH = '01';

/**
 * e2e 테스트에서 API 호출에 필요한 엔티티 ID들을 도메인(DB) 조회로 준비한다.
 * 각 엔드포인트에서 필요한 id(및 대표값)를 한 번에 조회해 반환한다.
 */
export async function e2e데이터ID를준비한다(
    dataSource: DataSource,
    options: { departmentId?: string; year?: string; month?: string } = {},
): Promise<E2EDataIds> {
    const departmentId = options.departmentId ?? TEST_DEPARTMENT_ID;
    const year = options.year ?? DEFAULT_YEAR;
    const month = options.month ?? DEFAULT_MONTH;
    const yyyymm = `${year}-${month.padStart(2, '0')}`;

    const repo = dataSource.manager;

    const histories = await repo.find(EmployeeDepartmentPositionHistory, {
        where: { departmentId, isCurrent: true },
        relations: ['employee'],
    });
    const employeeIds = histories.map((h) => h.employee?.id).filter((id): id is string => !!id);
    const employeeNumbers: string[] = [];
    if (employeeIds.length > 0) {
        const employees = await repo.find(Employee, { where: { id: In(employeeIds) } });
        employeeNumbers.push(...employees.map((e) => e.employeeNumber));
    }

    let dailySummaryId: string | null = null;
    let monthlySummaryId: string | null = null;
    if (employeeIds.length > 0) {
        const monthly = await repo.findOne(MonthlyEventSummary, {
            where: { employee_id: employeeIds[0], yyyymm }, // property name from entity
        });
        if (monthly) {
            monthlySummaryId = monthly.id;
            const daily = await repo.findOne(DailyEventSummary, {
                where: { monthly_event_summary_id: monthly.id, deleted_at: IsNull() },
            });
            if (daily) dailySummaryId = daily.id;
        }
    }

    const snapshot = await repo.findOne(DataSnapshotInfo, {
        where: { yyyy: year, mm: month, deleted_at: IsNull() },
    });
    const snapshotId = snapshot?.id ?? null;

    const file = await repo.findOne(File, {
        where: { year, month, deleted_at: IsNull() },
    });
    const fileId = file?.id ?? null;

    let reflectionHistoryId: string | null = null;
    if (fileId) {
        const refHist = await repo.findOne(FileContentReflectionHistory, {
            where: { file_id: fileId, deleted_at: IsNull() },
        });
        reflectionHistoryId = refHist?.id ?? null;
    }

    const issue = await repo.findOne(AttendanceIssue, {
        where: { deleted_at: IsNull() },
    });
    const attendanceIssueId = issue?.id ?? null;

    const project = await repo.findOne(Project, {
        where: { deleted_at: IsNull() },
    });
    const projectId = project?.id ?? null;

    let assignedProjectId: string | null = null;
    if (employeeIds.length > 0 && projectId) {
        const ap = await repo.findOne(AssignedProject, {
            where: { employee_id: employeeIds[0], project_id: projectId, deleted_at: IsNull() },
        });
        assignedProjectId = ap?.id ?? null;
    }

    const holiday = await repo.findOne(HolidayInfo, {
        where: { deleted_at: IsNull() },
    });
    const holidayId = holiday?.id ?? null;

    const wto = await repo.findOne(WorkTimeOverride, {
        where: { deleted_at: IsNull() },
    });
    const workTimeOverrideId = wto?.id ?? null;

    const attType = await repo.findOne(AttendanceType, {
        where: { deleted_at: IsNull() },
    });
    const attendanceTypeId = attType?.id ?? null;

    return {
        departmentId,
        employeeIds,
        employeeNumbers,
        year,
        month,
        yyyymm,
        dailySummaryId,
        monthlySummaryId,
        snapshotId,
        fileId,
        reflectionHistoryId,
        attendanceIssueId,
        projectId,
        assignedProjectId,
        holidayId,
        workTimeOverrideId,
        attendanceTypeId,
    };
}
