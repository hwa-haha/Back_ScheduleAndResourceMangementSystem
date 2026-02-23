import { Module } from '@nestjs/common';
import { UserBusinessService } from './user-business.service';
import { AttendanceIssueContextModule } from '../../context/attendance-issue-context/attendance-issue-context.module';
import { DashboardContextModule } from '../../context/dashboard-context/dashboard-context.module';
/**
 * 업무관리시스템 유저용 Business 모듈
 *
 * attendance-issue-context, data-snapshot-context 를 그대로 사용합니다.
 */
@Module({
    imports: [AttendanceIssueContextModule, DashboardContextModule],
    providers: [UserBusinessService],
    exports: [UserBusinessService],
})
export class UserBusinessModule {}
