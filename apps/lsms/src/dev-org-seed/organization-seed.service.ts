import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Department, DepartmentType } from '@libs/modules/department/department.entity';
import { Employee, EmployeeStatus, Gender } from '@libs/modules/employee/employee.entity';
import { EmployeeDepartmentPosition } from '@libs/modules/employee-department-position/employee-department-position.entity';
import { Position } from '@libs/modules/position/position.entity';
import { Rank } from '@libs/modules/rank/rank.entity';
import {
    조직시드직급Id,
    조직시드직책Id,
    조직시드부서Id,
    조직시드직원Id,
    조직시드EdpId,
} from './organization-seed.constants';

interface 삽입카운트 {
    ranks: number;
    positions: number;
    departments: number;
    employees: number;
    employeeDepartmentPositions: number;
}

/**
 * employees / departments / employee_department_positions 엔티티 규격에 맞춘 로컬 시드
 * (직급 ranks, 직책 positions 는 FK 충족을 위해 함께 삽입)
 */
@Injectable()
export class OrganizationSeedService {
    private readonly logger = new Logger(OrganizationSeedService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly configService: ConfigService,
    ) {}

    /**
     * 시드 엔드포인트 사용 가능 여부
     * - `process.env` 를 우선 (ConfigModule 이 .env 끝 줄을 못 읽는 깨진 파일 대비)
     * - 명시적으로 false 거부
     * - 나머지: NODE_ENV 가 local 또는 development 이면 기본 허용(로컬에서 시드가 안 깔리는 문제 완화)
     */
    시드엔드포인트가활성화되어있다(): boolean {
        const raw =
            process.env.ORG_SEED_ENDPOINT_ENABLED ?? this.configService.get<string>('ORG_SEED_ENDPOINT_ENABLED');

        if (raw === 'false' || raw === '0') {
            return false;
        }
        if (raw === 'true' || raw === '1') {
            return true;
        }

        const nodeEnv = process.env.NODE_ENV ?? '';
        return nodeEnv === 'local' || nodeEnv === 'development';
    }

    private isUniqueViolation(err: unknown): boolean {
        const e = err as { code?: string; driverError?: { code?: string } };
        return e?.code === '23505' || e?.driverError?.code === '23505';
    }

    /**
     * 동일 PK 있으면 스킵. PK 없이 유니크(코드·사번 등) 충돌 시에도 무시하고 다음으로 진행
     */
    private async 레코드를저장하거나유니크충돌은무시한다<T extends object>(
        repo: Repository<T>,
        row: T,
    ): Promise<boolean> {
        const idVal = (row as { id?: string }).id;
        if (idVal != null && (await repo.findOne({ where: { id: idVal } as any }))) {
            return false;
        }
        try {
            await repo.save(row);
            return true;
        } catch (e) {
            if (this.isUniqueViolation(e)) {
                this.logger.warn(
                    `시드 행 스킵(유니크 충돌·다른 ID에 동일 코드 등): ${String(idVal ?? 'no-id')}`,
                );
                return false;
            }
            throw e;
        }
    }

    /**
     * 조직 연관 시드 데이터를 트랜잭션으로 삽입한다 (이미 있으면 스킵)
     */
    async 조직연관시드데이터를삽입한다(): Promise<{ message: string; inserted: 삽입카운트 }> {
        if (!this.시드엔드포인트가활성화되어있다()) {
            throw new ServiceUnavailableException(
                '조직 시드 API는 비활성화되어 있습니다. apps/lsms/.env 에 ORG_SEED_ENDPOINT_ENABLED=true 로 설정하세요.',
            );
        }

        const inserted: 삽입카운트 = {
            ranks: 0,
            positions: 0,
            departments: 0,
            employees: 0,
            employeeDepartmentPositions: 0,
        };

        await this.dataSource.transaction(async (manager) => {
            inserted.ranks = await this.직급시드를삽입한다(manager);
            inserted.positions = await this.직책시드를삽입한다(manager);
            inserted.departments = await this.부서계층시드를삽입한다(manager);
            inserted.employees = await this.직원시드를삽입한다(manager);
            inserted.employeeDepartmentPositions = await this.직원부서직책시드를삽입한다(manager);
        });

        return {
            message: '조직 연관 시드 데이터 삽입이 완료되었습니다. (이미 존재하던 행은 건너뜀)',
            inserted,
        };
    }

    private async 직급시드를삽입한다(manager: EntityManager): Promise<number> {
        const repo = manager.getRepository(Rank);
        const rows: Partial<Rank>[] = [
            { id: 조직시드직급Id.사원, rankName: '사원', rankCode: 'LSMS_SEED_JUNIOR', level: 50 },
            { id: 조직시드직급Id.대리, rankName: '대리', rankCode: 'LSMS_SEED_ASSOCIATE', level: 40 },
            { id: 조직시드직급Id.과장, rankName: '과장', rankCode: 'LSMS_SEED_MANAGER', level: 30 },
        ];
        let n = 0;
        for (const row of rows) {
            const inserted = await this.레코드를저장하거나유니크충돌은무시한다(repo, row as Rank);
            if (inserted) n += 1;
        }
        return n;
    }

    private async 직책시드를삽입한다(manager: EntityManager): Promise<number> {
        const repo = manager.getRepository(Position);
        const rows: Partial<Position>[] = [
            {
                id: 조직시드직책Id.직원,
                positionTitle: '직원',
                positionCode: 'LSMS_SEED_STAFF',
                level: 40,
                hasManagementAuthority: false,
            },
            {
                id: 조직시드직책Id.팀장,
                positionTitle: '팀장',
                positionCode: 'LSMS_SEED_TEAM_LEAD',
                level: 20,
                hasManagementAuthority: true,
            },
            {
                id: 조직시드직책Id.부서장,
                positionTitle: '부서장',
                positionCode: 'LSMS_SEED_DEPT_HEAD',
                level: 10,
                hasManagementAuthority: true,
            },
        ];
        let n = 0;
        for (const row of rows) {
            const inserted = await this.레코드를저장하거나유니크충돌은무시한다(repo, row as Position);
            if (inserted) n += 1;
        }
        return n;
    }

    private async 부서계층시드를삽입한다(manager: EntityManager): Promise<number> {
        const repo = manager.getRepository(Department);
        const rows: Partial<Department>[] = [
            {
                id: 조직시드부서Id.회사,
                departmentName: 'LSMS 시드 주식회사',
                departmentCode: 'LSMS_SEED_CO',
                type: DepartmentType.COMPANY,
                parentDepartmentId: undefined,
                order: 0,
                isActive: true,
                isException: false,
            },
            {
                id: 조직시드부서Id.본부,
                departmentName: '개발본부',
                departmentCode: 'LSMS_SEED_DIV',
                type: DepartmentType.DIVISION,
                parentDepartmentId: 조직시드부서Id.회사,
                order: 0,
                isActive: true,
                isException: false,
            },
            {
                id: 조직시드부서Id.부서급실,
                departmentName: '백엔드실',
                departmentCode: 'LSMS_SEED_BE',
                type: DepartmentType.DEPARTMENT,
                parentDepartmentId: 조직시드부서Id.본부,
                order: 0,
                isActive: true,
                isException: false,
            },
            {
                id: 조직시드부서Id.팀파트,
                departmentName: '플랫폼파트',
                departmentCode: 'LSMS_SEED_PF',
                type: DepartmentType.TEAM,
                parentDepartmentId: 조직시드부서Id.부서급실,
                order: 0,
                isActive: true,
                isException: false,
            },
        ];
        let n = 0;
        for (const row of rows) {
            const inserted = await this.레코드를저장하거나유니크충돌은무시한다(repo, row as Department);
            if (inserted) n += 1;
        }
        return n;
    }

    private async 직원시드를삽입한다(manager: EntityManager): Promise<number> {
        const repo = manager.getRepository(Employee);
        const rows: Partial<Employee>[] = [
            {
                id: 조직시드직원Id.김플랫폼,
                employeeNumber: 'LSMS-SEED-001',
                name: '김플랫폼',
                email: 'seed-platform@lsms.local',
                hireDate: new Date('2022-04-01'),
                status: EmployeeStatus.Active,
                currentRankId: 조직시드직급Id.사원,
                gender: Gender.Male,
                isInitialPasswordSet: true,
            },
            {
                id: 조직시드직원Id.이백엔드,
                employeeNumber: 'LSMS-SEED-002',
                name: '이백엔드',
                email: 'seed-backend@lsms.local',
                hireDate: new Date('2021-07-15'),
                status: EmployeeStatus.Active,
                currentRankId: 조직시드직급Id.대리,
                gender: Gender.Female,
                isInitialPasswordSet: true,
            },
            {
                id: 조직시드직원Id.개발본부장,
                employeeNumber: 'LSMS-SEED-003',
                name: '박본부',
                email: 'seed-head@lsms.local',
                hireDate: new Date('2018-01-02'),
                status: EmployeeStatus.Active,
                currentRankId: 조직시드직급Id.과장,
                gender: Gender.Male,
                isInitialPasswordSet: true,
            },
        ];
        let n = 0;
        for (const row of rows) {
            const inserted = await this.레코드를저장하거나유니크충돌은무시한다(repo, row as Employee);
            if (inserted) n += 1;
        }
        return n;
    }

    private async 직원부서직책시드를삽입한다(manager: EntityManager): Promise<number> {
        const repo = manager.getRepository(EmployeeDepartmentPosition);
        const rows: Partial<EmployeeDepartmentPosition>[] = [
            {
                id: 조직시드EdpId.김플랫폼_플랫폼파트,
                employeeId: 조직시드직원Id.김플랫폼,
                departmentId: 조직시드부서Id.팀파트,
                positionId: 조직시드직책Id.직원,
                isManager: false,
            },
            {
                id: 조직시드EdpId.이백엔드_백엔드실,
                employeeId: 조직시드직원Id.이백엔드,
                departmentId: 조직시드부서Id.부서급실,
                positionId: 조직시드직책Id.팀장,
                isManager: true,
            },
            {
                id: 조직시드EdpId.개발본부장_개발본부,
                employeeId: 조직시드직원Id.개발본부장,
                departmentId: 조직시드부서Id.본부,
                positionId: 조직시드직책Id.부서장,
                isManager: true,
            },
        ];
        let n = 0;
        for (const row of rows) {
            const inserted = await this.레코드를저장하거나유니크충돌은무시한다(
                repo,
                row as EmployeeDepartmentPosition,
            );
            if (inserted) n += 1;
        }
        return n;
    }
}
