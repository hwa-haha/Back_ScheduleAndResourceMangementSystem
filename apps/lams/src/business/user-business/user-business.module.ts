import { Module } from '@nestjs/common';
import { UserBusinessService } from './user-business.service';
import { AttendanceIssueContextModule } from '../../context/attendance-issue-context/attendance-issue-context.module';
import { DataSnapshotContextModule } from '../../context/data-snapshot-context/data-snapshot-context.module';
import { DashboardContextModule } from '../../context/dashboard-context/dashboard-context.module';
/**
 * 업무관리시스템 유저용 Business 모듈
 *
 * attendance-issue-context, data-snapshot-context, dashboard-context 를 사용합니다.
 */
@Module({
    imports: [
        AttendanceIssueContextModule,
        DataSnapshotContextModule,
        DashboardContextModule,
    ],
    providers: [UserBusinessService],
    exports: [UserBusinessService],
})
export class UserBusinessModule {}
