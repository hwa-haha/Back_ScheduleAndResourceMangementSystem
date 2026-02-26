import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationTypes1748247203491 implements MigrationInterface {
    name = 'AddNotificationTypes1748247203491';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // notifications 테이블의 notificationType enum에 새로운 값들 추가
        await queryRunner.query(`
            ALTER TYPE "public"."notifications_notificationtype_enum" ADD VALUE IF NOT EXISTS 'RESOURCE_VEHICLE_DELAYED_RETURNED'
        `);

        await queryRunner.query(`
            ALTER TYPE "public"."notifications_notificationtype_enum" ADD VALUE IF NOT EXISTS 'RESOURCE_CONSUMABLE_DELAYED_REPLACING'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // PostgreSQL에서는 enum에서 값을 제거하는 것이 복잡하므로 생략
        // 필요시 enum을 다시 생성하는 방식으로 처리해야 함
    }
}
