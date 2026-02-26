import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParkingCoordinatesToVehicleInfo1756192600000 implements MigrationInterface {
    name = 'AddParkingCoordinatesToVehicleInfo1756192600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // vehicle_infos 테이블에 parkingCoordinates 컬럼 추가
        await queryRunner.query(`
            ALTER TABLE "vehicle_infos" 
            ADD COLUMN "parkingCoordinates" jsonb
        `);

        // 컬럼에 코멘트 추가
        await queryRunner.query(`
            COMMENT ON COLUMN "vehicle_infos"."parkingCoordinates" IS '주차위치 좌표 (위도, 경도)'
        `);

        // reservation_vehicles 테이블에도 parkingCoordinates 컬럼 추가
        await queryRunner.query(`
            ALTER TABLE "reservation_vehicles" 
            ADD COLUMN "parkingCoordinates" jsonb
        `);

        // 컬럼에 코멘트 추가
        await queryRunner.query(`
            COMMENT ON COLUMN "reservation_vehicles"."parkingCoordinates" IS '주차위치 좌표 (위도, 경도)'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // reservation_vehicles 테이블의 parkingCoordinates 컬럼 삭제
        await queryRunner.query(`
            ALTER TABLE "reservation_vehicles" 
            DROP COLUMN "parkingCoordinates"
        `);

        // vehicle_infos 테이블의 parkingCoordinates 컬럼 삭제
        await queryRunner.query(`
            ALTER TABLE "vehicle_infos" 
            DROP COLUMN "parkingCoordinates"
        `);
    }
}
