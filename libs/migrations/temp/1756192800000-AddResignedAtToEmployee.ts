import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResignedAtToEmployee1756192800000 implements MigrationInterface {
    name = 'AddResignedAtToEmployee1756192800000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // employees 테이블에 퇴사일 컬럼 추가
        await queryRunner.query(`
            ALTER TABLE "employees" 
            ADD "status" character varying DEFAULT NULL
        `);

        // 컬럼 코멘트 추가
        await queryRunner.query(`
            COMMENT ON COLUMN "employees"."status" IS '직원 상태 (재직중, 퇴사)'
        `);

        // 퇴사일 기준 인덱스 생성 (성능 최적화를 위해)
        await queryRunner.query(`
            CREATE INDEX "IDX_employee_status" ON "employees" ("status")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 인덱스 삭제
        await queryRunner.query(`DROP INDEX "IDX_employee_status"`);

        // 컬럼 삭제
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "status"`);
    }
}
