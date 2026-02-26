import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEmployeeEntity1747904899145 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "employees"
            ADD COLUMN "email" character varying,
            ADD COLUMN "mobile" character varying,
            ADD COLUMN "password" character varying,
            ADD COLUMN "accessToken" character varying,
            ADD COLUMN "expiredAt" character varying,
            ADD COLUMN "subscriptions" jsonb,
            ADD COLUMN "isPushNotificationEnabled" boolean NOT NULL DEFAULT true,
            ADD COLUMN "roles" text[] NOT NULL DEFAULT '{USER}'
        `);

        await queryRunner.query(`
            UPDATE "employees" e
            SET 
                "email" = u.email,
                "mobile" = u.mobile,
                "password" = u.password,
                "accessToken" = u."accessToken",
                "expiredAt" = u."expiredAt",
                "subscriptions" = u.subscriptions,
                "isPushNotificationEnabled" = u."isPushNotificationEnabled",
                "roles" = u.roles
            FROM "users" u
            WHERE e."userId" = u."userId"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "employees"
            DROP COLUMN "email",
            DROP COLUMN "mobile",
            DROP COLUMN "password",
            DROP COLUMN "accessToken",
            DROP COLUMN "expiredAt",
            DROP COLUMN "subscriptions",
            DROP COLUMN "isPushNotificationEnabled",
            DROP COLUMN "roles"
        `);
    }
}
