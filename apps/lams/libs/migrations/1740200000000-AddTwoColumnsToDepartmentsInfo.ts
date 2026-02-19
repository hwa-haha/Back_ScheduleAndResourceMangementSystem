import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * departments-info 테이블에 컬럼 2개 추가
 * - isActive: 부서 활성 여부
 * - isException: 예외 부서 여부 (SSO ExportDepartmentDto 호환)
 */
export class AddTwoColumnsToDepartmentsInfo1740200000000 implements MigrationInterface {
    name = 'AddTwoColumnsToDepartmentsInfo1740200000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "departments-info"
            ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true,
            ADD COLUMN IF NOT EXISTS "isException" boolean NOT NULL DEFAULT false
        `);
        await queryRunner.query(`COMMENT ON COLUMN "departments-info"."isActive" IS '활성 여부';`);
        await queryRunner.query(`COMMENT ON COLUMN "departments-info"."isException" IS '예외 부서 여부';`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "departments-info"
            DROP COLUMN IF EXISTS "isActive",
            DROP COLUMN IF EXISTS "isException"
        `);
    }
}
