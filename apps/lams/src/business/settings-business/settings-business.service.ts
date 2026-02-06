import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';
import { SettingsContextService } from '../../context/settings-context/settings-context.service';
import { AttendanceDataContextService } from '../../context/attendance-data-context/attendance-data-context.service';
import {
    IGetDepartmentListForPermissionQuery,
    IGetHolidayListQuery,
    IGetWorkTimeOverrideListQuery,
    IGetAttendanceTypeListQuery,
    IGetDepartmentListForPermissionResponse,
    IGetPermissionRelatedEmployeeListQuery,
    IGetPermissionRelatedEmployeeListResponse,
    IGetEmployeePermissionListQuery,
    IGetEmployeePermissionListResponse,
    IGetHolidayListResponse,
    IGetWorkTimeOverrideListResponse,
    IGetAttendanceTypeListResponse,
    IUpdateEmployeeDepartmentPermissionCommand,
    IUpdateEmployeeExtraInfoCommand,
    ICreateHolidayInfoCommand,
    IUpdateHolidayInfoCommand,
    IDeleteHolidayInfoCommand,
    ICreateWorkTimeOverrideCommand,
    IUpdateWorkTimeOverrideCommand,
    IDeleteWorkTimeOverrideCommand,
    ICreateAttendanceTypeCommand,
    IUpdateAttendanceTypeCommand,
    IDeleteAttendanceTypeCommand,
    IUpdateEmployeeDepartmentPermissionResponse,
    IUpdateEmployeeExtraInfoResponse,
    ICreateHolidayInfoResponse,
    IUpdateHolidayInfoResponse,
    IDeleteHolidayInfoResponse,
    ICreateWorkTimeOverrideResponse,
    IUpdateWorkTimeOverrideResponse,
    IDeleteWorkTimeOverrideResponse,
    ICreateAttendanceTypeResponse,
    IUpdateAttendanceTypeResponse,
    IDeleteAttendanceTypeResponse,
} from '../../context/settings-context/interfaces';

/**
 * 설정 관리 Business 서비스
 *
 * 설정 관리 관련 비즈니스 로직을 조합합니다.
 */
@Injectable()
export class SettingsBusinessService {
    constructor(
        private readonly settingsContextService: SettingsContextService,
        private readonly attendanceDataContextService: AttendanceDataContextService,
    ) {}

    /**
     * 권한 관련 부서 목록을 조회한다
     */
    async 권한관련부서목록을조회한다(
        query: IGetDepartmentListForPermissionQuery,
    ): Promise<IGetDepartmentListForPermissionResponse> {
        return await this.settingsContextService.권한관련부서목록을조회한다(query);
    }

    /**
     * 권한 관련 직원 목록을 조회한다
     */
    async 권한관련직원목록을조회한다(
        query: IGetPermissionRelatedEmployeeListQuery,
    ): Promise<IGetPermissionRelatedEmployeeListResponse> {
        return await this.settingsContextService.권한관련직원목록을조회한다(query);
    }

    /**
     * 직원의 권한 목록을 조회한다
     */
    async 직원의권한목록을조회한다(
        query: IGetEmployeePermissionListQuery,
    ): Promise<IGetEmployeePermissionListResponse> {
        return await this.settingsContextService.직원의권한목록을조회한다(query);
    }

    /**
     * 직원-부서 권한을 변경한다
     */
    async 직원부서권한을변경한다(
        command: IUpdateEmployeeDepartmentPermissionCommand,
    ): Promise<IUpdateEmployeeDepartmentPermissionResponse> {
        return await this.settingsContextService.직원부서권한을변경한다(command);
    }

    /**
     * 휴일 목록을 조회한다
     */
    async 휴일목록을조회한다(query: IGetHolidayListQuery): Promise<IGetHolidayListResponse> {
        return await this.settingsContextService.휴일목록을조회한다(query);
    }

    /**
     * 특별근태시간 목록을 조회한다
     */
    async 특별근태시간목록을조회한다(query: IGetWorkTimeOverrideListQuery): Promise<IGetWorkTimeOverrideListResponse> {
        return await this.settingsContextService.특별근태시간목록을조회한다(query);
    }

    /**
     * 직원 추가 정보를 변경한다
     * 연도와 월이 제공되면:
     * - isExcludedFromSummary가 true인 경우: 해당 직원의 해당 연월 일간/월간 요약을 생성한다.
     * - isExcludedFromSummary가 false인 경우: 해당 직원의 해당 연월 일간/월간 요약을 소프트 삭제한다.
     */
    async 직원추가정보를변경한다(command: IUpdateEmployeeExtraInfoCommand): Promise<IUpdateEmployeeExtraInfoResponse> {
        const result = await this.settingsContextService.직원추가정보를변경한다(command);

        // 연도와 월이 제공되면 해당 직원의 해당 연월 일간/월간 요약 처리
        if (command.year && command.month) {
            if (!command.isExcludedFromSummary) {
                // 제외 상태로 변경: 요약 생성 (해당 직원만 생성)
                await this.attendanceDataContextService.특정직원요약을생성한다(
                    command.employeeId,
                    command.year,
                    command.month,
                    command.performedBy,
                );
            } else {
                // 포함 상태로 변경: 기존 요약 소프트 삭제
                await this.attendanceDataContextService.특정직원요약을소프트삭제한다({
                    employeeId: command.employeeId,
                    year: command.year,
                    month: command.month,
                    performedBy: command.performedBy,
                });
            }
        }

        return result;
    }

    /**
     * 휴일 정보를 생성한다
     * 생성 후 해당 휴일 날짜 기준으로 일간 요약 재판정 및 월간 요약 생성을 실행한다.
     */
    async 휴일정보를생성한다(command: ICreateHolidayInfoCommand): Promise<ICreateHolidayInfoResponse> {
        const result = await this.settingsContextService.휴일정보를생성한다(command);
        await this.attendanceDataContextService.일간요약재판정후월간요약을생성한다(
            command.holidayDate,
            command.performedBy,
        );
        return result;
    }

    /**
     * 휴일 정보를 수정한다
     * 수정 후 기존 날짜와 변경된 날짜 양쪽 모두에 대해 일간 요약 재판정 및 월간 요약 생성을 실행한다.
     */
    async 휴일정보를수정한다(command: IUpdateHolidayInfoCommand): Promise<IUpdateHolidayInfoResponse> {
        // 수정 전 기존 휴일 정보 조회
        const existingHoliday = await this.settingsContextService.휴일정보를조회한다({
            id: command.id,
        });
        const oldDate = existingHoliday.holiday.holidayDate;

        // 수정 실행
        const result = await this.settingsContextService.휴일정보를수정한다(command);
        const newDate = command.holidayDate ?? undefined;

        // 기존 날짜와 변경된 날짜 모두 재판정
        const datesToReprocess = new Set<string>();
        if (oldDate) {
            datesToReprocess.add(oldDate);
        }
        if (newDate) {
            datesToReprocess.add(newDate);
        }

        // 각 날짜에 대해 재판정 실행
        for (const date of datesToReprocess) {
            await this.attendanceDataContextService.일간요약재판정후월간요약을생성한다(date, command.performedBy);
        }

        return result;
    }

    /**
     * 휴일 정보를 삭제한다
     * 삭제 후 오늘 날짜 기준으로 일간 요약 재판정 및 월간 요약 생성을 실행한다.
     */
    async 휴일정보를삭제한다(command: IDeleteHolidayInfoCommand): Promise<IDeleteHolidayInfoResponse> {
        const holidayInfo = await this.settingsContextService.휴일정보를조회한다({
            id: command.id,
        });
        const date = holidayInfo.holiday.holidayDate;
        const result = await this.settingsContextService.휴일정보를삭제한다(command);
        if (date) {
            await this.attendanceDataContextService.일간요약재판정후월간요약을생성한다(date, command.performedBy);
        }
        return result;
    }

    /**
     * 특별근태시간을 생성한다
     * 생성 후 해당 날짜 기준으로 일간 요약 재판정 및 월간 요약 생성을 실행한다.
     */
    async 특별근태시간을생성한다(command: ICreateWorkTimeOverrideCommand): Promise<ICreateWorkTimeOverrideResponse> {
        const result = await this.settingsContextService.특별근태시간을생성한다(command);
        await this.attendanceDataContextService.일간요약재판정후월간요약을생성한다(command.date, command.performedBy);
        return result;
    }

    /**
     * 특별근태시간을 수정한다
     * 수정 후 기존 날짜와 변경된 날짜 양쪽 모두에 대해 일간 요약 재판정 및 월간 요약 생성을 실행한다.
     */
    async 특별근태시간을수정한다(command: IUpdateWorkTimeOverrideCommand): Promise<IUpdateWorkTimeOverrideResponse> {
        // 수정 전 기존 특별근태시간 정보 조회
        const existingWorkTimeOverride = await this.settingsContextService.특별근태시간을조회한다({
            id: command.id,
        });
        const oldDate = existingWorkTimeOverride.workTimeOverride.date;

        // 수정 실행
        const result = await this.settingsContextService.특별근태시간을수정한다(command);
        const newDate = command.date ?? undefined;

        // 기존 날짜와 변경된 날짜 모두 재판정
        const datesToReprocess = new Set<string>();
        if (oldDate) {
            datesToReprocess.add(oldDate);
        }
        if (newDate) {
            datesToReprocess.add(newDate);
        }

        // 각 날짜에 대해 재판정 실행
        for (const date of datesToReprocess) {
            await this.attendanceDataContextService.일간요약재판정후월간요약을생성한다(date, command.performedBy);
        }

        return result;
    }

    /**
     * 특별근태시간을 삭제한다
     * 삭제 전 해당 특별근태시간의 적용 날짜를 조회한 뒤, 삭제 후 해당 날짜 기준으로 일간 요약 재판정 및 월간 요약 생성을 실행한다.
     */
    async 특별근태시간을삭제한다(command: IDeleteWorkTimeOverrideCommand): Promise<IDeleteWorkTimeOverrideResponse> {
        const workTimeOverride = await this.settingsContextService.특별근태시간을조회한다({
            id: command.id,
        });
        const date = workTimeOverride.workTimeOverride.date;
        const result = await this.settingsContextService.특별근태시간을삭제한다(command);
        if (date) {
            await this.attendanceDataContextService.일간요약재판정후월간요약을생성한다(date, command.performedBy);
        }
        return result;
    }

    /**
     * 근태유형 목록을 조회한다
     */
    async 근태유형목록을조회한다(query: IGetAttendanceTypeListQuery): Promise<IGetAttendanceTypeListResponse> {
        return await this.settingsContextService.근태유형목록을조회한다(query);
    }

    /**
     * 근태유형을 생성한다
     */
    async 근태유형을생성한다(command: ICreateAttendanceTypeCommand): Promise<ICreateAttendanceTypeResponse> {
        return await this.settingsContextService.근태유형을생성한다(command);
    }

    /**
     * 근태유형을 수정한다
     */
    async 근태유형을수정한다(command: IUpdateAttendanceTypeCommand): Promise<IUpdateAttendanceTypeResponse> {
        return await this.settingsContextService.근태유형을수정한다(command);
    }

    /**
     * 근태유형을 삭제한다
     */
    async 근태유형을삭제한다(command: IDeleteAttendanceTypeCommand): Promise<IDeleteAttendanceTypeResponse> {
        return await this.settingsContextService.근태유형을삭제한다(command);
    }
}
