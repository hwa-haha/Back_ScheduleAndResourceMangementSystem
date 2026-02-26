import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDepartmentEmployeesTable1748247203493 implements MigrationInterface {
    name = 'CreateDepartmentEmployeesTable1748247203493';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // department_employees 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "department_employees" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "departmentId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "isManager" boolean NOT NULL DEFAULT false,
                "startDate" date NOT NULL,
                "endDate" date,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_department_employees" PRIMARY KEY ("id")
            );
            COMMENT ON TABLE "department_employees" IS '부서-직원 관계 테이블';
            COMMENT ON COLUMN "department_employees"."departmentId" IS '부서 ID';
            COMMENT ON COLUMN "department_employees"."employeeId" IS '직원 ID';
            COMMENT ON COLUMN "department_employees"."isManager" IS '부서장 여부';
            COMMENT ON COLUMN "department_employees"."startDate" IS '소속 시작일';
            COMMENT ON COLUMN "department_employees"."endDate" IS '소속 종료일';
            COMMENT ON COLUMN "department_employees"."isActive" IS '활성 상태';
            COMMENT ON COLUMN "department_employees"."createdAt" IS '생성일';
            COMMENT ON COLUMN "department_employees"."updatedAt" IS '수정일';
         `);

        // 외래키 제약조건 추가

        await queryRunner.query(`
            ALTER TABLE "department_employees" 
            ADD CONSTRAINT "FK_department_employees_departmentId" 
            FOREIGN KEY ("departmentId") 
            REFERENCES "departments"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION;
        `);

        await queryRunner.query(`
            ALTER TABLE "department_employees" 
            ADD CONSTRAINT "FK_department_employees_employeeId" 
            FOREIGN KEY ("employeeId") 
            REFERENCES "employees"("employeeId") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION;
        `);

        // 인덱스 생성
        await queryRunner.query(`
            CREATE INDEX "IDX_department_employees_departmentId" 
            ON "department_employees" ("departmentId");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_department_employees_employeeId" 
            ON "department_employees" ("employeeId");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_department_employees_isActive" 
            ON "department_employees" ("isActive");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_department_employees_isManager" 
            ON "department_employees" ("isManager");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_department_employees_startDate" 
            ON "department_employees" ("startDate");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_department_employees_endDate" 
            ON "department_employees" ("endDate");
        `);

        // 복합 인덱스 생성 (성능 최적화용)
        await queryRunner.query(`
            CREATE INDEX "IDX_department_employees_department_active" 
            ON "department_employees" ("departmentId", "isActive");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_department_employees_employee_active" 
            ON "department_employees" ("employeeId", "isActive");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_department_employees_manager_active" 
            ON "department_employees" ("departmentId", "isManager", "isActive");
        `);

        // 유니크 제약조건 (같은 직원이 같은 부서에 동시에 활성 상태로 소속될 수 없음)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_department_employees_active_unique" 
            ON "department_employees" ("employeeId", "departmentId") 
            WHERE "isActive" = true AND "endDate" IS NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 유니크 제약조건 삭제
        await queryRunner.query(`DROP INDEX "UQ_department_employees_active_unique"`);

        // 복합 인덱스 삭제
        await queryRunner.query(`DROP INDEX "IDX_department_employees_manager_active"`);
        await queryRunner.query(`DROP INDEX "IDX_department_employees_employee_active"`);
        await queryRunner.query(`DROP INDEX "IDX_department_employees_department_active"`);

        // 일반 인덱스 삭제
        await queryRunner.query(`DROP INDEX "IDX_department_employees_endDate"`);
        await queryRunner.query(`DROP INDEX "IDX_department_employees_startDate"`);
        await queryRunner.query(`DROP INDEX "IDX_department_employees_isManager"`);
        await queryRunner.query(`DROP INDEX "IDX_department_employees_isActive"`);
        await queryRunner.query(`DROP INDEX "IDX_department_employees_employeeId"`);
        await queryRunner.query(`DROP INDEX "IDX_department_employees_departmentId"`);

        // 외래키 제약조건 삭제
        await queryRunner.query(`
            ALTER TABLE "department_employees" 
            DROP CONSTRAINT "FK_department_employees_employeeId"
        `);

        await queryRunner.query(`
            ALTER TABLE "department_employees" 
            DROP CONSTRAINT "FK_department_employees_departmentId"
        `);

        // 테이블 삭제
        await queryRunner.query(`DROP TABLE "department_employees"`);
    }
}
