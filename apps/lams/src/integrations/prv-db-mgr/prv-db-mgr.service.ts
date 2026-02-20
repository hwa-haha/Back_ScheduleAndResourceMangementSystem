import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { EntityList } from './entities';
import { AttendanceType } from '../../domain/attendance-type/attendance-type.entity';
import { EventInfo } from '../../domain/event-info/event-info.entity';
import { UsedAttendance } from '../../domain/used-attendance/used-attendance.entity';
import { DailyEventSummary } from '../../domain/daily-event-summary/daily-event-summary.entity';
import { MonthlyEventSummary } from '../../domain/monthly-event-summary/monthly-event-summary.entity';
import { DataSnapshotInfo } from '../../domain/data-snapshot-info/data-snapshot-info.entity';
import { DataSnapshotChild } from '../../domain/data-snapshot-child/data-snapshot-child.entity';
import { Employee } from '@libs/modules/employee/employee.entity';
import { Department } from '@libs/modules/department/department.entity';
import { HolidayInfo } from '../../domain/holiday-info/holiday-info.entity';
import { EventInfoEntity as PrvEventInfoEntity } from './entities/event-info.entity';
import { UsedAttendanceEntity as PrvUsedAttendanceEntity } from './entities/used-attendance.entity';
import { MonthlyEmployeeAttendanceInfoEntity as PrvMonthlySummaryEntity } from './entities/monthly-event-summary.entity';
import { DataSnapshotInfoEntity as PrvDataSnapshotInfoEntity } from './entities/data-snapshot-info.entity';
import { DataSnapshotChildInfoEntity as PrvDataSnapshotChildInfoEntity } from './entities/data-snapshot-child.entity';
import { DataSnapshotApprovalRequestInfoEntity as PrvDataSnapshotApprovalRequestInfoEntity } from './entities/approval/data-snapshot-approval-request-info.entity';
import { cleanupScenarioData } from '../../../test/scenarios/utils/cleanup-scenario-data';
import { ApprovalStatus } from '../../domain/data-snapshot-info/data-snapshot-info.types';

@Injectable()
export class PrvDbMgrService implements OnModuleInit {
    private readonly logger = new Logger(PrvDbMgrService.name);

    constructor(
        @InjectDataSource('prv') private readonly prvDataSource: DataSource,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {}

    async onModuleInit(): Promise<void> {
        await this.연결을확인한다();
    }

    async 연결을확인한다(): Promise<void> {
        await this.prvDataSource.query('SELECT 1');
        this.logger.log('✅ 라이브 DB 연결 확인 완료');
    }

    /**
     * 스냅샷 데이터만 조회한다 (테스트용)
     *
     * PRV DB에서 data_snapshot_info, data_snapshot_child, 결재요청 정보를 relation 과 함께 조회하고,
     * yyyy-mm으로 그룹핑하여 스냅샷별로 children와 결재요청 정보를 매핑합니다.
     */
    async 스냅샷데이터를조회한다(): Promise<{
        employeesByYearMonthAndDepartment: Record<
            string,
            Record<string, Array<{ employeeName: string; employeeNumber: string }>>
        >;
    }> {
        const prvSnapshots = await this.prvDataSource
            .getRepository(PrvDataSnapshotInfoEntity)
            .find({ relations: ['department'] });
        const prvChildren = await this.prvDataSource
            .getRepository(PrvDataSnapshotChildInfoEntity)
            .find({ relations: ['parentSnapshot'] });

        const approvalRequests = await this.prvDataSource
            .getRepository(PrvDataSnapshotApprovalRequestInfoEntity)
            .find({ relations: ['dataSnapshot', 'steps', 'steps.approver'] });

        // 스냅샷별로 자식들을 그룹화
        const childrenBySnapshotId = new Map<string, PrvDataSnapshotChildInfoEntity[]>();
        prvChildren.forEach((child) => {
            const snapshotId = child.parentSnapshot?.dataSnapshotId;
            if (!snapshotId) {
                return;
            }
            if (!childrenBySnapshotId.has(snapshotId)) {
                childrenBySnapshotId.set(snapshotId, []);
            }
            childrenBySnapshotId.get(snapshotId)!.push(child);
        });

        // 스냅샷별로 결재요청 정보 매핑
        const approvalBySnapshotId = new Map<
            string,
            {
                requestId: string;
                requestTitle: string;
                requestContent: string;
                status: string;
                submittedAt: Date | null;
                approverName: string | null;
                approvalStatus: string | null;
            }
        >();

        approvalRequests.forEach((request) => {
            const snapshotId = request.dataSnapshot?.dataSnapshotId;
            if (!snapshotId) {
                return;
            }
            const steps = request.steps ?? [];
            const sortedSteps = steps.slice().sort((a, b) => a.stepOrder - b.stepOrder);
            const lastStep = sortedSteps[sortedSteps.length - 1];
            approvalBySnapshotId.set(snapshotId, {
                requestId: request.requestId,
                requestTitle: request.requestTitle,
                requestContent: request.requestContent,
                status: request.status,
                submittedAt: request.createdAt ?? null,
                approverName: lastStep?.approver?.username ?? null,
                approvalStatus: lastStep?.status ?? null,
            });
        });

        // 스냅샷별로 children와 결재요청 정보 매핑
        const snapshotsWithDetails = prvSnapshots
            .map((snapshot) => ({
                snapshot,
                children: childrenBySnapshotId.get(snapshot.dataSnapshotId) ?? [],
                approvalRequest: approvalBySnapshotId.get(snapshot.dataSnapshotId) ?? null,
            }))
            .filter((snapshot) => snapshot.approvalRequest);

        // yyyy-mm으로 그룹핑
        const groupedByYearMonth = new Map<
            string,
            Array<{
                snapshot: PrvDataSnapshotInfoEntity;
                children: PrvDataSnapshotChildInfoEntity[];
                approvalRequest: {
                    requestId: string;
                    requestTitle: string;
                    requestContent: string;
                    status: string;
                    submittedAt: Date | null;
                    approverName: string | null;
                    approvalStatus: string | null;
                } | null;
            }>
        >();

        snapshotsWithDetails.forEach((item) => {
            const key = `${item.snapshot.yyyy}-${item.snapshot.mm}`;
            if (!groupedByYearMonth.has(key)) {
                groupedByYearMonth.set(key, []);
            }
            groupedByYearMonth.get(key)!.push(item);
        });

        // 배열 형태로 변환 (yyyy-mm 순서대로 정렬)
        const result = Array.from(groupedByYearMonth.entries())
            .map(([key, snapshots]) => {
                const [year, month] = key.split('-');
                return {
                    year,
                    month,
                    snapshots,
                };
            })
            .sort((a, b) => {
                const yearCompare = a.year.localeCompare(b.year);
                if (yearCompare !== 0) return yearCompare;
                return a.month.localeCompare(b.month);
            });

        const departments = await this.부서코드매핑을생성한다();
        // console.log(departments);

        // 날짜-부서-부서원 계층 구조화 (조직도 변화 추적용)
        const employeesByYearMonthAndDepartment: Record<
            string,
            Record<string, Array<{ employeeName: string; employeeNumber: string }>>
        > = {};

        result.forEach((group) => {
            const yearMonthKey = `${group.year}-${group.month}`;

            if (!employeesByYearMonthAndDepartment[yearMonthKey]) {
                employeesByYearMonthAndDepartment[yearMonthKey] = {};
            }

            group.snapshots.forEach((item) => {
                const departmentName = item.approvalRequest?.requestTitle.split(' ')[0];
                if (!departmentName) {
                    return;
                }

                if (!employeesByYearMonthAndDepartment[yearMonthKey][departmentName]) {
                    employeesByYearMonthAndDepartment[yearMonthKey][departmentName] = [];
                }

                // 해당 스냅샷의 children에서 직원 정보 추출
                item.children.forEach((child) => {
                    const employeeInfo = {
                        employeeName: child.employeeName,
                        employeeNumber: child.employeeNumber,
                    };

                    // 해당 연월의 해당 부서에서 중복 제거 (employeeNumber 기준)
                    const exists = employeesByYearMonthAndDepartment[yearMonthKey][departmentName].some(
                        (emp) => emp.employeeNumber === employeeInfo.employeeNumber,
                    );
                    if (!exists) {
                        employeesByYearMonthAndDepartment[yearMonthKey][departmentName].push(employeeInfo);
                    }
                });
            });
        });

        // 각 연월별, 각 부서별 직원 목록 정렬 (사번 기준)
        Object.keys(employeesByYearMonthAndDepartment).forEach((yearMonth) => {
            Object.keys(employeesByYearMonthAndDepartment[yearMonth]).forEach((deptName) => {
                employeesByYearMonthAndDepartment[yearMonth][deptName].sort((a, b) =>
                    a.employeeNumber.localeCompare(b.employeeNumber),
                );
            });
        });

        // 2025-01의 부서 구성을 2025-02와 동일하게 맞추기
        const jan2025Key = '2025-01';
        const feb2025Key = '2025-02';

        if (employeesByYearMonthAndDepartment[jan2025Key] && employeesByYearMonthAndDepartment[feb2025Key]) {
            // 2025-02의 부서 구조를 기준으로 가져오기
            const feb2025Departments = Object.keys(employeesByYearMonthAndDepartment[feb2025Key]);
            const feb2025EmployeesByDept = new Map<string, Set<string>>();
            Object.keys(employeesByYearMonthAndDepartment[feb2025Key]).forEach((deptName) => {
                const employeeNumbers = new Set(
                    employeesByYearMonthAndDepartment[feb2025Key][deptName].map((emp) => emp.employeeNumber),
                );
                feb2025EmployeesByDept.set(deptName, employeeNumbers);
            });

            // 2025-01의 모든 직원 수집 (부서 구분 없이)
            const jan2025AllEmployees = new Map<string, { employeeName: string; employeeNumber: string }>();
            Object.values(employeesByYearMonthAndDepartment[jan2025Key]).forEach((employees) => {
                employees.forEach((emp) => {
                    jan2025AllEmployees.set(emp.employeeNumber, emp);
                });
            });

            // 2025-01의 부서 구조를 2025-02와 동일하게 재구성
            const jan2025Reorganized: Record<string, Array<{ employeeName: string; employeeNumber: string }>> = {};
            const jan2025Exceptions: Array<{ employeeName: string; employeeNumber: string }> = [];

            // 2025-02의 부서 구조를 기준으로 2025-01 직원 배치
            feb2025Departments.forEach((deptName) => {
                jan2025Reorganized[deptName] = [];
                const feb2025DeptEmployees = feb2025EmployeesByDept.get(deptName) ?? new Set();

                feb2025DeptEmployees.forEach((employeeNumber) => {
                    const jan2025Employee = jan2025AllEmployees.get(employeeNumber);
                    if (jan2025Employee) {
                        jan2025Reorganized[deptName].push(jan2025Employee);
                    }
                });
            });

            // 2025-01에만 있는 직원 (2025-02에 없는 직원)을 예외로 표시
            const feb2025AllEmployeeNumbers = new Set<string>();
            Object.values(employeesByYearMonthAndDepartment[feb2025Key]).forEach((employees) => {
                employees.forEach((emp) => {
                    feb2025AllEmployeeNumbers.add(emp.employeeNumber);
                });
            });

            jan2025AllEmployees.forEach((emp, employeeNumber) => {
                if (!feb2025AllEmployeeNumbers.has(employeeNumber)) {
                    jan2025Exceptions.push(emp);
                }
            });

            // 각 부서별 직원 목록 정렬
            Object.keys(jan2025Reorganized).forEach((deptName) => {
                jan2025Reorganized[deptName].sort((a, b) => a.employeeNumber.localeCompare(b.employeeNumber));
            });
            jan2025Exceptions.sort((a, b) => a.employeeNumber.localeCompare(b.employeeNumber));

            // 2025-01의 구조를 재구성된 구조로 교체
            employeesByYearMonthAndDepartment[jan2025Key] = jan2025Reorganized;

            // 예외 직원 정보를 별도로 추가
            if (jan2025Exceptions.length > 0) {
                employeesByYearMonthAndDepartment[jan2025Key]['[예외] 2025-01에만 존재하는 직원'] = jan2025Exceptions;
            }
        }

        console.log(
            '날짜-부서-부서원 계층 구조 (조직도 변화 추적, 2025-01은 2025-02 기준으로 재구성):',
            employeesByYearMonthAndDepartment,
        );

        this.logger.log(
            `스냅샷 데이터 조회: snapshots=${prvSnapshots.length}건, children=${prvChildren.length}건, approvalRequests=${approvalRequests.length}건, groups=${result.length}개`,
        );

        // return { snapshots: prvSnapshots, snapshotsWithDetails };
        return { employeesByYearMonthAndDepartment };
    }

    async 테이블별데이터를조회한다(): Promise<Record<string, unknown[]>> {
        const results: Record<string, unknown[]> = {};
        const entries = Object.entries(EntityList);

        for (const [name, entity] of entries) {
            try {
                const repository = this.prvDataSource.getRepository(entity);
                const rows = await repository.find();
                results[name] = rows as unknown[];
                this.logger.log(`✅ ${name} 조회 완료: ${rows.length}건`);
            } catch (error) {
                this.logger.error(`테이블 조회 실패: ${name} - ${error.message}`, error.stack);
                results[name] = [];
            }
        }

        return results;
    }

    async 마이그레이션을실행한다(): Promise<void> {
        this.logger.log('🚀 PRV DB 마이그레이션 시작');

        const employeeIdByNumber = await this.사번매핑을생성한다();
        const departmentIdByCode = await this.부서코드매핑을생성한다();
        const attendanceTypeByTitle = await this.근태유형매핑을생성한다();
        // console.log(attendanceTypeByTitle);
        // return;
        await this.휴일맵핑을확인한다();

        await this.이벤트정보를마이그레이션한다();
        const monthlyMap = await this.월간요약을마이그레이션한다(employeeIdByNumber);
        await this.일간요약을마이그레이션한다(employeeIdByNumber, attendanceTypeByTitle, monthlyMap);
        await this.사용근태를마이그레이션한다(employeeIdByNumber, attendanceTypeByTitle);
        await this.스냅샷정보와자식을함께마이그레이션한다(departmentIdByCode, employeeIdByNumber);

        this.logger.log('✅ PRV DB 마이그레이션 완료');
    }

    async 시나리오데이터를정리한다(): Promise<void> {
        await cleanupScenarioData(this.dataSource);
        this.logger.log('✅ 시나리오 데이터 정리 완료');
    }

    private async 사번매핑을생성한다(): Promise<Map<string, string>> {
        const employees = await this.dataSource.getRepository(Employee).find();
        const map = new Map<string, string>();
        employees.forEach((employee) => {
            if (employee.employeeNumber && employee.id) {
                map.set(employee.employeeNumber, employee.id);
            }
        });
        this.logger.log(`사번 매핑 생성 완료: ${map.size}건`);
        return map;
    }

    private async 부서코드매핑을생성한다(): Promise<Map<string, string>> {
        const departments = await this.dataSource.getRepository(Department).find();
        const map = new Map<string, string>();
        departments.forEach((department) => {
            if (department.departmentCode && department.id) {
                map.set(department.departmentCode, department.id);
            }
        });
        this.logger.log(`부서코드 매핑 생성 완료: ${map.size}건`);
        return map;
    }

    private async 근태유형매핑을생성한다(): Promise<
        Map<
            string,
            {
                id: string;
                title: string;
                workTime: number;
                isRecognizedWorkTime: boolean;
                startWorkTime: string | null;
                endWorkTime: string | null;
                deductedAnnualLeave: number;
            }
        >
    > {
        const attendanceTypes = await this.dataSource.getRepository(AttendanceType).find();
        const map = new Map<
            string,
            {
                id: string;
                title: string;
                workTime: number;
                isRecognizedWorkTime: boolean;
                startWorkTime: string | null;
                endWorkTime: string | null;
                deductedAnnualLeave: number;
            }
        >();
        attendanceTypes.forEach((type) => {
            map.set(type.title, {
                id: type.id,
                title: type.title,
                workTime: type.work_time,
                isRecognizedWorkTime: type.is_recognized_work_time,
                startWorkTime: type.start_work_time,
                endWorkTime: type.end_work_time,
                deductedAnnualLeave: type.deducted_annual_leave,
            });
        });
        this.logger.log(`근태유형 매핑 생성 완료: ${map.size}건`);
        return map;
    }

    private async 휴일맵핑을확인한다(): Promise<void> {
        const holidays = await this.dataSource.getRepository(HolidayInfo).find();
        const keys = new Set(holidays.map((holiday) => `${holiday.holiday_name}|${holiday.holiday_date}`));
        this.logger.log(`휴일 매핑 확인 완료: ${keys.size}건`);
    }

    private async 이벤트정보를마이그레이션한다(): Promise<void> {
        const prvEvents = await this.prvDataSource.getRepository(PrvEventInfoEntity).find();
        const eventPayloads = EventInfo.이벤트정보배열로부터생성한다(prvEvents as any[]);

        // 직원별, 날짜별로 그룹화하여 각 날짜의 첫 번째와 마지막 기록만 추출
        const groupedByEmployeeAndDate = new Map<string, Map<string, Partial<EventInfo>[]>>();

        eventPayloads.forEach((payload) => {
            const employeeNumber = payload.employee_number ?? '';
            const yyyymmdd = payload.yyyymmdd ?? '';

            if (!employeeNumber || !yyyymmdd) {
                return;
            }

            if (!groupedByEmployeeAndDate.has(employeeNumber)) {
                groupedByEmployeeAndDate.set(employeeNumber, new Map());
            }

            const dateMap = groupedByEmployeeAndDate.get(employeeNumber)!;
            if (!dateMap.has(yyyymmdd)) {
                dateMap.set(yyyymmdd, []);
            }
            dateMap.get(yyyymmdd)!.push(payload);
        });

        // 각 직원별, 날짜별로 첫 번째와 마지막 기록만 추출
        const filteredEvents: Partial<EventInfo>[] = [];
        const uniqueMap = new Map<string, Partial<EventInfo>>();

        groupedByEmployeeAndDate.forEach((dateMap, employeeNumber) => {
            dateMap.forEach((dayEvents, yyyymmdd) => {
                // 시간 순으로 정렬
                dayEvents.sort((a, b) => {
                    const timeA = parseInt(a.hhmmss || '000000', 10);
                    const timeB = parseInt(b.hhmmss || '000000', 10);
                    return timeA - timeB;
                });

                // 가장 처음 기록 (최소 시간)
                const firstEvent = dayEvents[0];
                const firstUniqueKey = `${firstEvent.employee_number ?? ''}|${firstEvent.event_time ?? ''}`;
                if (!uniqueMap.has(firstUniqueKey)) {
                    uniqueMap.set(firstUniqueKey, firstEvent);
                    filteredEvents.push(firstEvent);
                }

                // 가장 마지막 기록 (최대 시간) - 첫 번째와 다른 경우에만 추가
                if (dayEvents.length > 1) {
                    const lastEvent = dayEvents[dayEvents.length - 1];
                    const lastUniqueKey = `${lastEvent.employee_number ?? ''}|${lastEvent.event_time ?? ''}`;
                    if (!uniqueMap.has(lastUniqueKey)) {
                        uniqueMap.set(lastUniqueKey, lastEvent);
                        filteredEvents.push(lastEvent);
                    }
                }
            });
        });

        const chunkSize = 1000;
        for (let index = 0; index < filteredEvents.length; index += chunkSize) {
            const chunk = filteredEvents.slice(index, index + chunkSize);
            await this.dataSource.createQueryBuilder().insert().into(EventInfo).values(chunk).orIgnore().execute();
        }

        this.logger.log(
            `이벤트 정보 마이그레이션 완료: 전체 ${eventPayloads.length}건, 날짜별 필터링 후 ${filteredEvents.length}건`,
        );
    }

    private async 월간요약을마이그레이션한다(employeeIdByNumber: Map<string, string>): Promise<Map<string, string>> {
        const prvMonthlySummaries = await this.prvDataSource.getRepository(PrvMonthlySummaryEntity).find();
        const latestByEmployeeMonth = new Map<string, PrvMonthlySummaryEntity>();

        prvMonthlySummaries.forEach((summary) => {
            const key = `${summary.employeeNumber}|${summary.yyyymm}`;
            const existing = latestByEmployeeMonth.get(key);
            if (!existing || summary.createdAt > existing.createdAt) {
                latestByEmployeeMonth.set(key, summary);
            }
        });

        const repository = await this.dataSource.getRepository(MonthlyEventSummary);
        const map = new Map<string, string>();

        const entities = Array.from(latestByEmployeeMonth.values())
            .map((summary) => {
                const employeeId = employeeIdByNumber.get(summary.employeeNumber);
                if (!employeeId) {
                    this.logger.warn(`월간요약 스킵: 사번 매핑 실패 (${summary.employeeNumber})`);
                    return null;
                }
                return new MonthlyEventSummary(
                    summary.employeeNumber,
                    employeeId,
                    summary.yyyymm,
                    summary.workDaysCount,
                    summary.totalWorkTime,
                    summary.avgWorkTimes,
                    summary.attendanceTypeCount,
                    summary.employeeName,
                    summary.totalWorkableTime,
                    summary.weeklyWorkTimeSummary,
                    null,
                    summary.lateDetails,
                    summary.absenceDetails,
                    summary.earlyLeaveDetails,
                    summary.note,
                    summary.additionalNote,
                );
            })
            .filter(Boolean) as MonthlyEventSummary[];

        const saved = await repository.save(entities, { chunk: 500 });
        saved.forEach((summary) => {
            map.set(`${summary.employee_number}|${summary.yyyymm}`, summary.id);
        });

        this.logger.log(
            `월간 요약 마이그레이션 완료: 전체 ${prvMonthlySummaries.length}건, 중복 제거 ${entities.length}건`,
        );
        return map;
    }

    private async 일간요약을마이그레이션한다(
        employeeIdByNumber: Map<string, string>,
        attendanceTypeByTitle: Map<
            string,
            {
                id: string;
                title: string;
                workTime: number;
                isRecognizedWorkTime: boolean;
                startWorkTime: string | null;
                endWorkTime: string | null;
                deductedAnnualLeave: number;
            }
        >,
        monthlyMap: Map<string, string>,
    ): Promise<void> {
        const prvMonthlySummaries = await this.prvDataSource.getRepository(PrvMonthlySummaryEntity).find();
        const dailyEntities: DailyEventSummary[] = [];
        const latestByEmployeeMonth = new Map<string, PrvMonthlySummaryEntity>();

        prvMonthlySummaries.forEach((summary) => {
            const key = `${summary.employeeNumber}|${summary.yyyymm}`;
            const existing = latestByEmployeeMonth.get(key);
            if (!existing || summary.createdAt > existing.createdAt) {
                latestByEmployeeMonth.set(key, summary);
            }
        });

        Array.from(latestByEmployeeMonth.values()).forEach((summary) => {
            const employeeId = employeeIdByNumber.get(summary.employeeNumber);
            const monthlyId = monthlyMap.get(`${summary.employeeNumber}|${summary.yyyymm}`);
            if (!employeeId || !monthlyId || !Array.isArray(summary.dailyEventSummary)) {
                return;
            }

            summary.dailyEventSummary.forEach((daily: any) => {
                const usedAttendances = Array.isArray(daily.usedAttendances)
                    ? daily.usedAttendances
                          .map((item: { title: string }) => {
                              const mapped = attendanceTypeByTitle.get(item.title);
                              if (!mapped) {
                                  return null;
                              }
                              return {
                                  attendanceTypeId: mapped.id,
                                  title: mapped.title,
                                  workTime: mapped.workTime,
                                  isRecognizedWorkTime: mapped.isRecognizedWorkTime,
                                  startWorkTime: mapped.startWorkTime,
                                  endWorkTime: mapped.endWorkTime,
                                  deductedAnnualLeave: mapped.deductedAnnualLeave,
                              };
                          })
                          .filter(Boolean)
                    : null;

                dailyEntities.push(
                    new DailyEventSummary(
                        daily.date,
                        employeeId,
                        monthlyId,
                        daily.isHoliday ?? false,
                        daily.enter ?? null,
                        daily.leave ?? null,
                        daily.realEnter ?? null,
                        daily.realLeave ?? null,
                        daily.isChecked ?? true,
                        daily.isLate ?? false,
                        daily.isEarlyLeave ?? false,
                        daily.isAbsent ?? false,
                        daily.hasAttendanceConflict ?? false,
                        daily.hasAttendanceOverlap ?? false,
                        daily.workTime ?? null,
                        daily.note ?? null,
                        (usedAttendances as any) ?? null,
                    ),
                );
            });
        });

        await this.dataSource.getRepository(DailyEventSummary).save(dailyEntities, { chunk: 500 });
        this.logger.log(`일간 요약 마이그레이션 완료: ${dailyEntities.length}건`);
    }

    private async 사용근태를마이그레이션한다(
        employeeIdByNumber: Map<string, string>,
        attendanceTypeByTitle: Map<
            string,
            {
                id: string;
                title: string;
                workTime: number;
                isRecognizedWorkTime: boolean;
                startWorkTime: string | null;
                endWorkTime: string | null;
                deductedAnnualLeave: number;
            }
        >,
    ): Promise<void> {
        const prvUsedAttendances = await this.prvDataSource
            .getRepository(PrvUsedAttendanceEntity)
            .find({ relations: ['employee', 'attendanceType'] });
        const payloads = prvUsedAttendances
            .map((used) => {
                const employeeNumber = used.employee?.employeeNumber;
                const attendanceTitle = used.attendanceType?.title;
                const employeeId = employeeNumber ? employeeIdByNumber.get(employeeNumber) : undefined;
                const attendanceType = attendanceTitle ? attendanceTypeByTitle.get(attendanceTitle) : undefined;

                if (!employeeId || !attendanceType) {
                    return null;
                }

                return {
                    used_at: used.usedAt,
                    employee_id: employeeId,
                    attendance_type_id: attendanceType.id,
                };
            })
            .filter(Boolean) as Array<Partial<UsedAttendance>>;

        const uniqueMap = new Map<string, Partial<UsedAttendance>>();
        payloads.forEach((payload) => {
            const uniqueKey = `${payload.employee_id}|${payload.used_at}|${payload.attendance_type_id}`;
            if (!uniqueMap.has(uniqueKey)) {
                uniqueMap.set(uniqueKey, payload);
            }
        });

        const uniquePayloads = Array.from(uniqueMap.values());
        const chunkSize = 1000;
        for (let index = 0; index < uniquePayloads.length; index += chunkSize) {
            const chunk = uniquePayloads.slice(index, index + chunkSize);
            await this.dataSource.createQueryBuilder().insert().into(UsedAttendance).values(chunk).orIgnore().execute();
        }

        this.logger.log(`사용 근태 마이그레이션 완료: 전체 ${payloads.length}건, 중복 제거 ${uniquePayloads.length}건`);
    }

    /**
     * 스냅샷 정보와 자식 데이터를 함께 마이그레이션한다
     * 스냅샷과 자식을 함께 조회하여 관계를 제대로 형성한다
     */
    private async 스냅샷정보와자식을함께마이그레이션한다(
        departmentIdByCode: Map<string, string>,
        employeeIdByNumber: Map<string, string>,
    ): Promise<void> {
        // 스냅샷과 자식 데이터를 함께 조회
        const prvSnapshots = await this.prvDataSource
            .getRepository(PrvDataSnapshotInfoEntity)
            .find({ relations: ['department'] });
        const prvChildren = await this.prvDataSource
            .getRepository(PrvDataSnapshotChildInfoEntity)
            .find({ relations: ['parentSnapshot'] });

        // 스냅샷별로 자식들을 그룹화 (ID 기준)
        const childrenBySnapshotId = new Map<string, typeof prvChildren>();
        prvChildren.forEach((child) => {
            const snapshotId = child.parentSnapshot?.dataSnapshotId;
            if (!snapshotId) {
                return;
            }
            if (!childrenBySnapshotId.has(snapshotId)) {
                childrenBySnapshotId.set(snapshotId, []);
            }
            childrenBySnapshotId.get(snapshotId)!.push(child);
        });

        const approvalRequests = await this.prvDataSource
            .getRepository(PrvDataSnapshotApprovalRequestInfoEntity)
            .find({ relations: ['dataSnapshot', 'steps', 'steps.approver'] });
        const approvalBySnapshotId = new Map<
            string,
            {
                submittedAt: Date | null;
                approverName: string | null;
                approvalStatus: string | null;
            }
        >();

        approvalRequests.forEach((request) => {
            const snapshotId = request.dataSnapshot?.dataSnapshotId;
            if (!snapshotId) {
                return;
            }
            const steps = request.steps ?? [];
            const sortedSteps = steps.slice().sort((a, b) => a.stepOrder - b.stepOrder);
            const lastStep = sortedSteps[sortedSteps.length - 1];
            approvalBySnapshotId.set(snapshotId, {
                submittedAt: request.createdAt ?? null,
                approverName: lastStep?.approver?.username ?? null,
                approvalStatus: lastStep?.status ?? null,
            });
        });

        const repository = this.dataSource.getRepository(DataSnapshotInfo);
        const versionBySnapshotId = new Map<string, string | null>();
        const snapshotsByDepartmentMonth = new Map<string, PrvDataSnapshotInfoEntity[]>();
        prvSnapshots.forEach((snapshot) => {
            const departmentCode = snapshot.department?.departmentCode ?? null;
            const key = departmentCode ? `${departmentCode}|${snapshot.yyyy}-${snapshot.mm}` : null;
            if (!key) {
                return;
            }
            const bucket = snapshotsByDepartmentMonth.get(key) ?? [];
            bucket.push(snapshot);
            snapshotsByDepartmentMonth.set(key, bucket);
        });

        // snapshotsByDepartmentMonth.forEach((snapshots) => {
        //     snapshots
        //         .sort(
        //             (a, b) =>
        //                 this.생성일자를파싱한다(a.createdAt).getTime() - this.생성일자를파싱한다(b.createdAt).getTime(),
        //         )
        //         .forEach((snapshot, index) => {
        //             versionBySnapshotId.set(snapshot.dataSnapshotId, this.스냅샷버전을계산한다(index));
        //         });
        // });

        // TODO : 스냅샷 내용 타입 일치시켜야함

        // 저장하기 전 데이터 만들기
        // 1. 연월별로 스냅샷 그룹핑
        const snapshotsByYearMonth = new Map<string, PrvDataSnapshotInfoEntity[]>();
        prvSnapshots.forEach((snapshot) => {
            const yearMonth = `${snapshot.yyyy}-${snapshot.mm}`;
            if (!snapshotsByYearMonth.has(yearMonth)) {
                snapshotsByYearMonth.set(yearMonth, []);
            }
            snapshotsByYearMonth.get(yearMonth)!.push(snapshot);
        });

        // 2. 각 연월별로 스냅샷 1개 선택 (최신 createdAt 기준)
        const selectedSnapshotsByYearMonth = new Map<string, PrvDataSnapshotInfoEntity>();
        snapshotsByYearMonth.forEach((snapshots, yearMonth) => {
            // createdAt 기준으로 정렬하여 최신 스냅샷 선택
            const sortedSnapshots = snapshots.sort((a, b) => {
                const dateA = this.생성일자를파싱한다(a.createdAt).getTime();
                const dateB = this.생성일자를파싱한다(b.createdAt).getTime();
                return dateB - dateA; // 최신순
            });
            selectedSnapshotsByYearMonth.set(yearMonth, sortedSnapshots[0]);
        });

        // 3. 모든 스냅샷의 자식들을 직원별로 그룹핑
        const childrenByEmployeeId = new Map<string, PrvDataSnapshotChildInfoEntity[]>();
        prvChildren.forEach((child) => {
            const employeeId = child.employeeId;
            if (!employeeId) {
                return;
            }
            if (!childrenByEmployeeId.has(employeeId)) {
                childrenByEmployeeId.set(employeeId, []);
            }
            childrenByEmployeeId.get(employeeId)!.push(child);
        });

        // 4. 각 직원의 최신 자식 데이터 선택 및 연월별로 매핑
        const finalDataByYearMonth = new Map<
            string,
            {
                snapshot: PrvDataSnapshotInfoEntity;
                children: PrvDataSnapshotChildInfoEntity[];
            }
        >();

        selectedSnapshotsByYearMonth.forEach((selectedSnapshot, yearMonth) => {
            const children: PrvDataSnapshotChildInfoEntity[] = [];

            // 각 직원별로 최신 자식 데이터 선택
            childrenByEmployeeId.forEach((employeeChildren, employeeId) => {
                // 해당 연월에 맞는 자식들만 필터링
                const matchingChildren = employeeChildren.filter(
                    (child) => child.yyyy === selectedSnapshot.yyyy && child.mm === selectedSnapshot.mm,
                );

                if (matchingChildren.length === 0) {
                    return;
                }

                // createdAt 기준으로 최신 자식 선택
                const sortedChildren = matchingChildren.sort((a, b) => {
                    const dateA = this.생성일자를파싱한다(a.createdAt).getTime();
                    const dateB = this.생성일자를파싱한다(b.createdAt).getTime();
                    return dateB - dateA; // 최신순
                });

                children.push(sortedChildren[0]);
            });

            finalDataByYearMonth.set(yearMonth, {
                snapshot: selectedSnapshot,
                children,
            });
        });

        // 6. 스냅샷 데이터 저장
        const empIdByNumber = await this.사번매핑을생성한다();
        const attendanceTypeByTitle = await this.근태유형매핑을생성한다();
        const snapshotRepository = this.dataSource.getRepository(DataSnapshotInfo);

        this.logger.log('스냅샷 데이터 저장 시작...');

        // finalDataByYearMonth를 기반으로 저장
        const snapshotsToSave: DataSnapshotInfo[] = [];

        for (const [yearMonth, data] of finalDataByYearMonth.entries()) {
            const snapshot = data.snapshot;
            const children = data.children;

            // 결재 정보 매핑
            const approval = approvalBySnapshotId.get(snapshot.dataSnapshotId);

            // 해당 연월의 반영 데이터 조회 (EventInfo, UsedAttendance)
            const rawData = await this.해당연월반영데이터를조회한다(
                snapshot.yyyy,
                snapshot.mm,
                empIdByNumber,
                attendanceTypeByTitle,
            );

            // 스냅샷 엔티티 생성
            const snapshotEntity = new DataSnapshotInfo(
                snapshot.snapshotName,
                snapshot.snapshotType as any,
                snapshot.yyyy,
                snapshot.mm,
                null,
                snapshot.description ?? '',
                'A', // snapshotVersion
                null, // approvalDocumentId
                approval?.submittedAt ?? null,
                null,
                ApprovalStatus.SUBMITTED,
                true, // isCurrent
            );

            // 자식 엔티티 생성
            const childEntities = children
                .map((child) => {
                    const employeeId = empIdByNumber.get(child.employeeNumber);
                    if (!employeeId) {
                        this.logger.warn(
                            `직원 번호 ${child.employeeNumber}에 해당하는 직원 ID를 찾을 수 없습니다. 스킵합니다.`,
                        );
                        return null;
                    }

                    // 직원별로 rawData 분리
                    const eventInfo = rawData.eventInfo.filter((e) => e.employee_number === child.employeeNumber);
                    const usedAttendance = rawData.usedAttendance.filter((ua) => {
                        const employeeIdForAttendance = empIdByNumber.get(child.employeeNumber);
                        return ua.employee_id === employeeIdForAttendance;
                    });

                    const employeeRawData = {
                        year: rawData.year,
                        month: rawData.month,
                        eventInfo,
                        usedAttendance,
                    };

                    // 저장하기 전에 데이터 구조 변환 (1번 구조 → 2번 구조)
                    const snapshotDataObj =
                        typeof child.snapshotData === 'string' ? JSON.parse(child.snapshotData) : child.snapshotData;

                    // 구조 변환 (1번 구조 → 2번 구조)
                    // dailyEventSummary가 있으면 dailySummaries로 변환, 없으면 기존 dailySummaries 유지
                    const monthlyEventSummaryId = snapshotDataObj.monthlyEventSummaryId || snapshotDataObj.id;
                    const dailySummaries =
                        snapshotDataObj.dailyEventSummary && snapshotDataObj.dailyEventSummary.length > 0
                            ? snapshotDataObj.dailyEventSummary.map((daily: any) => {
                                  const usedAttendances = Array.isArray(daily.usedAttendances)
                                      ? daily.usedAttendances
                                            .map((item: { title?: string }) => {
                                                const mapped = item?.title
                                                    ? attendanceTypeByTitle.get(item.title)
                                                    : undefined;
                                                if (!mapped) return null;
                                                return {
                                                    attendanceTypeId: mapped.id,
                                                    title: mapped.title,
                                                    workTime: mapped.workTime,
                                                    isRecognizedWorkTime: mapped.isRecognizedWorkTime,
                                                    startWorkTime: mapped.startWorkTime,
                                                    endWorkTime: mapped.endWorkTime,
                                                    deductedAnnualLeave: mapped.deductedAnnualLeave,
                                                };
                                            })
                                            .filter(Boolean)
                                      : [];
                                  return {
                                      id: daily.dailyEventSummaryId || daily.id,
                                      date: daily.date,
                                      employeeId: employeeId,
                                      monthlyEventSummaryId: monthlyEventSummaryId,
                                      isHoliday: daily.isHoliday,
                                      enter: daily.enter,
                                      leave: daily.leave,
                                      realEnter: daily.realEnter,
                                      realLeave: daily.realLeave,
                                      isChecked: daily.isChecked,
                                      isLate: daily.isLate,
                                      isEarlyLeave: daily.isEarlyLeave,
                                      isAbsent: daily.isAbsent,
                                      hasAttendanceConflict: false,
                                      hasAttendanceOverlap: false,
                                      workTime: daily.workTime,
                                      note: daily.note,
                                      usedAttendances,
                                      createdAt: daily.createdAt || snapshotDataObj.createdAt,
                                      updatedAt: daily.updatedAt || snapshotDataObj.updatedAt,
                                      deletedAt: null,
                                      createdBy: null,
                                      updatedBy: null,
                                      version: 1,
                                  };
                              })
                            : snapshotDataObj.dailySummaries || [];

                    const transformedSnapshotData: any = {
                        ...snapshotDataObj,
                        employeeId: employeeId,
                        id: monthlyEventSummaryId,
                        dailyEventSummary: null,
                        dailySummaries: dailySummaries,
                        deletedAt: null,
                        createdBy: null,
                        updatedBy: null,
                        version: snapshotDataObj.version || 1,
                    };

                    // annualLeaveData 제거
                    delete transformedSnapshotData.annualLeaveData;
                    // monthlyEventSummaryId 제거 (id로 변경되었으므로)
                    delete transformedSnapshotData.monthlyEventSummaryId;

                    const childEntity = new DataSnapshotChild(
                        employeeId,
                        child.employeeName,
                        child.employeeNumber,
                        child.yyyy,
                        child.mm,
                        JSON.stringify(transformedSnapshotData),
                        employeeRawData,
                    );
                    childEntity.parentSnapshot = snapshotEntity;
                    return childEntity;
                })
                .filter(Boolean) as DataSnapshotChild[];

            snapshotEntity.dataSnapshotChildInfoList = childEntities;
            snapshotsToSave.push(snapshotEntity);
        }

        // 배치로 저장 (메모리 부족 방지)
        const batchSize = 100;
        let totalSaved = 0;

        for (let i = 0; i < snapshotsToSave.length; i += batchSize) {
            const batch = snapshotsToSave.slice(i, i + batchSize);
            const saved = await snapshotRepository.save(batch, { chunk: 50 });
            totalSaved += saved.length;
            this.logger.log(
                `스냅샷 및 자식 배치 저장 완료: ${i + batch.length}/${snapshotsToSave.length}건 (저장: ${saved.length}건)`,
            );
        }

        this.logger.log(`스냅샷 정보 및 자식 마이그레이션 완료: 총 ${totalSaved}건`);
    }

    private 스냅샷버전을계산한다(index: number): string | null {
        if (index < 0 || index >= 26) {
            return null;
        }
        return String.fromCharCode(65 + index);
    }

    private 생성일자를파싱한다(value: unknown): Date {
        if (value instanceof Date) {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = new Date(value);
            if (!Number.isNaN(parsed.getTime())) {
                return parsed;
            }
            const match = value.match(
                /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2}):(\d{2})/,
            );
            if (match) {
                const [, year, month, day, meridiem, hour, minute, second] = match;
                let hourNumber = Number(hour);
                if (meridiem === '오후' && hourNumber < 12) {
                    hourNumber += 12;
                }
                if (meridiem === '오전' && hourNumber === 12) {
                    hourNumber = 0;
                }
                return new Date(
                    Number(year),
                    Number(month) - 1,
                    Number(day),
                    hourNumber,
                    Number(minute),
                    Number(second),
                );
            }
        }
        return new Date(0);
    }

    /**
     * 해당 연월의 반영 데이터를 조회한다 (EventInfo, UsedAttendance)
     * 출입기록과 근태사용내역을 prvDataSource에서 조회하여 스냅샷의 raw_data에 저장합니다.
     * id를 제외한 필요한 필드만 추출하여 반환합니다.
     */
    private async 해당연월반영데이터를조회한다(
        year: string,
        month: string,
        employeeIdByNumber: Map<string, string>,
        attendanceTypeByTitle: Map<
            string,
            {
                id: string;
                title: string;
                workTime: number;
                isRecognizedWorkTime: boolean;
                startWorkTime: string | null;
                endWorkTime: string | null;
                deductedAnnualLeave: number;
            }
        >,
    ): Promise<{ year: string; month: string; eventInfo: any[]; usedAttendance: any[] }> {
        // 날짜 범위 계산
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const startDate = `${year}${month.padStart(2, '0')}01`;
        const lastDay = new Date(yearNum, monthNum, 0).getDate();
        const endDate = `${year}${month.padStart(2, '0')}${lastDay.toString().padStart(2, '0')}`;

        // EventInfo 조회 (prvDataSource에서 yyyymmdd 기준으로 해당 연월 범위 조회, id 제외)
        const eventInfos = await this.prvDataSource
            .createQueryBuilder(PrvEventInfoEntity, 'ei')
            .where('ei.yyyymmdd >= :startDate', { startDate })
            .andWhere('ei.yyyymmdd <= :endDate', { endDate })
            .orderBy('ei.yyyymmdd', 'ASC')
            .addOrderBy('ei.hhmmss', 'ASC')
            .getMany();

        // 직원별, 날짜별로 그룹화하여 각 날짜의 첫 번째와 마지막 기록만 추출
        const groupedByEmployeeAndDate = new Map<string, Map<string, typeof eventInfos>>();

        eventInfos.forEach((event) => {
            const employeeNumber = event.employeeNumber || '';
            const yyyymmdd = event.yyyymmdd;

            if (!groupedByEmployeeAndDate.has(employeeNumber)) {
                groupedByEmployeeAndDate.set(employeeNumber, new Map());
            }

            const dateMap = groupedByEmployeeAndDate.get(employeeNumber)!;
            if (!dateMap.has(yyyymmdd)) {
                dateMap.set(yyyymmdd, []);
            }
            dateMap.get(yyyymmdd)!.push(event);
        });

        const eventData: Array<{
            employee_name: string;
            employee_number: string;
            event_time: string;
            yyyymmdd: string;
            hhmmss: string;
        }> = [];

        // 각 직원별, 날짜별로 첫 번째와 마지막 기록만 추출
        groupedByEmployeeAndDate.forEach((dateMap, employeeNumber) => {
            dateMap.forEach((dayEvents, yyyymmdd) => {
                // 시간 순으로 정렬 (이미 정렬되어 있지만 확실히 하기 위해)
                dayEvents.sort((a, b) => {
                    const timeA = parseInt(a.hhmmss || '000000', 10);
                    const timeB = parseInt(b.hhmmss || '000000', 10);
                    return timeA - timeB;
                });

                // 가장 처음 기록 (최소 시간)
                const firstEvent = dayEvents[0];
                eventData.push({
                    employee_name: firstEvent.employeeName,
                    employee_number: firstEvent.employeeNumber,
                    event_time: firstEvent.eventTime,
                    yyyymmdd: firstEvent.yyyymmdd,
                    hhmmss: firstEvent.hhmmss,
                });

                // 가장 마지막 기록 (최대 시간) - 처음 기록과 실제 시간이 다른 경우에만 추가
                if (dayEvents.length > 1) {
                    const lastEvent = dayEvents[dayEvents.length - 1];
                    const firstTime = firstEvent.eventTime;
                    const lastTime = lastEvent.eventTime;
                    if (firstTime !== lastTime) {
                        eventData.push({
                            employee_name: lastEvent.employeeName,
                            employee_number: lastEvent.employeeNumber,
                            event_time: lastEvent.eventTime,
                            yyyymmdd: lastEvent.yyyymmdd,
                            hhmmss: lastEvent.hhmmss,
                        });
                    }
                }
            });
        });

        // UsedAttendance 조회 (prvDataSource에서 used_at 기준으로 해당 연월 범위 조회, id 제외, employee와 attendanceType join)
        const startDateStr = `${year}-${month.padStart(2, '0')}-01`;
        const endDateStr = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

        const usedAttendances = await this.prvDataSource
            .createQueryBuilder(PrvUsedAttendanceEntity, 'ua')
            .leftJoinAndSelect('ua.employee', 'employee')
            .leftJoinAndSelect('ua.attendanceType', 'at')
            .where('ua.usedAt >= :startDate', { startDate: startDateStr })
            .andWhere('ua.usedAt <= :endDate', { endDate: endDateStr })
            .orderBy('ua.usedAt', 'ASC')
            .getMany();

        const attendanceData = usedAttendances
            .map((ua) => {
                // prvDataSource의 employeeNumber를 사용하여 새 DB의 employeeId로 매핑
                const employeeNumber = ua.employee?.employeeNumber;
                const newEmployeeId = employeeNumber ? employeeIdByNumber.get(employeeNumber) : null;

                if (!newEmployeeId) {
                    // 매핑되지 않은 경우 스킵 (로그는 남기지 않음 - 너무 많을 수 있음)
                    return null;
                }

                // prv 근태유형명(title)으로 새 DB의 attendance_type_id 매핑
                const prvTitle = ua.attendanceType?.title ?? '';
                const mappedType = attendanceTypeByTitle.get(prvTitle);
                const newAttendanceTypeId = mappedType?.id ?? null;

                if (!newAttendanceTypeId) {
                    // 근태유형 매핑이 없으면 스킵
                    return null;
                }

                return {
                    used_at: ua.usedAt,
                    employee_id: newEmployeeId,
                    attendance_type_id: newAttendanceTypeId,
                    attendance_type_title: mappedType.title,
                };
            })
            .filter(Boolean) as Array<{
            used_at: string;
            employee_id: string;
            attendance_type_id: string | null;
            attendance_type_title: string | null;
        }>;

        return {
            year,
            month,
            eventInfo: eventData,
            usedAttendance: attendanceData,
        };
    }
}
