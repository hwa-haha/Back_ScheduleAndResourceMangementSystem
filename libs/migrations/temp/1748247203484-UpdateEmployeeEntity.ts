import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEmployeeEntity1748247203484 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // role_type_enum 타입 생성
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."role_type_enum" AS ENUM ('USER', 'RESOURCE_ADMIN', 'SYSTEM_ADMIN');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        // 1단계: 새 컬럼 생성
        await queryRunner.query(`
            ALTER TABLE employees 
            ADD COLUMN roles_tmp role_type_enum[] DEFAULT '{USER}'::role_type_enum[]
        `);

        // 2단계: 기존 컬럼 복사
        await queryRunner.query(`
            UPDATE employees 
            SET roles_tmp = roles::text[]::role_type_enum[]
        `);

        // 3단계: 기존 컬럼 삭제
        await queryRunner.query(`
            ALTER TABLE employees 
            DROP COLUMN roles
        `);

        // 4단계: 새 컬럼 이름 변경
        await queryRunner.query(`
            ALTER TABLE employees 
            RENAME COLUMN roles_tmp TO roles
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1단계: 새 컬럼 생성
        await queryRunner.query(`
            ALTER TABLE employees 
            ADD COLUMN roles_tmp text[] DEFAULT '{USER}'
        `);

        // 2단계: 기존 컬럼 복사
        await queryRunner.query(`
            UPDATE employees 
            SET roles_tmp = roles::text[]
        `);

        // 3단계: 기존 컬럼 삭제
        await queryRunner.query(`
            ALTER TABLE employees 
            DROP COLUMN roles
        `);

        // 4단계: 새 컬럼 이름 변경
        await queryRunner.query(`
            ALTER TABLE employees 
            RENAME COLUMN roles_tmp TO roles
        `);

        // role_type_enum 타입 삭제
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."role_type_enum"`);
    }
}
