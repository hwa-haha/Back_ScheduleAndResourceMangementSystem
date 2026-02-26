import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFileLinkTables1748247203497 implements MigrationInterface {
    name = 'CreateFileLinkTables1748247203497';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // uuid-ossp 확장 활성화 (uuid_generate_v4() 함수 사용을 위해)
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // file_resources
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "file_resources" (
                "fileResourceId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "resourceId" uuid NOT NULL,
                "fileId" uuid NOT NULL,
                CONSTRAINT "PK_file_resources" PRIMARY KEY ("fileResourceId"),
                CONSTRAINT "FK_file_resources_resources" FOREIGN KEY ("resourceId") REFERENCES "resources"("resourceId") ON DELETE CASCADE,
                CONSTRAINT "FK_file_resources_files" FOREIGN KEY ("fileId") REFERENCES "files"("fileId") ON DELETE CASCADE
            );
        `);
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_file_resources_resourceId" ON "file_resources" ("resourceId");`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_file_resources_fileId" ON "file_resources" ("fileId");`,
        );

        // file_vehicle_infos
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "file_vehicle_infos" (
                "fileVehicleInfoId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "vehicleInfoId" uuid NOT NULL,
                "fileId" uuid NOT NULL,
                "type" character varying NOT NULL,
                CONSTRAINT "PK_file_vehicle_infos" PRIMARY KEY ("fileVehicleInfoId"),
                CONSTRAINT "FK_file_vehicle_infos_vehicle_infos" FOREIGN KEY ("vehicleInfoId") REFERENCES "vehicle_infos"("vehicleInfoId") ON DELETE CASCADE,
                CONSTRAINT "FK_file_vehicle_infos_files" FOREIGN KEY ("fileId") REFERENCES "files"("fileId") ON DELETE CASCADE
            );
        `);
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_file_vehicle_infos_vehicleInfoId" ON "file_vehicle_infos" ("vehicleInfoId");`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_file_vehicle_infos_fileId" ON "file_vehicle_infos" ("fileId");`,
        );

        // file_maintenances
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "file_maintenances" (
                "fileMaintenanceId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "maintenanceId" uuid NOT NULL,
                "fileId" uuid NOT NULL,
                CONSTRAINT "PK_file_maintenances" PRIMARY KEY ("fileMaintenanceId"),
                CONSTRAINT "FK_file_maintenances_maintenances" FOREIGN KEY ("maintenanceId") REFERENCES "maintenances"("maintenanceId") ON DELETE CASCADE,
                CONSTRAINT "FK_file_maintenances_files" FOREIGN KEY ("fileId") REFERENCES "files"("fileId") ON DELETE CASCADE
            );
        `);
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_file_maintenances_maintenanceId" ON "file_maintenances" ("maintenanceId");`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_file_maintenances_fileId" ON "file_maintenances" ("fileId");`,
        );

        // file_reservation_vehicles
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "file_reservation_vehicles" (
                "fileReservationVehicleId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "reservationVehicleId" uuid NOT NULL,
                "fileId" uuid NOT NULL,
                "type" character varying NOT NULL,
                CONSTRAINT "PK_file_reservation_vehicles" PRIMARY KEY ("fileReservationVehicleId"),
                CONSTRAINT "FK_file_reservation_vehicles_reservation_vehicles" FOREIGN KEY ("reservationVehicleId") REFERENCES "reservation_vehicles"("reservationVehicleId") ON DELETE CASCADE,
                CONSTRAINT "FK_file_reservation_vehicles_files" FOREIGN KEY ("fileId") REFERENCES "files"("fileId") ON DELETE CASCADE
            );
        `);
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_file_reservation_vehicles_reservationVehicleId" ON "file_reservation_vehicles" ("reservationVehicleId");`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_file_reservation_vehicles_fileId" ON "file_reservation_vehicles" ("fileId");`,
        );

        // ---------- Backfill link tables from existing image path arrays ----------
        // resources.images -> file_resources
        await queryRunner.query(`
            INSERT INTO "file_resources" ("fileResourceId", "resourceId", "fileId")
            SELECT uuid_generate_v4(), r."resourceId", f."fileId"
            FROM "resources" r
            CROSS JOIN LATERAL jsonb_array_elements_text(r."images") AS img_path
            JOIN "files" f ON f."filePath" = img_path
            WHERE r."images" IS NOT NULL
            ON CONFLICT DO NOTHING;
        `);

        // vehicle_infos.parkingLocationImages -> file_vehicle_infos (type = 'PARKING_LOCATION')
        await queryRunner.query(`
            INSERT INTO "file_vehicle_infos" ("fileVehicleInfoId", "vehicleInfoId", "fileId", "type")
            SELECT uuid_generate_v4(), vi."vehicleInfoId", f."fileId", 'PARKING_LOCATION'
            FROM "vehicle_infos" vi
            CROSS JOIN LATERAL jsonb_array_elements_text(vi."parkingLocationImages") AS img_path
            JOIN "files" f ON f."filePath" = img_path
            WHERE vi."parkingLocationImages" IS NOT NULL
            ON CONFLICT DO NOTHING;
        `);

        // vehicle_infos.odometerImages -> file_vehicle_infos (type = 'ODOMETER')
        await queryRunner.query(`
            INSERT INTO "file_vehicle_infos" ("fileVehicleInfoId", "vehicleInfoId", "fileId", "type")
            SELECT uuid_generate_v4(), vi."vehicleInfoId", f."fileId", 'ODOMETER'
            FROM "vehicle_infos" vi
            CROSS JOIN LATERAL jsonb_array_elements_text(vi."odometerImages") AS img_path
            JOIN "files" f ON f."filePath" = img_path
            WHERE vi."odometerImages" IS NOT NULL
            ON CONFLICT DO NOTHING;
        `);

        // vehicle_infos.indoorImages -> file_vehicle_infos (type = 'INDOOR')
        await queryRunner.query(`
            INSERT INTO "file_vehicle_infos" ("fileVehicleInfoId", "vehicleInfoId", "fileId", "type")
            SELECT uuid_generate_v4(), vi."vehicleInfoId", f."fileId", 'INDOOR'
            FROM "vehicle_infos" vi
            CROSS JOIN LATERAL jsonb_array_elements_text(vi."indoorImages") AS img_path
            JOIN "files" f ON f."filePath" = img_path
            WHERE vi."indoorImages" IS NOT NULL
            ON CONFLICT DO NOTHING;
        `);

        // maintenances.images (json/jsonb) -> file_maintenances
        await queryRunner.query(`
            INSERT INTO "file_maintenances" ("fileMaintenanceId", "maintenanceId", "fileId")
            SELECT uuid_generate_v4(), m."maintenanceId", f."fileId"
            FROM "maintenances" m
            CROSS JOIN LATERAL jsonb_array_elements_text((m."images")::jsonb) AS img_path
            JOIN "files" f ON f."filePath" = img_path
            WHERE m."images" IS NOT NULL
            ON CONFLICT DO NOTHING;
        `);

        // reservation_vehicles: vehicle_infos의 이미지 배열을 통해 파일 매핑하여 연결
        // 각 vehicleInfoId별로 가장 최신의 reservation_vehicles만 선택
        // parkingLocationImages -> type = 'PARKING_LOCATION'
        await queryRunner.query(`
            INSERT INTO "file_reservation_vehicles" ("fileReservationVehicleId", "reservationVehicleId", "fileId", "type")
            SELECT uuid_generate_v4(), latest_rv."reservationVehicleId", f."fileId", 'PARKING_LOCATION'
            FROM (
                SELECT rv."reservationVehicleId", rv."vehicleInfoId",
                       ROW_NUMBER() OVER (PARTITION BY rv."vehicleInfoId" ORDER BY r."startDate" DESC) as rn
                FROM "reservation_vehicles" rv
                JOIN "reservations" r ON r."reservationId" = rv."reservationId"
            ) latest_rv
            JOIN "vehicle_infos" vi ON vi."vehicleInfoId" = latest_rv."vehicleInfoId"
            CROSS JOIN LATERAL jsonb_array_elements_text(vi."parkingLocationImages") AS img_path
            JOIN "files" f ON f."filePath" = img_path
            WHERE latest_rv.rn = 1 AND vi."parkingLocationImages" IS NOT NULL;
        `);
        // odometerImages -> type = 'ODOMETER'
        await queryRunner.query(`
            INSERT INTO "file_reservation_vehicles" ("fileReservationVehicleId", "reservationVehicleId", "fileId", "type")
            SELECT uuid_generate_v4(), latest_rv."reservationVehicleId", f."fileId", 'ODOMETER'
            FROM (
                SELECT rv."reservationVehicleId", rv."vehicleInfoId",
                       ROW_NUMBER() OVER (PARTITION BY rv."vehicleInfoId" ORDER BY r."startDate" DESC) as rn
                FROM "reservation_vehicles" rv
                JOIN "reservations" r ON r."reservationId" = rv."reservationId"
            ) latest_rv
            JOIN "vehicle_infos" vi ON vi."vehicleInfoId" = latest_rv."vehicleInfoId"
            CROSS JOIN LATERAL jsonb_array_elements_text(vi."odometerImages") AS img_path
            JOIN "files" f ON f."filePath" = img_path
            WHERE latest_rv.rn = 1 AND vi."odometerImages" IS NOT NULL;
        `);

        // indoorImages -> type = 'INDOOR'
        await queryRunner.query(`
            INSERT INTO "file_reservation_vehicles" ("fileReservationVehicleId", "reservationVehicleId", "fileId", "type")
            SELECT uuid_generate_v4(), latest_rv."reservationVehicleId", f."fileId", 'INDOOR'
            FROM (
                SELECT rv."reservationVehicleId", rv."vehicleInfoId",
                       ROW_NUMBER() OVER (PARTITION BY rv."vehicleInfoId" ORDER BY r."startDate" DESC) as rn
                FROM "reservation_vehicles" rv
                JOIN "reservations" r ON r."reservationId" = rv."reservationId"
            ) latest_rv
            JOIN "vehicle_infos" vi ON vi."vehicleInfoId" = latest_rv."vehicleInfoId"
            CROSS JOIN LATERAL jsonb_array_elements_text(vi."indoorImages") AS img_path
            JOIN "files" f ON f."filePath" = img_path
            WHERE latest_rv.rn = 1 AND vi."indoorImages" IS NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // remove backfilled relations first (idempotent)
        await queryRunner.query(`DELETE FROM "file_reservation_vehicles"`);
        await queryRunner.query(`DELETE FROM "file_maintenances"`);
        await queryRunner.query(`DELETE FROM "file_vehicle_infos"`);
        await queryRunner.query(`DELETE FROM "file_resources"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_file_reservation_vehicles_fileId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_file_reservation_vehicles_reservationVehicleId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "file_reservation_vehicles"`);

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_file_maintenances_fileId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_file_maintenances_maintenanceId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "file_maintenances"`);

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_file_vehicle_infos_fileId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_file_vehicle_infos_vehicleInfoId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "file_vehicle_infos"`);

        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_file_resources_fileId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_file_resources_resourceId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "file_resources"`);
    }
}
