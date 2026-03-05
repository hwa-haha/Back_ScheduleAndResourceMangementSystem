import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EmployeeDepartmentPositionHistory } from '../../../../../libs/modules/employee-department-position-history/employee-department-position-history.entity';
import { Department } from '../../../../../libs/modules/department/department.entity';
import { cleanupScenarioData } from './cleanup-scenario-data';
import { TestSetup } from '../../e2e/utils/test-setup';
import { TestHelpers } from '../../e2e/utils/test-helpers';

export const TEST_DEPARTMENT_ID = 'd2860a56-99e0-4e79-b70e-0461eef212ac';

export type ScenarioContext = {
    app: INestApplication;
    authToken: string;
    dataSource: DataSource;
    employeeIds: string[];
    departmentId: string;
};

export const createScenarioContext = async (isCleanUpData: boolean = false): Promise<ScenarioContext> => {
    const app = await TestSetup.createTestApp();
    const authToken = TestHelpers.createValidJwtToken(app);
    const dataSource = app.get<DataSource>(DataSource);

    if (isCleanUpData) {
        await cleanupScenarioData(dataSource);
    }

    const department = await dataSource.manager.findOne(Department, {
        where: { id: TEST_DEPARTMENT_ID },
    });
    if (!department) {
        throw new Error(`테스트 대상 부서를 찾을 수 없습니다. (id: ${TEST_DEPARTMENT_ID})`);
    }

    const histories = await dataSource.manager.find(EmployeeDepartmentPositionHistory, {
        where: {
            departmentId: TEST_DEPARTMENT_ID,
            isCurrent: true,
        },
        relations: ['employee'],
    });

    const employeeIds = histories.map((history) => history.employee?.id).filter((id): id is string => !!id);
    if (employeeIds.length === 0) {
        throw new Error(`테스트 대상 부서에 소속된 직원이 없습니다. (id: ${TEST_DEPARTMENT_ID})`);
    }

    return {
        app,
        authToken,
        dataSource,
        employeeIds,
        departmentId: TEST_DEPARTMENT_ID,
    };
};

export const closeScenarioContext = async (app: INestApplication): Promise<void> => {
    await TestSetup.closeTestApp(app);
};
