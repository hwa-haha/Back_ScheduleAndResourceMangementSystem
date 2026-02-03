import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ApprovalContextService } from './approval-context.service';
import { QUERY_HANDLERS, COMMAND_HANDLERS } from './handlers';
import { DomainEmployeeDepartmentPermissionModule } from '../../domain/employee-department-permission/employee-department-permission.module';
import { DomainDataSnapshotInfoModule } from '../../domain/data-snapshot-info/data-snapshot-info.module';
import { DomainEmployeeDepartmentPositionHistoryModule } from '@libs/modules/employee-department-position-history/employee-department-position-history.module';
import { DomainDepartmentModule } from '@libs/modules/department/department.module';

/**
 * 결재 Context 모듈
 *
 * 결재 관련 부서별 권한자 조회, 스냅샷 결재 필드 업데이트, 결재시 스냅샷 내용 보기를 제공합니다.
 */
@Module({
    imports: [
        CqrsModule,
        DomainEmployeeDepartmentPermissionModule,
        DomainDataSnapshotInfoModule,
        DomainEmployeeDepartmentPositionHistoryModule,
        DomainDepartmentModule,
    ],
    providers: [ApprovalContextService, ...QUERY_HANDLERS, ...COMMAND_HANDLERS],
    exports: [ApprovalContextService],
})
export class ApprovalContextModule {}
