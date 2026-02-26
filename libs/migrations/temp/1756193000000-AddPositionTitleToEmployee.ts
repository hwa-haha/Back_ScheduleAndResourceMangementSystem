import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPositionTitleToEmployee1756193000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // employees 테이블에 positionTitle 컬럼 추가
        await queryRunner.query(`
            ALTER TABLE "employees" 
            ADD COLUMN "positionTitle" character varying
        `);

        // positionTitle 컬럼에 코멘트 추가
        await queryRunner.query(`
            COMMENT ON COLUMN "employees"."positionTitle" IS '직위'
        `);

        // rank 컬럼 추가
        await queryRunner.query(`
            ALTER TABLE "employees" 
            ADD COLUMN "rank" character varying
        `);

        // rank 컬럼에 코멘트 추가
        await queryRunner.query(`
            COMMENT ON COLUMN "employees"."rank" IS '직급'
        `);

        // position 컬럼에 코멘트 추가 (기존 컬럼)
        await queryRunner.query(`
            COMMENT ON COLUMN "employees"."position" IS '직급 (레거시)'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // employees 테이블에서 positionTitle 컬럼 삭제
        await queryRunner.query(`
            ALTER TABLE "employees" 
            DROP COLUMN "positionTitle"
        `);

        // employees 테이블에서 rank 컬럼 삭제
        await queryRunner.query(`
            ALTER TABLE "employees" 
            DROP COLUMN "rank"
        `);
    }
}
