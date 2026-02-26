import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTesterInfoToEquipment1748247203489 implements MigrationInterface {
    name = 'RenameTesterInfoToEquipment1748247203489';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // enum 값 변경
        await queryRunner.query(`
            ALTER TYPE "public"."resources_type_enum" RENAME VALUE 'TESTER' TO 'EQUIPMENT'
        `);

        // 테이블 이름 변경
        await queryRunner.query(`
            ALTER TABLE "tester_infos" RENAME TO "equipment_infos"
        `);

        // 컬럼 이름 변경
        await queryRunner.query(`
            ALTER TABLE "equipment_infos" 
            RENAME COLUMN "testerInfoId" TO "equipmentInfoId"
        `);

        // 제약조건 이름 변경
        await queryRunner.query(`
            ALTER TABLE "equipment_infos" 
            RENAME CONSTRAINT "PK_tester_infos" TO "PK_equipment_infos"
        `);

        await queryRunner.query(`
            ALTER TABLE "equipment_infos" 
            RENAME CONSTRAINT "UQ_tester_infos_resourceId" TO "UQ_equipment_infos_resourceId"
        `);

        await queryRunner.query(`
            ALTER TABLE "equipment_infos" 
            RENAME CONSTRAINT "FK_tester_infos_resources" TO "FK_equipment_infos_resources"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 제약조건 이름 변경 (원래대로)
        await queryRunner.query(`
            ALTER TABLE "equipment_infos" 
            RENAME CONSTRAINT "FK_equipment_infos_resources" TO "FK_tester_infos_resources"
        `);

        await queryRunner.query(`
            ALTER TABLE "equipment_infos" 
            RENAME CONSTRAINT "UQ_equipment_infos_resourceId" TO "UQ_tester_infos_resourceId"
        `);

        await queryRunner.query(`
            ALTER TABLE "equipment_infos" 
            RENAME CONSTRAINT "PK_equipment_infos" TO "PK_tester_infos"
        `);

        // 컬럼 이름 변경 (원래대로)
        await queryRunner.query(`
            ALTER TABLE "equipment_infos" 
            RENAME COLUMN "equipmentInfoId" TO "testerInfoId"
        `);

        // 테이블 이름 변경 (원래대로)
        await queryRunner.query(`
            ALTER TABLE "equipment_infos" RENAME TO "tester_infos"
        `);

        // enum 값 변경 (원래대로)
        await queryRunner.query(`
            ALTER TYPE "public"."resources_type_enum" RENAME VALUE 'EQUIPMENT' TO 'TESTER'
        `);
    }
}
