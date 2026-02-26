import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 직원-부서 권한 변경 이력 테이블 생성
 * employee_department_permission_history
 */
export class CreateEmployeeDepartmentPermissionHistoryTable1740300000000
    implements MigrationInterface
{
    name = 'CreateEmployeeDepartmentPermissionHistoryTable1740300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "employee_department_permission_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP WITH TIME ZONE,
                "created_by" varchar(255),
                "updated_by" varchar(255),
                "version" integer NOT NULL DEFAULT 1,
                "employee_id" uuid NOT NULL,
                "department_id" uuid NOT NULL,
                "action" varchar(20) NOT NULL,
                "has_access_permission" boolean NOT NULL,
                "has_review_permission" boolean NOT NULL,
                "previous_has_access_permission" boolean,
                "previous_has_review_permission" boolean,
                "changed_at" TIMESTAMP NOT NULL,
                "changed_by" uuid,
                CONSTRAINT "PK_employee_department_permission_history" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            COMMENT ON TABLE "employee_department_permission_history" IS '직원-부서 권한 변경 이력';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "employee_department_permission_history"."employee_id" IS '직원 ID';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "employee_department_permission_history"."department_id" IS '부서 ID';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "employee_department_permission_history"."action" IS '변경 액션';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "employee_department_permission_history"."has_access_permission" IS '접근 권한 스냅샷';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "employee_department_permission_history"."has_review_permission" IS '검토 권한 스냅샷';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "employee_department_permission_history"."previous_has_access_permission" IS '변경 전 접근 권한';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "employee_department_permission_history"."previous_has_review_permission" IS '변경 전 검토 권한';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "employee_department_permission_history"."changed_at" IS '변경 시각';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "employee_department_permission_history"."changed_by" IS '변경자';
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_employee_department_permission_history_employee_department_changed"
            ON "employee_department_permission_history" ("employee_id", "department_id", "changed_at")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_employee_department_permission_history_action"
            ON "employee_department_permission_history" ("action")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_employee_department_permission_history_action"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_employee_department_permission_history_employee_department_changed"
        `);
        await queryRunner.query(`
            DROP TABLE IF EXISTS "employee_department_permission_history"
        `);
    }
}
