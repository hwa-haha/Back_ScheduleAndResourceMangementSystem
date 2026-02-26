import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTesterInfoTable1748247203488 implements MigrationInterface {
    name = 'AddTesterInfoTable1748247203488';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // uuid-ossp 확장 활성화 (uuid_generate_v4() 함수 사용을 위해)
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // ResourceType enum에 TESTER 타입 추가
        await queryRunner.query(`
            ALTER TYPE "public"."resources_type_enum" ADD VALUE IF NOT EXISTS 'TESTER'
        `);

        // tester_infos 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "tester_infos" (
                "testerInfoId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "resourceId" uuid NOT NULL,
                CONSTRAINT "PK_tester_infos" PRIMARY KEY ("testerInfoId"),
                CONSTRAINT "UQ_tester_infos_resourceId" UNIQUE ("resourceId"),
                CONSTRAINT "FK_tester_infos_resources" FOREIGN KEY ("resourceId") 
                    REFERENCES "resources"("resourceId") ON DELETE CASCADE
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // tester_infos 테이블 삭제
        await queryRunner.query(`
            DROP TABLE "tester_infos"
        `);

        // ResourceType enum에서 TESTER 타입 제거는 불가능하므로 생략
        // (PostgreSQL에서는 enum에서 값을 제거하는 것이 불가능)
    }
}
