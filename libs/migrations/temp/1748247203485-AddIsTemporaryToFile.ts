import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsTemporaryToFile1748247203485 implements MigrationInterface {
    name = 'AddIsTemporaryToFile1748247203485';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "files" 
            ADD COLUMN IF NOT EXISTS "isTemporary" boolean DEFAULT true
        `);

        await queryRunner.query(`
            ALTER TABLE "files" 
            ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        `);

        await queryRunner.query(`
            UPDATE "files" f
            SET "isTemporary" = false
            WHERE EXISTS (
                SELECT 1 FROM "resources" r
                WHERE r.images::jsonb ? f."filePath"
            )
        `);

        await queryRunner.query(`
            UPDATE "files" f
            SET "isTemporary" = false
            WHERE EXISTS (
                SELECT 1 FROM "vehicle_infos" v
                WHERE 
                    (v."parkingLocationImages"::jsonb ? f."filePath") OR
                    (v."odometerImages"::jsonb ? f."filePath") OR
                    (v."indoorImages"::jsonb ? f."filePath")
            )
        `);

        await queryRunner.query(`
            UPDATE "files" f
            SET "isTemporary" = false
            WHERE EXISTS (
                SELECT 1 FROM "maintenances" m
                WHERE m.images::jsonb ? f."filePath"
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "files" 
            DROP COLUMN IF EXISTS "isTemporary",
            DROP COLUMN IF EXISTS "createdAt"
        `);
    }
}
