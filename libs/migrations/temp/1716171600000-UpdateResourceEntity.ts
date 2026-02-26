import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateResourceEntity1716171600000 implements MigrationInterface {
    name = 'UpdateResourceEntity1716171600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // locationURLs 컬럼 추가 (jsonb 타입)
        await queryRunner.query(`ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "locationURLs" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // locationURLs 컬럼 삭제
        await queryRunner.query(`ALTER TABLE "resources" DROP COLUMN IF EXISTS "locationURLs"`);
    }
}
