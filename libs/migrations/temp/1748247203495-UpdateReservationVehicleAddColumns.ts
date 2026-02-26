import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateReservationVehicleAddColumns1748247203495 implements MigrationInterface {
    name = 'UpdateReservationVehicleAddColumns1748247203495';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // reservation_vehicles 테이블에 새 컬럼들 추가
        await queryRunner.query(`
            ALTER TABLE "reservation_vehicles"
            ADD COLUMN IF NOT EXISTS "location" jsonb,
            ADD COLUMN IF NOT EXISTS "returnedBy" uuid,
            ADD COLUMN IF NOT EXISTS "remarks" varchar
        `);

        // 컬럼 코멘트 추가
        await queryRunner.query(`
            COMMENT ON COLUMN "reservation_vehicles"."location" IS '위치 정보';
            COMMENT ON COLUMN "reservation_vehicles"."returnedBy" IS '반납 처리자';
            COMMENT ON COLUMN "reservation_vehicles"."remarks" IS '비고';
        `);

        // FK to employees(returnedBy)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints tc
                    WHERE tc.constraint_name = 'FK_reservation_vehicles_returnedBy_employees'
                ) THEN
                    ALTER TABLE "reservation_vehicles"
                    ADD CONSTRAINT "FK_reservation_vehicles_returnedBy_employees" FOREIGN KEY ("returnedBy") REFERENCES "employees"("employeeId") ON DELETE SET NULL;
                END IF;
            END
            $$;
        `);

        // Backfill location from related vehicle's resource location
        await queryRunner.query(`
            UPDATE "reservation_vehicles" rv
            SET "location" = r."location"
            FROM "vehicle_infos" vi
            JOIN "resources" r ON r."resourceId" = vi."resourceId"
            WHERE vi."vehicleInfoId" = rv."vehicleInfoId" AND r."location" IS NOT NULL;
        `);

        // Backfill returnedBy from reservation's RESERVER participant (only for returned vehicles)
        await queryRunner.query(`
            UPDATE "reservation_vehicles" rv
            SET "returnedBy" = rp."employeeId"
            FROM "reservation_participants" rp
            WHERE rp."reservationId" = rv."reservationId" 
                AND rp."type" = 'RESERVER' 
                AND rv."isReturned" = true;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop FK if exists
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.table_constraints tc
                    WHERE tc.constraint_name = 'FK_reservation_vehicles_returnedBy_employees'
                ) THEN
                    ALTER TABLE "reservation_vehicles" DROP CONSTRAINT "FK_reservation_vehicles_returnedBy_employees";
                END IF;
            END
            $$;
        `);

        await queryRunner.query(`
            ALTER TABLE "reservation_vehicles"
            DROP COLUMN IF EXISTS "returnedBy",
            DROP COLUMN IF EXISTS "location",
            DROP COLUMN IF EXISTS "remarks"
        `);
    }
}
