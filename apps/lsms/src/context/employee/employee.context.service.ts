import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Department, DepartmentType } from '@libs/modules/department/department.entity';
import { Employee } from '@libs/modules/employee/employee.entity';
import { DomainEmployeeExtraInfoService } from '../../domain/employee-extra-info/employee-extra-info.service';
import { EmployeeExtraInfo } from '../../domain/employee-extra-info/employee-extra-info.entity';
import { EmployeeDepartmentPosition } from '@libs/modules/employee-department-position/employee-department-position.entity';
import { DomainPositionService } from '@libs/modules/position/position.service';
import { Role } from '../../../libs/enums/role-type.enum';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { EmployeeResponseDto } from '../../business/employee-management/dtos/employee-response.dto';
import { EmplyeesByDepartmentResponseDto } from '../../business/employee-management/dtos/employees-by-department-response.dto';
import { UserResponseDto } from '../../business/employee-management/dtos/user-response.dto';
import { ChangeRoleDto } from '../../business/employee-management/dtos/change-role.dto';
import { UpdateNotificationSettingsDto } from '../../business/employee-management/dtos/notification-settings.dto';
import { ERROR_MESSAGE } from '../../../libs/constants/error-message';
import * as bcrypt from 'bcryptjs';
import axios from 'axios';
// import { EmployeeMicroserviceAdapter } from '../../../../../libs/temp/employee/adapters/employee-microservice.adapter';
// import { DepartmentMicroserviceAdapter } from '../../domain/department/adapters/department-microservice.adapter';
// import { DepartmentHierarchyResponseDto } from '../../domain/department/dtos/department-response.dto';

/** 루미르 주식회사 최상위 부서 ID (departments-info 기준 고정값) */
const LUMIR_ROOT_DEPARTMENT_ID = '0152150e-dbdf-45a4-8657-3615bdeaec28';

@Injectable()
export class EmployeeContextService {
    private readonly logger = new Logger(EmployeeContextService.name);
    private readonly departmentRepository: Repository<Department>;
    private readonly employeeRepository: Repository<Employee>;
    private readonly employeeExtraInfoRepository: Repository<EmployeeExtraInfo>;
    private readonly edpRepository: Repository<EmployeeDepartmentPosition>;

    /** 기본 Position ID 캐시 (positionCode = 'STAFF') */
    private staffPositionId: string | null = null;

    constructor(
        private readonly domainEmployeeExtraInfoService: DomainEmployeeExtraInfoService,
        private readonly domainPositionService: DomainPositionService,
        // private readonly employeeMicroserviceAdapter: EmployeeMicroserviceAdapter,
        // private readonly departmentMicroserviceAdapter: DepartmentMicroserviceAdapter,
        private readonly dataSource: DataSource,
    ) {
        this.departmentRepository = this.dataSource.getRepository(Department);
        this.employeeRepository = this.dataSource.getRepository(Employee);
        this.employeeExtraInfoRepository = this.dataSource.getRepository(EmployeeExtraInfo);
        this.edpRepository = this.dataSource.getRepository(EmployeeDepartmentPosition);
    }

    /**
     * STAFF 기본 Position ID를 가져온다 (캐시)
     */
    private async STAFF_직책ID를_가져온다(): Promise<string | null> {
        if (this.staffPositionId) return this.staffPositionId;
        const rows: any[] = await this.dataSource.query(
            `SELECT id FROM positions WHERE "positionCode" = 'STAFF' LIMIT 1`,
        );
        this.staffPositionId = rows[0]?.id ?? null;
        return this.staffPositionId;
    }

    /**
     * EDP에 존재하는 부서 ID 집합을 반환한다 (루미르 하위 부서 중 직원이 배치된 부서만)
     */
    private async EDP에_존재하는_부서ID_집합을_조회한다(): Promise<Set<string>> {
        const rows = await this.edpRepository
            .createQueryBuilder('edp')
            .select('DISTINCT edp."departmentId"', 'departmentId')
            .getRawMany();
        return new Set(rows.map((r) => r.departmentId));
    }

    /**
     * 루미르 최상위 부서의 모든 하위 부서 ID를 재귀적으로 수집한다
     */
    private async 루미르_하위부서_ID_목록을_조회한다(): Promise<string[]> {
        const allDepts = await this.departmentRepository.find();
        const allIds: string[] = [];

        const collect = (parentId: string) => {
            const children = allDepts.filter((d) => d.parentDepartmentId === parentId);
            for (const child of children) {
                allIds.push(child.id);
                collect(child.id);
            }
        };
        collect(LUMIR_ROOT_DEPARTMENT_ID);
        return allIds;
    }

    /**
     * EDP 기반으로 유효한 부서 목록을 조회한다
     * - 루미르 최상위 부서의 하위 부서 중 EDP에 직원이 배치된 부서만 반환
     */
    private async EDP_기반_유효부서_목록을_조회한다(): Promise<Department[]> {
        const [subDeptIds, edpDeptIds] = await Promise.all([
            this.루미르_하위부서_ID_목록을_조회한다(),
            this.EDP에_존재하는_부서ID_집합을_조회한다(),
        ]);
        const validIds = subDeptIds.filter((id) => edpDeptIds.has(id));
        if (validIds.length === 0) return [];
        return this.departmentRepository.find({
            where: { id: In(validIds) },
            order: { order: 'ASC' },
        });
    }

    /**
     * employee_extra_info에서 LSMS 전용 필드를 조회한다
     */
    private async 추가정보를_조회한다(employeeIds: string[]): Promise<Map<string, EmployeeExtraInfo>> {
        if (employeeIds.length === 0) return new Map();
        const rows = await this.employeeExtraInfoRepository.find({
            where: { employee_id: In(employeeIds) },
        });
        return new Map(rows.map((r) => [r.employee_id, r]));
    }

    /**
     * EDP(employee_department_positions)에서 부서명을 조회한다
     */
    private async EDP_부서정보를_조회한다(employeeIds: string[]): Promise<Map<string, string>> {
        if (employeeIds.length === 0) return new Map();
        const edps = await this.edpRepository.find({
            where: { employeeId: In(employeeIds) },
            relations: ['department'],
        });
        const result = new Map<string, string>();
        edps.forEach((edp) => {
            if (!result.has(edp.employeeId) && edp.department) {
                result.set(edp.employeeId, edp.department.departmentName);
            }
        });
        return result;
    }

    /**
     * libs Employee + EDP + extra_info 를 조합하여 DTO를 조립한다
     * @param employees 직원 목록
     * @param overrideDeptMap 외부에서 이미 조회한 부서명 맵 (있으면 EDP 재조회 생략)
     */
    private async 직원DTO를_조립한다(
        employees: Employee[],
        overrideDeptMap?: Map<string, string>,
    ): Promise<
        Array<
            EmployeeResponseDto & {
                email: string;
                mobile: string;
                status: string;
                roles: string[];
                isPushNotificationEnabled: boolean;
                isHiddenInFilter: boolean;
                subscriptions: any;
            }
        >
    > {
        const employeeIds = employees.map((e) => e.id);

        const extraMap = await this.추가정보를_조회한다(employeeIds);
        const deptMap = overrideDeptMap ?? (await this.EDP_부서정보를_조회한다(employeeIds));

        return employees.map((emp) => {
            const extra = extraMap.get(emp.id);
            const departmentName = deptMap.get(emp.id) ?? '';

            return {
                employeeId: emp.id,
                employeeNumber: emp.employeeNumber,
                name: emp.name,
                email: emp.email ?? '',
                mobile: emp.phoneNumber ?? '',
                rank: emp.rank?.rankTitle ?? '',
                position: emp.rank?.rankTitle ?? '',
                positionTitle: emp.rank?.rankTitle ?? '',
                department: departmentName,
                status: (emp.status as string) ?? '',
                roles: extra?.roles ?? [Role.USER],
                isPushNotificationEnabled: extra?.is_push_notification_enabled ?? true,
                isHiddenInFilter: extra?.is_hidden_in_filter ?? false,
                subscriptions: extra?.subscriptions ?? null,
            };
        });
    }

    async 시스템관리자_목록을_조회한다(): Promise<Employee[]> {
        const extras = await this.employeeExtraInfoRepository
            .createQueryBuilder('extra')
            .where(`'${Role.SYSTEM_ADMIN}' = ANY(extra.roles)`)
            .getMany();
        const employeeIds = extras.map((e) => e.employee_id);
        if (employeeIds.length === 0) return [];
        return this.employeeRepository.find({ where: { id: In(employeeIds) } });
    }

    /**
     * 자원 관리자 목록을 부서별로 조회한다 (EDP 기반)
     */
    async 자원관리자_목록을_조회한다(): Promise<EmplyeesByDepartmentResponseDto[]> {
        const extras = await this.employeeExtraInfoRepository
            .createQueryBuilder('extra')
            .where(`'${Role.RESOURCE_ADMIN}' = ANY(extra.roles)`)
            .getMany();
        const extraEmployeeIds = new Set(extras.map((e) => e.employee_id));
        if (extraEmployeeIds.size === 0) return [];

        const validDepts = await this.EDP_기반_유효부서_목록을_조회한다();
        if (validDepts.length === 0) return [];

        const edps = await this.edpRepository.find({
            where: { departmentId: In(validDepts.map((d) => d.id)) },
            relations: ['employee', 'employee.rank', 'department'],
        });

        const seenEmployeeIds = new Set<string>();
        const employeeWithDept: Array<{ employee: Employee; departmentName: string }> = [];

        for (const edp of edps) {
            if (!edp.employee || edp.employee.status === ('퇴사' as any)) continue;
            if (!extraEmployeeIds.has(edp.employeeId)) continue;
            if (seenEmployeeIds.has(edp.employeeId)) continue;
            seenEmployeeIds.add(edp.employeeId);
            employeeWithDept.push({ employee: edp.employee, departmentName: edp.department?.departmentName ?? '' });
        }

        const deptNameMap = new Map(employeeWithDept.map((e) => [e.employee.id, e.departmentName]));
        const dtos = await this.직원DTO를_조립한다(
            employeeWithDept.map((e) => e.employee),
            deptNameMap,
        );
        return this.부서별로_그룹핑한다(dtos);
    }

    /**
     * 관리자 후보 목록을 부서별로 조회한다 (EDP 기반)
     */
    async 관리자_후보_목록을_조회한다(): Promise<EmplyeesByDepartmentResponseDto[]> {
        const validDepts = await this.EDP_기반_유효부서_목록을_조회한다();
        if (validDepts.length === 0) return [];

        const edps = await this.edpRepository.find({
            where: { departmentId: In(validDepts.map((d) => d.id)) },
            relations: ['employee', 'employee.rank', 'department'],
        });

        const seenEmployeeIds = new Set<string>();
        const employeeWithDept: Array<{ employee: Employee; departmentName: string }> = [];

        for (const edp of edps) {
            if (!edp.employee || edp.employee.status === ('퇴사' as any)) continue;
            if (seenEmployeeIds.has(edp.employeeId)) continue;
            seenEmployeeIds.add(edp.employeeId);
            employeeWithDept.push({ employee: edp.employee, departmentName: edp.department?.departmentName ?? '' });
        }

        const deptNameMap = new Map(employeeWithDept.map((e) => [e.employee.id, e.departmentName]));
        const dtos = await this.직원DTO를_조립한다(
            employeeWithDept.map((e) => e.employee),
            deptNameMap,
        );
        const withRole = dtos.map((e) => ({
            ...e,
            isResourceAdmin: (e.roles ?? []).includes(Role.RESOURCE_ADMIN),
        }));
        return this.부서별로_그룹핑한다(withRole);
    }

    /**
     * 직원 목록을 부서별로 조회한다 (EDP 기반)
     * - 루미르 하위 부서 중 EDP에 배치된 재직 직원만 반환
     */
    async 직원_목록을_조회한다(useHiddenInFilter: boolean = false): Promise<EmplyeesByDepartmentResponseDto[]> {
        const validDepts = await this.EDP_기반_유효부서_목록을_조회한다();
        if (validDepts.length === 0) return [];

        const validDeptIds = validDepts.map((d) => d.id);

        // EDP에서 유효 부서 소속 직원 조회
        const edps = await this.edpRepository.find({
            where: { departmentId: In(validDeptIds) },
            relations: ['employee', 'employee.rank', 'department'],
        });

        // 퇴사자 제외, 중복 직원 처리 (동일 직원이 여러 부서인 경우 첫 번째 부서 기준)
        const seenEmployeeIds = new Set<string>();
        const employeeWithDept: Array<{ employee: Employee; departmentName: string }> = [];

        for (const edp of edps) {
            if (!edp.employee || edp.employee.status === ('퇴사' as any)) continue;
            if (seenEmployeeIds.has(edp.employeeId)) continue;
            seenEmployeeIds.add(edp.employeeId);
            employeeWithDept.push({
                employee: edp.employee,
                departmentName: edp.department?.departmentName ?? '',
            });
        }

        const employees = employeeWithDept.map((e) => e.employee);
        const deptNameMap = new Map(employeeWithDept.map((e) => [e.employee.id, e.departmentName]));

        const dtos = await this.직원DTO를_조립한다(employees, deptNameMap);

        let filtered = dtos;
        if (useHiddenInFilter) {
            filtered = filtered.filter((e) => !e.isHiddenInFilter);
        }
        return this.부서별로_그룹핑한다(filtered);
    }

    /**
     * 직원 상세 정보를 조회한다
     */
    async 직원_상세정보를_조회한다(employeeId: string): Promise<UserResponseDto> {
        const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
        if (!employee) {
            throw new NotFoundException(ERROR_MESSAGE.BUSINESS.AUTH.USER_NOT_FOUND);
        }

        const [dtos] = await this.직원DTO를_조립한다([employee]);

        return {
            employeeId: dtos.employeeId,
            employeeNumber: dtos.employeeNumber,
            email: dtos.email,
            mobile: dtos.mobile,
            name: dtos.name,
            department: dtos.department,
            position: dtos.position,
            rank: dtos.rank,
            positionTitle: dtos.positionTitle,
            roles: dtos.roles,
            isPushNotificationEnabled: dtos.isPushNotificationEnabled,
        };
    }

    /**
     * 복수 직원 ID들로 직원 정보를 조회한다
     */
    async 복수_직원정보를_조회한다(employeeIds: string[]): Promise<any[]> {
        const employees = await this.employeeRepository.find({
            where: { id: In(employeeIds) },
            relations: ['rank'],
        });
        return this.직원DTO를_조립한다(employees);
    }

    /**
     * employeeNumber로 libs Employee를 조회한다
     */
    async employeeNumber로_직원을_조회한다(employeeNumber: string): Promise<Employee | null> {
        return this.employeeRepository.findOne({ where: { employeeNumber } });
    }

    /**
     * 비밀번호를 확인한다
     */
    async 비밀번호를_확인한다(employeeId: string, password: string): Promise<boolean> {
        const rows: any[] = await this.dataSource.query(`SELECT "accessToken" FROM employees WHERE "employeeId" = $1`, [
            employeeId,
        ]);
        const accessToken = rows[0]?.accessToken;
        if (!accessToken) {
            throw new NotFoundException(ERROR_MESSAGE.BUSINESS.AUTH.USER_NOT_FOUND);
        }

        try {
            const ssoApiUrl = process.env.SSO_API_URL;
            const response = await axios.post(
                `${ssoApiUrl}/api/auth/check-password`,
                { currentPassword: password },
                { headers: { Authorization: `Bearer ${accessToken}` } },
            );
            return response.data.isValid;
        } catch (error) {
            console.log(error);
            throw new UnauthorizedException(ERROR_MESSAGE.BUSINESS.AUTH.SSO_LOGIN_FAILED);
        }
    }

    /**
     * 비밀번호를 변경한다
     */
    async 비밀번호를_변경한다(employeeId: string, password: string): Promise<void> {
        const rows: any[] = await this.dataSource.query(
            `SELECT "accessToken", "employeeNumber" FROM employees WHERE "employeeId" = $1`,
            [employeeId],
        );
        const local = rows[0];
        if (!local) {
            throw new NotFoundException(ERROR_MESSAGE.BUSINESS.AUTH.USER_NOT_FOUND);
        }

        try {
            const ssoApiUrl = process.env.SSO_API_URL;
            await axios.post(
                `${ssoApiUrl}/api/auth/change-password`,
                { newPassword: password },
                { headers: { Authorization: `Bearer ${local.accessToken}` } },
            );
            const hashed = await bcrypt.hash(password, 10);
            await this.dataSource.query(`UPDATE employees SET password = $1 WHERE "employeeId" = $2`, [
                hashed,
                employeeId,
            ]);
        } catch (error) {
            console.log(error);
            throw new UnauthorizedException(ERROR_MESSAGE.BUSINESS.AUTH.SSO_LOGIN_FAILED);
        }
    }

    /**
     * 직원의 역할을 변경한다
     */
    async 직원_역할을_변경한다(changeRoleDto: ChangeRoleDto): Promise<void> {
        let extra = await this.employeeExtraInfoRepository.findOne({
            where: { employee_id: changeRoleDto.employeeId },
        });

        if (!extra) {
            extra = this.employeeExtraInfoRepository.create({
                employee_id: changeRoleDto.employeeId,
                is_excluded_from_summary: false,
                roles: [Role.USER],
            });
        }

        const currentRoles: string[] = extra.roles ?? [Role.USER];
        extra.roles = changeRoleDto.isResourceAdmin
            ? [...new Set([...currentRoles, Role.RESOURCE_ADMIN])]
            : currentRoles.filter((r) => r !== Role.RESOURCE_ADMIN);
        await this.employeeExtraInfoRepository.save(extra);
    }

    /**
     * 알림 설정을 변경한다
     */
    async 알림설정을_변경한다(employeeId: string, updateDto: UpdateNotificationSettingsDto): Promise<UserResponseDto> {
        let extra = await this.employeeExtraInfoRepository.findOne({
            where: { employee_id: employeeId },
        });

        if (!extra) {
            extra = this.employeeExtraInfoRepository.create({
                employee_id: employeeId,
                is_excluded_from_summary: false,
                is_push_notification_enabled: updateDto.isPushNotificationEnabled,
            });
        } else {
            extra.is_push_notification_enabled = updateDto.isPushNotificationEnabled;
        }
        await this.employeeExtraInfoRepository.save(extra);

        return this.직원_상세정보를_조회한다(employeeId);
    }

    /**
     * 부서를 DTO 형식으로 변환하는 헬퍼
     */
    private 부서를_DTO로_변환한다(dept: Department): any {
        return {
            id: dept.id,
            departmentName: dept.departmentName,
            departmentCode: dept.departmentCode,
            type: dept.type,
            parentDepartmentId: dept.parentDepartmentId,
            order: dept.order,
            isActive: dept.isActive,
            isException: dept.isException,
            createdAt: dept.createdAt,
            updatedAt: dept.updatedAt,
        };
    }

    /**
     * 모든 부서 목록을 조회한다 (EDP 기반 - 루미르 하위 부서 중 EDP에 직원이 있는 부서만)
     */
    async 모든_부서를_조회한다(): Promise<any[]> {
        try {
            const departments = await this.EDP_기반_유효부서_목록을_조회한다();
            return departments.map((dept) => this.부서를_DTO로_변환한다(dept));
        } catch (error) {
            this.logger.error('부서 목록 조회 실패:', error);
            return [];
        }
    }

    /**
     * 하위 부서 목록만 조회한다 (EDP 기반 - 루미르 하위 부서 중 EDP에 직원이 있고 부모 부서가 있는 부서)
     */
    async 하위_부서_목록을_조회한다(): Promise<any[]> {
        try {
            const departments = await this.EDP_기반_유효부서_목록을_조회한다();
            const result = departments
                .filter((dept) => !!dept.parentDepartmentId)
                .map((dept) => this.부서를_DTO로_변환한다(dept));

            this.logger.log(`하위 부서 목록 조회 완료: ${result.length}개 부서`);
            return result;
        } catch (error) {
            this.logger.error('하위 부서 목록 조회 실패:', error);
            return [];
        }
    }

    /**
     * 루트 부서 목록만 조회한다 (EDP 기반 - 루미르 하위 부서 중 EDP에 직원이 있고 부모 부서가 없는 부서)
     */
    async 루트_부서_목록을_조회한다(): Promise<any[]> {
        try {
            const departments = await this.EDP_기반_유효부서_목록을_조회한다();
            const result = departments
                .filter((dept) => !dept.parentDepartmentId)
                .map((dept) => this.부서를_DTO로_변환한다(dept));

            this.logger.log(`루트 부서 목록 조회 완료: ${result.length}개 부서`);
            return result;
        } catch (error) {
            this.logger.error('루트 부서 목록 조회 실패:', error);
            return [];
        }
    }

    /**
     * 부서 계층구조를 트리 형태로 조회한다 (EDP 기반)
     * - 루미르 최상위 부서의 하위 부서 중 EDP에 직원이 있는 부서들로 구성
     * - 계층 탐색 시 EDP에 없더라도 유효 부서들의 공통 조상은 포함
     */
    async 부서_계층구조를_조회한다(): Promise<any[]> {
        try {
            const validDepts = await this.EDP_기반_유효부서_목록을_조회한다();
            const validDeptIdSet = new Set(validDepts.map((d) => d.id));

            // 계층 구성을 위해 전체 부서 조회 (루미르 하위)
            const subDeptIds = await this.루미르_하위부서_ID_목록을_조회한다();
            if (subDeptIds.length === 0) return [];

            const allSubDepts = await this.departmentRepository.find({
                where: { id: In(subDeptIds) },
                order: { order: 'ASC' },
            });

            // EDP 유효 부서만 포함하는 계층구조 빌드
            const buildHierarchy = (parentId: string): any[] => {
                return allSubDepts
                    .filter((d) => d.parentDepartmentId === parentId)
                    .sort((a, b) => a.order - b.order)
                    .flatMap((dept) => {
                        const children = buildHierarchy(dept.id);
                        if (!validDeptIdSet.has(dept.id) && children.length === 0) return [];
                        return [
                            {
                                ...this.부서를_DTO로_변환한다(dept),
                                childDepartments: children,
                                childDepartmentCount: children.length,
                            },
                        ];
                    });
            };

            const hierarchy = buildHierarchy(LUMIR_ROOT_DEPARTMENT_ID);

            this.logger.log(`부서 계층구조 조회 완료: 유효 부서 ${validDepts.length}개`);

            return hierarchy;
        } catch (error) {
            this.logger.error('부서 계층구조 조회 실패:', error);
            return [];
        }
    }

    /**
     * 직원 목록을 부서별로 그룹핑한다 (데이터 가공만, 조회 안함)
     */
    private 부서별로_그룹핑한다(employees: any[]): EmplyeesByDepartmentResponseDto[] {
        const departments = new Map<string, EmployeeResponseDto[]>();

        employees.forEach((employee) => {
            if (!departments.has(employee.department)) {
                departments.set(employee.department, []);
            }
            departments.get(employee.department)?.push(employee);
        });

        return Array.from(departments.entries()).map(([department, employees]) => ({
            department,
            employees,
        }));
    }

    /**
     * 외부 시스템에서 직원 정보를 동기화한다
     */
    // async 직원_정보를_동기화한다(authorization: string): Promise<EmplyeesByDepartmentResponseDto[]> {
    //     const { employees } = await this.employeeMicroserviceAdapter.getAllEmployees(authorization);

    //     for (const employee of employees) {
    //         try {
    //             const existingRows: any[] = await this.dataSource.query(
    //                 `SELECT "employeeId", "employeeNumber" FROM employees WHERE "employeeNumber" = $1`,
    //                 [employee.employeeNumber],
    //             );
    //             const existing = existingRows[0];

    //             if (employee.status === '퇴사') {
    //                 if (existing) {
    //                     await this.dataSource.query(
    //                         `UPDATE employees SET department = $1, position = $2, rank = $3, "positionTitle" = $4, status = $5 WHERE "employeeId" = $6`,
    //                         [
    //                             employee.department ? employee.department.departmentName : undefined,
    //                             employee.rank?.rankName ?? '',
    //                             employee.rank?.rankName ?? '',
    //                             employee.position?.positionTitle ?? '',
    //                             employee.status,
    //                             existing.employeeId,
    //                         ],
    //                     );
    //                 }
    //                 continue;
    //             }

    //             if (existing) {
    //                 await this.dataSource.query(
    //                     `UPDATE employees SET name = $1, "employeeNumber" = $2, department = $3, position = $4, rank = $5, "positionTitle" = $6, mobile = $7, status = $8 WHERE "employeeId" = $9`,
    //                     [
    //                         employee.name,
    //                         employee.employeeNumber,
    //                         employee.department?.departmentName ?? '',
    //                         employee.rank?.rankName ?? '',
    //                         employee.rank?.rankName ?? '',
    //                         employee.position?.positionTitle ?? '',
    //                         employee.phoneNumber ?? '',
    //                         employee.status,
    //                         existing.employeeId,
    //                     ],
    //                 );
    //             } else {
    //                 await this.dataSource.query(
    //                     `INSERT INTO employees ("employeeNumber", name, email, department, position, rank, "positionTitle", mobile, status)
    //                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    //                     [
    //                         employee.employeeNumber,
    //                         employee.name,
    //                         employee.email ?? '',
    //                         employee.department?.departmentName ?? '',
    //                         employee.rank?.rankName ?? '',
    //                         employee.rank?.rankName ?? '',
    //                         employee.position?.positionTitle ?? '',
    //                         employee.phoneNumber ?? '',
    //                         employee.status,
    //                     ],
    //                 );
    //             }
    //         } catch (error) {
    //             console.log(error);
    //         }
    //     }
    //     return this.직원_목록을_조회한다();
    // }

    // /**
    //  * 외부 시스템에서 부서 정보를 동기화하고 직원을 배치한다
    //  */
    // async 부서_정보를_동기화한다(): Promise<DepartmentHierarchyResponseDto> {
    //     try {
    //         this.logger.log('외부 시스템에서 부서 및 직원 배치 정보 동기화 시작...');

    //         const departmentHierarchy = await this.departmentMicroserviceAdapter.fetchDepartmentHierarchy();
    //         const allDepartments = this.모든_부서를_평면적으로_수집한다(departmentHierarchy.departments);
    //         const departmentIdMapping = await this.모든_부서를_저장한다(allDepartments);
    //         await this.부서_관계를_설정한다(allDepartments, departmentIdMapping);
    //         await this.외부_시스템에_없는_부서를_삭제한다(allDepartments);

    //         this.logger.log(
    //             `부서 및 직원 배치 정보 동기화 완료: 총 ${departmentHierarchy.totalDepartments}개 부서, ${departmentHierarchy.totalEmployees}명 직원`,
    //         );

    //         return departmentHierarchy;
    //     } catch (error) {
    //         this.logger.error('부서 및 직원 배치 정보 동기화 실패:', error);
    //         throw error;
    //     }
    // }

    /**
     * 계층구조를 평면적인 배열로 변환한다
     */
    private 모든_부서를_평면적으로_수집한다(departments: any[]): any[] {
        const allDepartments: any[] = [];

        const collectRecursively = (depts: any[]) => {
            for (const dept of depts) {
                allDepartments.push(dept);
                if (dept.childDepartments && dept.childDepartments.length > 0) {
                    collectRecursively(dept.childDepartments);
                }
            }
        };

        collectRecursively(departments);
        return allDepartments;
    }

    /**
     * 모든 부서를 parentDepartmentId 없이 저장한다
     */
    private async 모든_부서를_저장한다(allDepartments: any[]): Promise<Map<string, string>> {
        const departmentIdMapping = new Map<string, string>();

        for (const dept of allDepartments) {
            try {
                const existingDepartment = await this.departmentRepository.findOne({
                    where: { departmentCode: dept.departmentCode },
                });

                let savedDepartment: Department;

                if (!existingDepartment) {
                    const newDepartment = this.departmentRepository.create({
                        departmentName: dept.departmentName,
                        departmentCode: dept.departmentCode,
                        type: this.유효한부서타입으로변환한다(dept.type),
                        order: dept.order,
                    });
                    savedDepartment = await this.departmentRepository.save(newDepartment);
                    this.logger.log(`새 부서 생성: ${dept.departmentName} (${dept.departmentCode})`);
                } else {
                    existingDepartment.departmentName = dept.departmentName;
                    existingDepartment.type = this.유효한부서타입으로변환한다(dept.type);
                    existingDepartment.order = dept.order;
                    savedDepartment = await this.departmentRepository.save(existingDepartment);
                    this.logger.log(`부서 업데이트: ${dept.departmentName} (${dept.departmentCode})`);
                }

                departmentIdMapping.set(dept.id, savedDepartment.id);
            } catch (error) {
                this.logger.error(`부서 저장 실패: ${dept.departmentName} (${dept.departmentCode})`, error);
            }
        }

        return departmentIdMapping;
    }

    /**
     * 외부 시스템 type 문자열을 DepartmentType으로 변환한다
     */
    private 유효한부서타입으로변환한다(type: string): DepartmentType {
        const v = type?.toUpperCase();
        if (v === 'COMPANY' || v === 'DIVISION' || v === 'DEPARTMENT' || v === 'TEAM') {
            return v as DepartmentType;
        }
        return DepartmentType.DEPARTMENT;
    }

    /**
     * 부서 간 관계를 설정한다
     */
    private async 부서_관계를_설정한다(allDepartments: any[], departmentIdMapping: Map<string, string>): Promise<void> {
        for (const dept of allDepartments) {
            try {
                if (dept.parentDepartmentId) {
                    const internalDepartmentId = departmentIdMapping.get(dept.id);
                    const internalParentId = departmentIdMapping.get(dept.parentDepartmentId);

                    if (internalDepartmentId && internalParentId) {
                        await this.departmentRepository.update(internalDepartmentId, {
                            parentDepartmentId: internalParentId,
                        });
                        this.logger.log(`부서 관계 설정: ${dept.departmentName} → 상위부서 ID: ${internalParentId}`);
                    } else {
                        this.logger.warn(
                            `부서 관계 설정 실패: 매핑되지 않은 ID - 부서: ${dept.id}, 상위부서: ${dept.parentDepartmentId}`,
                        );
                    }
                }
            } catch (error) {
                this.logger.error(`부서 관계 설정 실패: ${dept.departmentName}`, error);
            }
        }
    }

    /**
     * 외부 시스템에 없는 부서를 삭제한다
     */
    private async 외부_시스템에_없는_부서를_삭제한다(externalDepartments: any[]): Promise<void> {
        try {
            const externalDepartmentCodes = new Set(externalDepartments.map((dept) => dept.departmentCode));
            const currentDepartments = await this.departmentRepository.find();

            const departmentsToDelete = currentDepartments.filter(
                (dept) => !externalDepartmentCodes.has(dept.departmentCode),
            );

            if (departmentsToDelete.length > 0) {
                this.logger.log(`삭제할 부서 ${departmentsToDelete.length}개 발견`);

                for (const dept of departmentsToDelete) {
                    try {
                        await this.departmentRepository.delete(dept.id);
                        this.logger.log(`부서 삭제 완료: ${dept.departmentName} (${dept.departmentCode})`);
                    } catch (error) {
                        this.logger.error(`부서 삭제 실패: ${dept.departmentName} (${dept.departmentCode})`, error);
                    }
                }

                this.logger.log(`외부 시스템에 없는 부서 삭제 완료: ${departmentsToDelete.length}개`);
            } else {
                this.logger.log('삭제할 부서 없음');
            }
        } catch (error) {
            this.logger.error('외부 시스템에 없는 부서 삭제 실패:', error);
            throw error;
        }
    }

    /**
     * 각 부서의 직원 배치 정보를 저장한다 (employee_department_positions 기반)
     */
    private async 직원_배치_정보를_저장한다(departments: any[]): Promise<void> {
        const staffPositionId = await this.STAFF_직책ID를_가져온다();
        if (!staffPositionId) {
            this.logger.warn(
                'STAFF position을 찾을 수 없어 직원 배치를 건너뜁니다. positions 테이블에 STAFF row를 삽입하세요.',
            );
            return;
        }

        const allDepartments = this.모든_부서를_평면적으로_수집한다(departments);

        for (const dept of allDepartments) {
            try {
                const department = await this.departmentRepository.findOne({
                    where: { departmentCode: dept.departmentCode },
                });

                if (!department) {
                    this.logger.warn(`부서를 찾을 수 없음: ${dept.departmentCode}`);
                    continue;
                }

                for (const emp of dept.employees || []) {
                    try {
                        // libs employees-info에서 직원 조회
                        const libsEmployee = await this.employeeRepository.findOne({
                            where: { employeeNumber: emp.employeeNumber },
                        });

                        if (!libsEmployee) {
                            this.logger.warn(`libs 직원을 찾을 수 없음: ${emp.employeeNumber} (${emp.name})`);
                            continue;
                        }

                        // employee_department_positions에 upsert
                        const existing = await this.edpRepository.findOne({
                            where: { employeeId: libsEmployee.id, departmentId: department.id },
                        });

                        if (!existing) {
                            const newEdp = this.edpRepository.create({
                                id: randomUUID(),
                                employeeId: libsEmployee.id,
                                departmentId: department.id,
                                positionId: staffPositionId,
                                isManager: false,
                            });
                            await this.edpRepository.save(newEdp);
                        }

                        this.logger.log(`직원 배치 완료: ${emp.name} (${emp.employeeNumber}) → ${dept.departmentName}`);
                    } catch (error) {
                        this.logger.error(`직원 배치 실패: ${emp.employeeNumber} (${emp.name})`, error);
                    }
                }
            } catch (error) {
                this.logger.error(`부서 직원 배치 실패: ${dept.departmentName}`, error);
            }
        }
    }

    // /**
    //  * 직원 정보와 부서 정보를 모두 동기화한다
    //  */
    // async 전체_조직_정보를_동기화한다(authorization: string): Promise<EmplyeesByDepartmentResponseDto[]> {
    //     try {
    //         this.logger.log('전체 조직 정보 동기화 시작...');

    //         const departmentHierarchy = await this.부서_정보를_동기화한다();
    //         await this.직원_정보를_동기화한다(authorization);
    //         await this.직원_배치_정보를_저장한다(departmentHierarchy.departments);

    //         this.logger.log('전체 조직 정보 동기화 완료');
    //         return this.직원_목록을_조회한다();
    //     } catch (error) {
    //         this.logger.error('전체 조직 정보 동기화 실패:', error);
    //         throw error;
    //     }
    // }

    // async 구독정보를_동기화한다(): Promise<void> {
    //     const extras = await this.employeeExtraInfoRepository.find({
    //         where: { subscriptions: Not(IsNull()) },
    //     });

    //     let count = 1;
    //     for (const extra of extras) {
    //         const employee = await this.employeeRepository.findOne({ where: { id: extra.employee_id } });
    //         if (!employee) continue;

    //         const response = await this.employeeMicroserviceAdapter.subscribeFcm('', employee.employeeNumber, {
    //             fcmToken: extra.subscriptions?.[0]?.fcm?.token,
    //         });
    //         if (response.success) {
    //             console.log('구독 정보 동기화 성공', count, employee.name, employee.employeeNumber);
    //             count++;
    //         }
    //     }
    // }

    /**
     * 특정 부서와 하위 부서의 모든 직원 목록을 조회한다 (EDP 기반)
     */
    async 부서별_직원_목록을_조회한다(departmentId: string): Promise<any[]> {
        try {
            const allDepartmentIds = await this.부서와_하위부서_ID들을_수집한다(departmentId);

            this.logger.log(`부서 ${departmentId}와 하위 부서들: [${allDepartmentIds.join(', ')}]`);

            const edps = await this.edpRepository.find({
                where: { departmentId: In(allDepartmentIds) },
                relations: ['employee', 'employee.rank'],
            });

            // 중복 제거 (employeeId 기준)
            const employeeMap = new Map<string, Employee>();
            edps.forEach((edp) => {
                if (edp.employee && !employeeMap.has(edp.employeeId)) {
                    employeeMap.set(edp.employeeId, edp.employee);
                }
            });

            const employees = Array.from(employeeMap.values());
            const dtos = await this.직원DTO를_조립한다(employees);

            this.logger.log(`부서별 직원 목록 조회 완료: 부서 ${departmentId} (하위 부서 포함), ${dtos.length}명`);
            return dtos;
        } catch (error) {
            this.logger.error(`부서별 직원 목록 조회 실패: 부서 ${departmentId}`, error);
            return [];
        }
    }

    /**
     * 특정 부서와 모든 하위 부서의 ID를 재귀적으로 수집한다
     */
    private async 부서와_하위부서_ID들을_수집한다(departmentId: string): Promise<string[]> {
        const result = [departmentId];

        try {
            const allDepartments = await this.departmentRepository.find();

            const findSubDepartments = (parentId: string): string[] => {
                const subDepartments = allDepartments.filter((dept) => dept.parentDepartmentId === parentId);
                const subIds: string[] = [];

                for (const subDept of subDepartments) {
                    subIds.push(subDept.id);
                    subIds.push(...findSubDepartments(subDept.id));
                }

                return subIds;
            };

            const subDepartmentIds = findSubDepartments(departmentId);
            result.push(...subDepartmentIds);

            return [...new Set(result)];
        } catch (error) {
            this.logger.error(`하위 부서 ID 수집 실패: ${departmentId}`, error);
            return [departmentId];
        }
    }

    /**
     * 재직중인 전체 직원 목록을 조회한다
     */
    async 재직중인_전체_직원을_조회한다(): Promise<Employee[]> {
        try {
            const employees = await this.employeeRepository.find({
                where: { status: '재직중' as any },
            });

            this.logger.log(`재직중인 전체 직원 조회 완료: ${employees.length}명`);
            return employees;
        } catch (error) {
            this.logger.error('재직중인 전체 직원 조회 실패:', error);
            return [];
        }
    }
}
