import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsHiddenInFilterToEmployee1756193200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // employees 테이블에 isHiddenInFilter 컬럼 추가
        await queryRunner.query(`
            ALTER TABLE "employees" 
            ADD COLUMN "isHiddenInFilter" boolean NOT NULL DEFAULT false
        `);

        // isHiddenInFilter 컬럼에 코멘트 추가
        await queryRunner.query(`
            COMMENT ON COLUMN "employees"."isHiddenInFilter" IS '필터링 조건에서 숨기기 여부'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // employees 테이블에서 isHiddenInFilter 컬럼 삭제
        await queryRunner.query(`
            ALTER TABLE "employees" 
            DROP COLUMN "isHiddenInFilter"
        `);
    }
}
