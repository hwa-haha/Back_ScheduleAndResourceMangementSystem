import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveResourceLocationURLsToAccommodation1748247203496 implements MigrationInterface {
    name = 'MoveResourceLocationURLsToAccommodation1748247203496';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1) accommodation_infos 테이블에 locationURLs 컬럼 추가
        await queryRunner.query(`
            ALTER TABLE "accommodation_infos" ADD COLUMN IF NOT EXISTS "locationURLs" jsonb
        `);

        // 2) resources.locationURLs 데이터를 accommodation_infos로 마이그레이션
        await queryRunner.query(`
            UPDATE "accommodation_infos" ai
            SET "locationURLs" = r."locationURLs"
            FROM "resources" r
            WHERE ai."resourceId" = r."resourceId" AND r."locationURLs" IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 2) accommodation_infos에서 resources로 데이터 복구
        await queryRunner.query(`
            UPDATE "resources" r
            SET "locationURLs" = ai."locationURLs"
            FROM "accommodation_infos" ai
            WHERE ai."resourceId" = r."resourceId" AND ai."locationURLs" IS NOT NULL
        `);

        // 3) accommodation_infos에서 컬럼 제거
        await queryRunner.query(`
            ALTER TABLE "accommodation_infos" DROP COLUMN IF EXISTS "locationURLs"
        `);
    }
}
