import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UpdateEmployeeDepartmentPermissionCommand } from './update-employee-department-permission.command';
import { IUpdateEmployeeDepartmentPermissionResponse } from '../../../interfaces/response/update-employee-department-permission-response.interface';
import { DomainEmployeeDepartmentPermissionService } from '../../../../../domain/employee-department-permission/employee-department-permission.service';

/**
 * 직원-부서 권한 변경 Handler
 *
 * 부서별로 직원들의 접근권한과 검토권한을 설정합니다.
 * 해당 부서의 모든 기존 권한을 삭제한 후 요청된 직원 권한들을 재생성합니다.
 */
@CommandHandler(UpdateEmployeeDepartmentPermissionCommand)
export class UpdateEmployeeDepartmentPermissionHandler implements ICommandHandler<
    UpdateEmployeeDepartmentPermissionCommand,
    IUpdateEmployeeDepartmentPermissionResponse
> {
    private readonly logger = new Logger(UpdateEmployeeDepartmentPermissionHandler.name);

    constructor(
        private readonly permissionService: DomainEmployeeDepartmentPermissionService,
        private readonly dataSource: DataSource,
    ) {}

    async execute(
        command: UpdateEmployeeDepartmentPermissionCommand,
    ): Promise<IUpdateEmployeeDepartmentPermissionResponse> {
        const { departmentId, employees, performedBy } = command.data;

        return await this.dataSource.transaction(async (manager) => {
            try {
                this.logger.log(
                    `부서별 직원 권한 변경 시작: departmentId=${departmentId}, employees=${employees.length}명`,
                );

                // 해당 부서의 모든 기존 권한 일괄 삭제 (Hard Delete, 이력 기록)
                await this.permissionService.부서로일괄삭제한다(departmentId, manager, performedBy);

                this.logger.log(`기존 권한 일괄 삭제 완료`);

                // 요청된 직원 권한들 재생성 (이력 기록)
                const createdPermissions = [];
                for (const employee of employees) {
                    const permission = await this.permissionService.생성한다(
                        {
                            employeeId: employee.employeeId,
                            departmentId,
                            hasAccessPermission: employee.hasAccessPermission,
                            hasReviewPermission: employee.hasReviewPermission,
                        },
                        manager,
                        performedBy,
                    );
                    createdPermissions.push(permission);
                }

                this.logger.log(`부서별 직원 권한 변경 완료: ${createdPermissions.length}개 권한 생성`);

                return {
                    permissions: createdPermissions,
                };
            } catch (error) {
                this.logger.error(`부서별 직원 권한 변경 실패: ${error.message}`, error.stack);
                throw error;
            }
        });
    }
}
