import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
    SaveCompanyMonthlySnapshotCommand,
    GetSnapshotListQuery,
    GetSnapshotByIdQuery,
    CheckEmployeeSnapshotExistsQuery,
} from './handlers';
import {
    ISaveAttendanceSnapshotResponse,
    ISaveCompanyMonthlySnapshotCommand,
    IGetSnapshotListQuery,
    IGetSnapshotListResponse,
    IGetSnapshotByIdQuery,
    IGetSnapshotByIdResponse,
    ICheckEmployeeSnapshotExistsQuery,
    ICheckEmployeeSnapshotExistsResponse,
} from './interfaces';

/**
 * 데이터 스냅샷 Context Service
 *
 * CommandBus와 QueryBus를 통해 Handler를 호출하는 서비스 레이어입니다.
 */
@Injectable()
export class DataSnapshotContextService {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    /**
     * 회사 전체 월간 요약을 하나의 스냅샷으로 저장한다
     */
    async 회사전체월간요약스냅샷을저장한다(
        command: ISaveCompanyMonthlySnapshotCommand,
    ): Promise<ISaveAttendanceSnapshotResponse> {
        const commandInstance = new SaveCompanyMonthlySnapshotCommand(command);
        return await this.commandBus.execute(commandInstance);
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
        const queryInstance = new GetSnapshotListQuery(query);
        return await this.queryBus.execute(queryInstance);
    }

    /**
     * 스냅샷 ID로 스냅샷과 하위 스냅샷을 조회한다
     *
     * @param query 스냅샷 ID 조회 쿼리
     * @returns 스냅샷과 하위 스냅샷 조회 결과
     */
    async 스냅샷을ID로조회한다(query: IGetSnapshotByIdQuery): Promise<IGetSnapshotByIdResponse> {
        return await this.queryBus.execute(new GetSnapshotByIdQuery(query));
    }

    /**
     * 해당 직원의 해당 연월 스냅샷 데이터 존재 여부를 조회한다
     *
     * 근태 상세 조회와 동일한 기준(연월·MONTHLY 타입·해당 직원 child)으로 존재 여부만 반환합니다.
     */
    async 해당직원해당연월스냅샷존재여부를조회한다(
        query: ICheckEmployeeSnapshotExistsQuery,
    ): Promise<ICheckEmployeeSnapshotExistsResponse> {
        return await this.queryBus.execute(new CheckEmployeeSnapshotExistsQuery(query));
    }
}
