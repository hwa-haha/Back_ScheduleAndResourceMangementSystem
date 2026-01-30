import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AttendanceDataContextService } from '../../context/attendance-data-context/attendance-data-context.service';
import { DataSnapshotContextService } from '../../context/data-snapshot-context/data-snapshot-context.service';
import {
    IGetMonthlySummariesResponse,
    IGetMonthlySummariesQuery,
    IGetMonthlySummaryNoteQuery,
    IGetMonthlySummaryNoteResponse,
    IGetDailySummaryHistoryQuery,
    IGetDailySummaryHistoryResponse,
    IGetDailySummaryDetailQuery,
    IGetDailySummaryDetailResponse,
    IUpdateDailySummaryCommand,
    IUpdateDailySummaryResponse,
    IUpdateMonthlySummaryNoteCommand,
    IUpdateMonthlySummaryNoteResponse,
} from '../../context/attendance-data-context/interfaces';
import {
    ISaveCompanyMonthlySnapshotCommand,
    ISaveAttendanceSnapshotResponse,
    IRestoreFromSnapshotCommand,
    IRestoreFromSnapshotResponse,
    IGetSnapshotListQuery,
    IGetSnapshotListResponse,
    IGetSnapshotByIdQuery,
    IGetSnapshotByIdResponse,
} from '../../context/data-snapshot-context/interfaces';
import { FileManagementContextService } from '../../context/file-management-context/file-management-context.service';



/**
 * 출입/근태 데이터 비즈니스 서비스
 *
 * 출입/근태 데이터 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 월간 요약 조회
 */
@Injectable()
export class AttendanceDataBusinessService {
    private readonly logger = new Logger(AttendanceDataBusinessService.name);

    constructor(
        private readonly attendanceDataContextService: AttendanceDataContextService,
        private readonly dataSnapshotContextService: DataSnapshotContextService,
        private readonly fileManagementContextService: FileManagementContextService,
    ) {}

    /**
     * 월간 요약을 조회한다
     *
     * 연도, 월, 부서ID를 기준으로 월간 요약, 일간 요약, 일간 요약의 수정이력을 조회합니다.
     *
     * @param query 조회 조건
     * @returns 월간 요약 조회 결과
     */
    async 월간요약을조회한다(query: IGetMonthlySummariesQuery): Promise<IGetMonthlySummariesResponse> {
        this.logger.log(`월간 요약 조회: year=${query.year}, month=${query.month}, departmentId=${query.departmentId}`);
        return await this.attendanceDataContextService.월간요약을조회한다(query);
    }

    /**
     * 일간 요약을 수정한다
     *
     * 일간 요약의 출근시간, 퇴근시간, 근태유형을 수정하고 수정이력을 생성합니다.
     *
     * @param command 수정 명령
     * @returns 일간 요약 수정 결과
     */
    async 일간요약을수정한다(command: IUpdateDailySummaryCommand): Promise<IUpdateDailySummaryResponse> {
        this.logger.log(`일간 요약 수정: dailySummaryId=${command.dailySummaryId}`);
        return await this.attendanceDataContextService.일간요약을수정한다(command);
    }

    /**
     * 근태 스냅샷을 저장한다
     *
     * 회사 전체 월간 요약 데이터를 스냅샷으로 저장합니다.
     *
     * @param command 저장 명령
     * @returns 스냅샷 저장 결과
     */
    async 근태스냅샷을저장한다(command: ISaveCompanyMonthlySnapshotCommand): Promise<ISaveAttendanceSnapshotResponse> {
        this.logger.log(`근태 스냅샷 저장: year=${command.year}, month=${command.month}`);
        return await this.dataSnapshotContextService.회사전체월간요약스냅샷을저장한다(command);
    }

    /**
     * 스냅샷으로부터 복원한다
     *
     * 선택된 스냅샷 데이터를 기반으로 월간/일간 요약 데이터를 덮어씌웁니다.
     *
     * @param command 복원 명령
     * @returns 복원 결과
     */
    async 스냅샷으로부터복원한다(command: IRestoreFromSnapshotCommand): Promise<IRestoreFromSnapshotResponse> {
        this.logger.log(`스냅샷으로부터 복원: snapshotId=${command.snapshotId}`);

       

        const snapshotData = await this.dataSnapshotContextService.스냅샷을ID로조회한다({
            snapshotId: command.snapshotId,
        });

        await this.dataSnapshotContextService.회사전체월간요약스냅샷을저장한다({
            year: snapshotData.snapshot.yyyy,
            month: snapshotData.snapshot.mm,
            performedBy: command.performedBy,
        }); 

        // 2. children의 rawData를 수집하여 전체 eventInfo와 usedAttendance 재구성
        if (!snapshotData.snapshot.children || snapshotData.snapshot.children.length === 0) {
            throw new NotFoundException('스냅샷에 저장된 자식 데이터가 없습니다.');
        }

        const allEventInfos: any[] = [];
        const allUsedAttendances: any[] = [];

        snapshotData.snapshot.children.forEach((child) => {
            if (child.rawData) {
                if (child.rawData.eventInfo) {
                    allEventInfos.push(...child.rawData.eventInfo);
                }
                if (child.rawData.usedAttendance) {
                    allUsedAttendances.push(...child.rawData.usedAttendance);
                }
            }
        });

        // 3. 스냅샷 데이터로 파일 데이터 복원 (EventInfo, UsedAttendance 복원)
        await this.fileManagementContextService.스냅샷데이터로파일데이터를복원한다(
            {
                year: snapshotData.snapshot.yyyy,
                month: snapshotData.snapshot.mm,
                eventInfos: allEventInfos,
                usedAttendances: allUsedAttendances,
                snapshot: snapshotData.snapshot,
            },
            command.performedBy,
         
        );

        // 3. 일일요약 복원 (스냅샷 데이터에서 내부적으로 추출)
        await this.attendanceDataContextService.일일요약을복원한다({
            snapshotData: snapshotData.snapshot,
            year: snapshotData.snapshot.yyyy,
            month: snapshotData.snapshot.mm,
            performedBy: command.performedBy,
        });
    
        this.logger.log(`일일요약 복원 완료`);

        // 4. 월간요약 복원 (스냅샷 데이터에서 내부적으로 추출)
        await this.attendanceDataContextService.월간요약을복원한다({
            snapshotData: snapshotData.snapshot,
            year: snapshotData.snapshot.yyyy,
            month: snapshotData.snapshot.mm,
            performedBy: command.performedBy,
        });

        return {
            year: snapshotData.snapshot.yyyy,
            month: snapshotData.snapshot.mm,
        };
    }

    /**
     * 스냅샷 목록을 조회한다
     *
     * 연월을 기준으로 스냅샷 데이터를 조회합니다.
     * 기본적으로 가장 최신 스냅샷을 반환하며, 조건 변경에 유연하게 대응할 수 있도록 구성됩니다.
     *
     * @param query 스냅샷 목록 조회 쿼리
     * @returns 스냅샷 목록 조회 결과
     */
    async 스냅샷목록을조회한다(query: IGetSnapshotListQuery): Promise<IGetSnapshotListResponse> {
        this.logger.log(`스냅샷 목록 조회: year=${query.year}, month=${query.month}`);
        return await this.dataSnapshotContextService.스냅샷목록을조회한다(query);
    }

    /**
     * 스냅샷을 ID로 조회한다
     *
     * 스냅샷 ID로 스냅샷과 하위 스냅샷을 조회합니다.
     * 부서 ID를 제공하면 해당 부서의 해당 연월에 소속되었던 직원들의 스냅샷 child 데이터만 반환합니다.
     *
     * @param query 스냅샷 ID 조회 쿼리
     * @returns 스냅샷과 하위 스냅샷 조회 결과
     */
    async 스냅샷을ID로조회한다(query: IGetSnapshotByIdQuery): Promise<IGetSnapshotByIdResponse> {
        this.logger.log(`스냅샷 ID로 조회: snapshotId=${query.snapshotId}, departmentId=${query.departmentId}`);
        return await this.dataSnapshotContextService.스냅샷을ID로조회한다(query);
    }

    /**
     * 일간 요약 수정이력을 조회한다
     *
     * 일간 요약 ID를 기준으로 해당 일간 요약의 수정이력을 조회합니다.
     *
     * @param query 조회 조건
     * @returns 일간 요약 수정이력 조회 결과
     */
    async 일간요약수정이력을조회한다(query: IGetDailySummaryHistoryQuery): Promise<IGetDailySummaryHistoryResponse> {
        this.logger.log(`일간 요약 수정이력 조회: dailyEventSummaryId=${query.dailyEventSummaryId}`);
        return await this.attendanceDataContextService.일간요약수정이력을조회한다(query);
    }

    /**
     * 일간 요약 상세를 조회한다
     *
     * 일간 요약 ID를 기준으로 해당 일간 요약의 상세 정보, 수정이력, 근태 이슈를 조회합니다.
     *
     * @param query 조회 조건
     * @returns 일간 요약 상세 조회 결과
     */
    async 일간요약상세를조회한다(query: IGetDailySummaryDetailQuery): Promise<IGetDailySummaryDetailResponse> {
        this.logger.log(`일간 요약 상세 조회: dailySummaryId=${query.dailySummaryId}`);
        return await this.attendanceDataContextService.일간요약상세를조회한다(query);
    }

    /**
     * 월간 요약 노트를 조회한다
     *
     * 월간 요약 ID를 기준으로 해당 월간 요약의 노트를 조회합니다.
     *
     * @param query 조회 조건
     * @returns 월간 요약 노트 조회 결과
     */
    async 월간요약노트를조회한다(query: IGetMonthlySummaryNoteQuery): Promise<IGetMonthlySummaryNoteResponse> {
        this.logger.log(`월간 요약 노트 조회: monthlySummaryId=${query.monthlySummaryId}`);
        return await this.attendanceDataContextService.월간요약노트를조회한다(query);
    }

    /**
     * 월간 요약 노트를 수정한다
     *
     * 월간 요약의 노트를 수정합니다.
     *
     * @param command 수정 명령
     * @returns 월간 요약 노트 수정 결과
     */
    async 월간요약노트를수정한다(command: IUpdateMonthlySummaryNoteCommand): Promise<IUpdateMonthlySummaryNoteResponse> {
        this.logger.log(`월간 요약 노트 수정: monthlySummaryId=${command.monthlySummaryId}`);
        return await this.attendanceDataContextService.월간요약노트를수정한다(command);
    }
}
