import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException, Logger } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { SaveCompanyMonthlySnapshotCommand } from './save-company-monthly-snapshot.command';
import { ISaveAttendanceSnapshotResponse } from '../../../interfaces';
import { SnapshotType } from '../../../../../domain/data-snapshot-info/data-snapshot-info.types';
import { DataSnapshotInfo } from '../../../../../domain/data-snapshot-info/data-snapshot-info.entity';
import { DataSnapshotChild } from '../../../../../domain/data-snapshot-child/data-snapshot-child.entity';
import { DomainEmployeeDepartmentPositionHistoryService } from '@libs/modules/employee-department-position-history/employee-department-position-history.service';
import { MonthlyEventSummary } from '../../../../../domain/monthly-event-summary/monthly-event-summary.entity';
import { DailyEventSummary } from '../../../../../domain/daily-event-summary/daily-event-summary.entity';
import { DomainDailySummaryChangeHistoryService } from '../../../../../domain/daily-summary-change-history/daily-summary-change-history.service';
import { DomainAttendanceIssueService } from '../../../../../domain/attendance-issue/attendance-issue.service';
import { IMonthlyEventSummaryWithDailySummaries } from '../../../../attendance-data-context/interfaces/response/get-monthly-summaries-response.interface';
import { EventInfo } from '../../../../../domain/event-info/event-info.entity';
import { UsedAttendance } from '../../../../../domain/used-attendance/used-attendance.entity';
import { DomainDataSnapshotInfoService } from '../../../../../domain/data-snapshot-info/data-snapshot-info.service';

/**
 * 회사 전체 월간 요약 스냅샷 저장 Handler
 *
 * 부서 구분 없이 해당 연월의 전체 월간/일간 요약을 하나의 스냅샷으로 저장합니다.
 */
@CommandHandler(SaveCompanyMonthlySnapshotCommand)
export class SaveCompanyMonthlySnapshotHandler implements ICommandHandler<
    SaveCompanyMonthlySnapshotCommand,
    ISaveAttendanceSnapshotResponse
> {
    private readonly logger = new Logger(SaveCompanyMonthlySnapshotHandler.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly employeeDepartmentPositionHistoryService: DomainEmployeeDepartmentPositionHistoryService,
        private readonly dailySummaryChangeHistoryService: DomainDailySummaryChangeHistoryService,
        private readonly attendanceIssueService: DomainAttendanceIssueService,
        private readonly dataSnapshotInfoService: DomainDataSnapshotInfoService,
    ) {}

    async execute(command: SaveCompanyMonthlySnapshotCommand): Promise<ISaveAttendanceSnapshotResponse> {
        const { year, month, performedBy } = command.data;

        return await this.dataSource.transaction(async (manager) => {
            try {
                this.logger.log(`회사 전체 스냅샷 저장 시작: year=${year}, month=${month}`);

                const employeeHistories =
                    await this.employeeDepartmentPositionHistoryService.특정연월의배치이력목록을조회한다(year, month);
                const employeeIds = Array.from(
                    new Set(employeeHistories.map((history) => history.employeeId).filter((id) => id)),
                );

                if (employeeIds.length === 0) {
                    this.logger.warn(`해당 연월에 유효한 직원이 없습니다. year=${year}, month=${month}`);
                    return { snapshot: null };
                }

                const yyyymm = `${year}-${month.padStart(2, '0')}`;

                const monthlySummaries = await manager
                    .createQueryBuilder(MonthlyEventSummary, 'monthly')
                    .leftJoinAndSelect('monthly.employee', 'employee')
                    .leftJoinAndSelect('monthly.dailyEventSummaries', 'daily')
                    .leftJoinAndSelect('daily.employee', 'dailyEmployee')
                    .where('monthly.deleted_at IS NULL')
                    .andWhere('monthly.yyyymm = :yyyymm', { yyyymm })
                    .andWhere('monthly.employee_id IN (:...employeeIds)', { employeeIds })
                    .orderBy('monthly.employee_number', 'ASC')
                    .addOrderBy('daily.date', 'ASC')
                    .getMany();

                if (monthlySummaries.length === 0) {
                    this.logger.log(`해당 연월에 월간 요약이 없습니다. year=${year}, month=${month}`);
                    return { snapshot: null };
                }

                const allDailySummaries: DailyEventSummary[] = [];
                monthlySummaries.forEach((monthly) => {
                    if (monthly.dailyEventSummaries && monthly.dailyEventSummaries.length > 0) {
                        allDailySummaries.push(...monthly.dailyEventSummaries);
                    }
                });

                const dailySummaryIds = allDailySummaries.map((daily) => daily.id);
                const historyMap =
                    await this.dailySummaryChangeHistoryService.일간요약ID목록으로목록조회한다(dailySummaryIds);
                const issueMap = await this.attendanceIssueService.일간요약ID목록으로목록조회한다(dailySummaryIds);

                const monthlySummaryDTOs: IMonthlyEventSummaryWithDailySummaries[] = monthlySummaries.map((monthly) => {
                    const monthlyDTO = monthly.DTO변환한다();
                    const dailySummaries = monthly.dailyEventSummaries || [];

                    const dailySummariesWithHistory = dailySummaries.map((daily) => {
                        const dailyDTO = daily.DTO변환한다();
                        const history = historyMap.get(daily.id) || [];
                        const issues = issueMap.get(daily.id) || [];

                        return {
                            ...dailyDTO,
                            history: history.length > 0 ? history : undefined,
                            issues: issues.length > 0 ? issues : undefined,
                        };
                    });

                    return {
                        ...monthlyDTO,
                        dailySummaries: dailySummariesWithHistory,
                    };
                });

                const finalSnapshotName = `${year}년 ${month}월 근태 스냅샷 (회사 전체)`;
                const finalSnapshotVersion = await this.다음버전을결정한다(year, month, manager);

                // 파일 반영 데이터 조회 (EventInfo, UsedAttendance)
                const reflectionData = await this.해당연월반영데이터를조회한다(year, month, manager);

                const snapshotInfoEntity = new DataSnapshotInfo(
                    finalSnapshotName,
                    SnapshotType.MONTHLY,
                    year,
                    month,
                    null as unknown as string,
                    '회사 전체 월간 요약 스냅샷',
                    finalSnapshotVersion,
                    null,
                    null,
                    null,
                    null,
                    true, // 새로 저장하는 스냅샷은 현재 스냅샷으로 설정
                );

                const snapshotChildren = this.월간요약을스냅샷자식으로변환한다(
                    monthlySummaryDTOs,
                    year,
                    month,
                    reflectionData,
                );

                snapshotInfoEntity.dataSnapshotChildInfoList = snapshotChildren;
                snapshotChildren.forEach((child) => {
                    child.parentSnapshot = snapshotInfoEntity;
                });

                const savedSnapshot = await manager.save(snapshotInfoEntity);
                const snapshotInfo = savedSnapshot.DTO변환한다();

                // 동일 연월의 다른 스냅샷들을 비현재로 설정
                await this.dataSnapshotInfoService.동일연월다른스냅샷들을비현재로설정한다(
                    year,
                    month,
                    snapshotInfo.id,
                    performedBy,
                    manager,
                );

                this.logger.log(
                    `회사 전체 스냅샷 저장 완료: snapshotId=${snapshotInfo.id}, 자식 수=${snapshotChildren.length}`,
                );

                return { snapshot: snapshotInfo };
            } catch (error) {
                this.logger.error(`회사 전체 스냅샷 저장 실패: ${error.message}`, error.stack);
                throw error;
            }
        });
    }

    private 월간요약을스냅샷자식으로변환한다(
        monthlySummaries: IMonthlyEventSummaryWithDailySummaries[],
        year: string,
        month: string,
        reflectionData: { year: string; month: string; eventInfo: any[]; usedAttendance: any[] },
    ): DataSnapshotChild[] {
        // reflectionData를 직원별로 분리
        const employeeRawDataMap = this.reflectionData를직원별로분리한다(reflectionData, monthlySummaries);

        return monthlySummaries.map((monthlySummary) => {
            const snapshotData = JSON.stringify(monthlySummary);
            const employeeNumber = monthlySummary.employeeNumber || '';
            const employeeRawData = employeeRawDataMap.get(employeeNumber) || null;

            return new DataSnapshotChild(
                monthlySummary.employeeId,
                monthlySummary.employeeName || '',
                employeeNumber,
                year,
                month,
                snapshotData,
                employeeRawData,
            );
        });
    }

    /**
     * reflectionData를 직원별로 분리한다
     */
    private reflectionData를직원별로분리한다(
        reflectionData: { year: string; month: string; eventInfo: any[]; usedAttendance: any[] },
        monthlySummaries: IMonthlyEventSummaryWithDailySummaries[],
    ): Map<string, { year: string; month: string; eventInfo: any[]; usedAttendance: any[] }> {
        const employeeRawDataMap = new Map<string, { year: string; month: string; eventInfo: any[]; usedAttendance: any[] }>();

        // monthlySummaries에서 employeeId와 employeeNumber 매핑 생성
        const employeeIdToNumberMap = new Map<string, string>();
        monthlySummaries.forEach((summary) => {
            if (summary.employeeId && summary.employeeNumber) {
                employeeIdToNumberMap.set(summary.employeeId, summary.employeeNumber);
            }
        });

        // eventInfo를 employee_number로 그룹화
        const eventInfoByEmployee = new Map<string, any[]>();
        reflectionData.eventInfo.forEach((event) => {
            const employeeNumber = event.employee_number;
            if (!employeeNumber) return;

            if (!eventInfoByEmployee.has(employeeNumber)) {
                eventInfoByEmployee.set(employeeNumber, []);
            }
            eventInfoByEmployee.get(employeeNumber)!.push(event);
        });

        // usedAttendance를 employee_id로 그룹화 (employee_id를 employeeNumber로 변환)
        const usedAttendanceByEmployee = new Map<string, any[]>();
        reflectionData.usedAttendance.forEach((attendance) => {
            const employeeId = attendance.employee_id;
            if (!employeeId) return;

            const employeeNumber = employeeIdToNumberMap.get(employeeId);
            if (!employeeNumber) return;

            if (!usedAttendanceByEmployee.has(employeeNumber)) {
                usedAttendanceByEmployee.set(employeeNumber, []);
            }
            usedAttendanceByEmployee.get(employeeNumber)!.push(attendance);
        });

        // 각 직원별로 raw_data 구성
        monthlySummaries.forEach((summary) => {
            const employeeNumber = summary.employeeNumber || '';
            if (!employeeNumber) return;

            const eventInfo = eventInfoByEmployee.get(employeeNumber) || [];
            const usedAttendance = usedAttendanceByEmployee.get(employeeNumber) || [];

            employeeRawDataMap.set(employeeNumber, {
                year: reflectionData.year,
                month: reflectionData.month,
                eventInfo,
                usedAttendance,
            });
        });

        return employeeRawDataMap;
    }

    private async 다음버전을결정한다(year: string, month: string, manager: any): Promise<string> {
        const existingSnapshots = await manager.getRepository(DataSnapshotInfo).find({
            where: {
                yyyy: year,
                mm: month,
                department_id: IsNull(),
                snapshot_type: SnapshotType.MONTHLY,
                deleted_at: IsNull(),
            },
            order: {
                snapshot_version: 'ASC',
            },
        });

        if (existingSnapshots.length === 0) {
            return 'A';
        }

        const existingVersions = existingSnapshots
            .map((snapshot) => snapshot.snapshot_version)
            .filter((v): v is string => {
                if (!v || v.length !== 1) return false;
                const code = v.charCodeAt(0);
                return code >= 'A'.charCodeAt(0) && code <= 'Z'.charCodeAt(0);
            })
            .map((v) => v.charCodeAt(0))
            .sort((a, b) => a - b);

        if (existingVersions.length === 0) {
            return 'A';
        }

        const highestVersionCode = existingVersions[existingVersions.length - 1];
        if (highestVersionCode >= 'Z'.charCodeAt(0)) {
            throw new ConflictException('스냅샷 버전이 Z에 도달했습니다. 더 이상 버전을 생성할 수 없습니다.');
        }

        return String.fromCharCode(highestVersionCode + 1);
    }

    /**
     * 해당 연월의 반영 데이터를 조회한다 (EventInfo, UsedAttendance)
     * id를 제외한 필요한 필드만 추출하여 반환합니다.
     */
    private async 해당연월반영데이터를조회한다(
        year: string,
        month: string,
        manager: any,
    ): Promise<{ year: string; month: string; eventInfo: any[]; usedAttendance: any[] }> {
        // 날짜 범위 계산
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const lastDay = new Date(yearNum, monthNum, 0).getDate();
        const endDate = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

        // EventInfo 조회 (yyyymmdd 기준으로 해당 연월 범위 조회, id 제외)
        const eventInfos = await manager
            .createQueryBuilder(EventInfo, 'ei')
            .where('ei.yyyymmdd >= :startDate', { startDate })
            .andWhere('ei.yyyymmdd <= :endDate', { endDate })
            .andWhere('ei.deleted_at IS NULL')
            .orderBy('ei.yyyymmdd', 'ASC')
            .addOrderBy('ei.hhmmss', 'ASC')
            .getMany();

        const eventData = eventInfos.map((event) => ({
            employee_name: event.employee_name,
            employee_number: event.employee_number,
            event_time: event.event_time,
            yyyymmdd: event.yyyymmdd,
            hhmmss: event.hhmmss,
        }));

        // UsedAttendance 조회 (used_at 기준으로 해당 연월 범위 조회, id 제외, attendanceType join)
        const startDateStr = `${year}-${month.padStart(2, '0')}-01`;
        const endDateStr = `${year}-${month.padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

        const usedAttendances = await manager
            .createQueryBuilder(UsedAttendance, 'ua')
            .leftJoinAndSelect('ua.attendanceType', 'at')
            .where('ua.used_at >= :startDate', { startDate: startDateStr })
            .andWhere('ua.used_at <= :endDate', { endDate: endDateStr })
            .andWhere('ua.deleted_at IS NULL')
            .orderBy('ua.used_at', 'ASC')
            .getMany();

        const attendanceData = usedAttendances.map((ua) => ({
            used_at: ua.used_at,
            employee_id: ua.employee_id,
            attendance_type_id: ua.attendance_type_id,
            attendance_type_title: ua.attendanceType?.title || null,
        }));

        return {
            year,
            month,
            eventInfo: eventData,
            usedAttendance: attendanceData,
        };
    }
}
