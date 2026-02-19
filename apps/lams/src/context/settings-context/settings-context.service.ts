import { Injectable } from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import {
    IGetDepartmentListForPermissionQuery,
    IUpdateEmployeeDepartmentPermissionCommand,
    IUpdateEmployeeExtraInfoCommand,
    IGetHolidayListQuery,
    IGetHolidayQuery,
    IGetWorkTimeOverrideListQuery,
    IGetWorkTimeOverrideQuery,
    IGetAttendanceTypeListQuery,
    IGetWageCalculationTypeListQuery,
    IGetDepartmentListForPermissionResponse,
    IGetPermissionRelatedEmployeeListQuery,
    IGetPermissionRelatedEmployeeListResponse,
    IGetEmployeePermissionListQuery,
    IGetEmployeePermissionListResponse,
    IGetDepartmentPermissionListQuery,
    IGetDepartmentPermissionListResponse,
    IGetEmployeeExtraInfoListQuery,
    IGetEmployeeExtraInfoListResponse,
    IGetHolidayListResponse,
    IGetHolidayResponse,
    IGetWorkTimeOverrideListResponse,
    IGetWorkTimeOverrideResponse,
    IGetAttendanceTypeListResponse,
    IGetWageCalculationTypeListResponse,
    IUpdateEmployeeDepartmentPermissionResponse,
    IUpdateEmployeeExtraInfoResponse,
    ICreateHolidayInfoCommand,
    IUpdateHolidayInfoCommand,
    IDeleteHolidayInfoCommand,
    ICreateWorkTimeOverrideCommand,
    IUpdateWorkTimeOverrideCommand,
    IDeleteWorkTimeOverrideCommand,
    ICreateAttendanceTypeCommand,
    ICreateWageCalculationTypeCommand,
    IUpdateAttendanceTypeCommand,
    IDeleteAttendanceTypeCommand,
    ICreateHolidayInfoResponse,
    IUpdateHolidayInfoResponse,
    IDeleteHolidayInfoResponse,
    ICreateWorkTimeOverrideResponse,
    IUpdateWorkTimeOverrideResponse,
    IDeleteWorkTimeOverrideResponse,
    ICreateAttendanceTypeResponse,
    ICreateWageCalculationTypeResponse,
    IUpdateAttendanceTypeResponse,
    IDeleteAttendanceTypeResponse,
} from './interfaces';
import { GetDepartmentListForPermissionQuery } from './handlers/department/queries/get-department-list-for-permission.query';
import { GetPermissionRelatedEmployeeListQuery } from './handlers/permission/queries/get-permission-related-employee-list.query';
import { GetEmployeePermissionListQuery } from './handlers/permission/queries/get-employee-permission-list.query';
import { GetDepartmentPermissionListQuery } from './handlers/permission/queries/get-department-permission-list.query';
import { GetEmployeeExtraInfoListQuery } from './handlers/employee-extra-info/queries/get-employee-extra-info-list.query';
import { GetHolidayListQuery } from './handlers/holiday-info/queries/get-holiday-list.query';
import { GetHolidayQuery } from './handlers/holiday-info/queries/get-holiday.query';
import { GetWorkTimeOverrideListQuery } from './handlers/work-time-override/queries/get-work-time-override-list.query';
import { GetWorkTimeOverrideQuery } from './handlers/work-time-override/queries/get-work-time-override.query';
import { GetAttendanceTypeListQuery } from './handlers/attendance-type/queries/get-attendance-type-list.query';
import { GetWageCalculationTypeListQuery } from './handlers/wage-calculation-type/queries/get-wage-calculation-type-list.query';
import { UpdateEmployeeDepartmentPermissionCommand } from './handlers/permission/commands/update-employee-department-permission.command';
import { UpdateEmployeeExtraInfoCommand } from './handlers/employee-extra-info/commands/update-employee-extra-info.command';
import { CreateHolidayInfoCommand } from './handlers/holiday-info/commands/create-holiday-info.command';
import { UpdateHolidayInfoCommand } from './handlers/holiday-info/commands/update-holiday-info.command';
import { DeleteHolidayInfoCommand } from './handlers/holiday-info/commands/delete-holiday-info.command';
import { CreateWorkTimeOverrideCommand } from './handlers/work-time-override/commands/create-work-time-override.command';
import { UpdateWorkTimeOverrideCommand } from './handlers/work-time-override/commands/update-work-time-override.command';
import { DeleteWorkTimeOverrideCommand } from './handlers/work-time-override/commands/delete-work-time-override.command';
import { CreateAttendanceTypeCommand } from './handlers/attendance-type/commands/create-attendance-type.command';
import { CreateWageCalculationTypeCommand } from './handlers/wage-calculation-type/commands/create-wage-calculation-type.command';
import { UpdateAttendanceTypeCommand } from './handlers/attendance-type/commands/update-attendance-type.command';
import { DeleteAttendanceTypeCommand } from './handlers/attendance-type/commands/delete-attendance-type.command';

/**
 * 설정 관리 Context 서비스
 *
 * 설정 관리 관련 비즈니스 로직을 처리합니다.
 */
@Injectable()
export class SettingsContextService {
    constructor(
        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
    ) {}

    /**
     * 권한 관련 부서 목록을 조회한다
     */
    async 권한관련부서목록을조회한다(
        query: IGetDepartmentListForPermissionQuery,
    ): Promise<IGetDepartmentListForPermissionResponse> {
        return await this.queryBus.execute(new GetDepartmentListForPermissionQuery(query));
    }

    /**
     * 권한 관련 직원 목록을 조회한다 (권한 정보만, 추가정보 제외)
     */
    async 권한관련직원목록을조회한다(
        query: IGetPermissionRelatedEmployeeListQuery,
    ): Promise<IGetPermissionRelatedEmployeeListResponse> {
        return await this.queryBus.execute(new GetPermissionRelatedEmployeeListQuery(query));
    }

    /**
     * 권한 관련 직원 목록 및 추가정보를 조회한다 (두 조회 결과 병합)
     */
    async 권한관련직원목록및추가정보를조회한다(
        query: IGetPermissionRelatedEmployeeListQuery,
    ): Promise<IGetPermissionRelatedEmployeeListResponse> {
        const [permissionResult, extraInfoResult] = await Promise.all([
            this.queryBus.execute(new GetPermissionRelatedEmployeeListQuery(query)),
            this.queryBus.execute(new GetEmployeeExtraInfoListQuery({})),
        ]);

        const extraInfoByEmployeeId = new Map(extraInfoResult.employees.map((e) => [e.id, e.extraInfo]));

        const employees = permissionResult.employees.map((emp) => ({
            ...emp,
            extraInfo: extraInfoByEmployeeId.get(emp.id) ?? null,
        }));

        return {
            employees,
            totalCount: permissionResult.totalCount,
        };
    }

    /**
     * 직원의 권한 목록을 조회한다
     */
    async 직원의권한목록을조회한다(
        query: IGetEmployeePermissionListQuery,
    ): Promise<IGetEmployeePermissionListResponse> {
        return await this.queryBus.execute(new GetEmployeePermissionListQuery(query));
    }

    /**
     * 특정 부서별 직원 권한 목록을 조회한다
     */
    async 부서별직원권한목록을조회한다(
        query: IGetDepartmentPermissionListQuery,
    ): Promise<IGetDepartmentPermissionListResponse> {
        return await this.queryBus.execute(new GetDepartmentPermissionListQuery(query));
    }

    /**
     * 직원 목록 및 추가정보를 조회한다
     */
    async 직원목록및추가정보를조회한다(
        query: IGetEmployeeExtraInfoListQuery,
    ): Promise<IGetEmployeeExtraInfoListResponse> {
        return await this.queryBus.execute(new GetEmployeeExtraInfoListQuery(query));
    }

    /**
     * 휴일 목록을 조회한다
     */
    async 휴일목록을조회한다(query: IGetHolidayListQuery): Promise<IGetHolidayListResponse> {
        return await this.queryBus.execute(new GetHolidayListQuery(query));
    }

    /**
     * 휴일 정보를 조회한다 (id 또는 date로 단건 조회)
     */
    async 휴일정보를조회한다(query: IGetHolidayQuery): Promise<IGetHolidayResponse> {
        return await this.queryBus.execute(new GetHolidayQuery(query));
    }

    /**
     * 특별근태시간 목록을 조회한다
     */
    async 특별근태시간목록을조회한다(query: IGetWorkTimeOverrideListQuery): Promise<IGetWorkTimeOverrideListResponse> {
        return await this.queryBus.execute(new GetWorkTimeOverrideListQuery(query));
    }

    /**
     * 특별근태시간을 조회한다 (id 또는 date로 단건 조회)
     */
    async 특별근태시간을조회한다(query: IGetWorkTimeOverrideQuery): Promise<IGetWorkTimeOverrideResponse> {
        return await this.queryBus.execute(new GetWorkTimeOverrideQuery(query));
    }

    /**
     * 직원-부서 권한을 변경한다
     */
    async 직원부서권한을변경한다(
        command: IUpdateEmployeeDepartmentPermissionCommand,
    ): Promise<IUpdateEmployeeDepartmentPermissionResponse> {
        return await this.commandBus.execute(new UpdateEmployeeDepartmentPermissionCommand(command));
    }

    /**
     * 직원 추가 정보를 변경한다
     */
    async 직원추가정보를변경한다(command: IUpdateEmployeeExtraInfoCommand): Promise<IUpdateEmployeeExtraInfoResponse> {
        return await this.commandBus.execute(new UpdateEmployeeExtraInfoCommand(command));
    }

    /**
     * 휴일 정보를 생성한다
     */
    async 휴일정보를생성한다(command: ICreateHolidayInfoCommand): Promise<ICreateHolidayInfoResponse> {
        return await this.commandBus.execute(new CreateHolidayInfoCommand(command));
    }

    /**
     * 휴일 정보를 수정한다
     */
    async 휴일정보를수정한다(command: IUpdateHolidayInfoCommand): Promise<IUpdateHolidayInfoResponse> {
        return await this.commandBus.execute(new UpdateHolidayInfoCommand(command));
    }

    /**
     * 휴일 정보를 삭제한다
     */
    async 휴일정보를삭제한다(command: IDeleteHolidayInfoCommand): Promise<IDeleteHolidayInfoResponse> {
        return await this.commandBus.execute(new DeleteHolidayInfoCommand(command));
    }

    /**
     * 특별근태시간을 생성한다
     */
    async 특별근태시간을생성한다(command: ICreateWorkTimeOverrideCommand): Promise<ICreateWorkTimeOverrideResponse> {
        return await this.commandBus.execute(new CreateWorkTimeOverrideCommand(command));
    }

    /**
     * 특별근태시간을 수정한다
     */
    async 특별근태시간을수정한다(command: IUpdateWorkTimeOverrideCommand): Promise<IUpdateWorkTimeOverrideResponse> {
        return await this.commandBus.execute(new UpdateWorkTimeOverrideCommand(command));
    }

    /**
     * 특별근태시간을 삭제한다
     */
    async 특별근태시간을삭제한다(command: IDeleteWorkTimeOverrideCommand): Promise<IDeleteWorkTimeOverrideResponse> {
        return await this.commandBus.execute(new DeleteWorkTimeOverrideCommand(command));
    }

    /**
     * 근태유형 목록을 조회한다
     */
    async 근태유형목록을조회한다(query: IGetAttendanceTypeListQuery): Promise<IGetAttendanceTypeListResponse> {
        return await this.queryBus.execute(new GetAttendanceTypeListQuery(query));
    }

    /**
     * 임금 계산 유형 목록을 조회한다
     */
    async 임금계산유형목록을조회한다(
        query: IGetWageCalculationTypeListQuery,
    ): Promise<IGetWageCalculationTypeListResponse> {
        return await this.queryBus.execute(new GetWageCalculationTypeListQuery(query));
    }

    /**
     * 임금 계산 유형을 생성한다
     */
    async 임금계산유형을생성한다(
        command: ICreateWageCalculationTypeCommand,
    ): Promise<ICreateWageCalculationTypeResponse> {
        return await this.commandBus.execute(new CreateWageCalculationTypeCommand(command));
    }

    /**
     * 근태유형을 생성한다
     */
    async 근태유형을생성한다(command: ICreateAttendanceTypeCommand): Promise<ICreateAttendanceTypeResponse> {
        return await this.commandBus.execute(new CreateAttendanceTypeCommand(command));
    }

    /**
     * 근태유형을 수정한다
     */
    async 근태유형을수정한다(command: IUpdateAttendanceTypeCommand): Promise<IUpdateAttendanceTypeResponse> {
        return await this.commandBus.execute(new UpdateAttendanceTypeCommand(command));
    }

    /**
     * 근태유형을 삭제한다
     */
    async 근태유형을삭제한다(command: IDeleteAttendanceTypeCommand): Promise<IDeleteAttendanceTypeResponse> {
        return await this.commandBus.execute(new DeleteAttendanceTypeCommand(command));
    }
}
