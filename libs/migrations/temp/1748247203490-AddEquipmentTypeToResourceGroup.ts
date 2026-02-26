import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEquipmentTypeToResourceGroup1748247203490 implements MigrationInterface {
    name = 'AddEquipmentTypeToResourceGroup1748247203490';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // resource_groups 테이블의 type enum에 EQUIPMENT 값 추가
        await queryRunner.query(`
            ALTER TYPE "public"."resource_groups_type_enum" ADD VALUE IF NOT EXISTS 'EQUIPMENT'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL에서는 enum에서 값을 제거하는 것이 불가능하므로 생략
        // ALTER TYPE "public"."resource_groups_type_enum" REMOVE VALUE 'EQUIPMENT'
    }
}
