import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdjustEndDateForMidnight1756193100000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // reservations 테이블의 endDate가 15:00:00 (UTC, KST 00:00:00)인 경우 1초를 빼기
        await queryRunner.query(`
            UPDATE "reservations"
            SET "endDate" = "endDate" - INTERVAL '1 second'
            WHERE 
                EXTRACT(HOUR FROM "endDate" AT TIME ZONE 'UTC') = 15
                AND EXTRACT(MINUTE FROM "endDate" AT TIME ZONE 'UTC') = 0
                AND EXTRACT(SECOND FROM "endDate" AT TIME ZONE 'UTC') = 0
        `);

        // schedules 테이블의 endDate가 15:00:00 (UTC, KST 00:00:00)인 경우 1초를 빼기
        await queryRunner.query(`
            UPDATE "schedules"
            SET "endDate" = "endDate" - INTERVAL '1 second'
            WHERE 
                EXTRACT(HOUR FROM "endDate" AT TIME ZONE 'UTC') = 15
                AND EXTRACT(MINUTE FROM "endDate" AT TIME ZONE 'UTC') = 0
                AND EXTRACT(SECOND FROM "endDate" AT TIME ZONE 'UTC') = 0
        `);

        // 업데이트된 레코드 수 로그 (선택사항)
        const reservationCount = await queryRunner.query(`
            SELECT COUNT(*) as count 
            FROM "reservations"
            WHERE 
                EXTRACT(HOUR FROM "endDate" AT TIME ZONE 'UTC') = 14
                AND EXTRACT(MINUTE FROM "endDate" AT TIME ZONE 'UTC') = 59
                AND EXTRACT(SECOND FROM "endDate" AT TIME ZONE 'UTC') = 59
        `);

        const scheduleCount = await queryRunner.query(`
            SELECT COUNT(*) as count 
            FROM "schedules"
            WHERE 
                EXTRACT(HOUR FROM "endDate" AT TIME ZONE 'UTC') = 14
                AND EXTRACT(MINUTE FROM "endDate" AT TIME ZONE 'UTC') = 59
                AND EXTRACT(SECOND FROM "endDate" AT TIME ZONE 'UTC') = 59
        `);

        console.log(
            `마이그레이션 완료: ${reservationCount[0].count}개의 예약, ${scheduleCount[0].count}개의 일정이 업데이트됨`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 롤백: 1초를 뺀 것을 다시 더하기
        await queryRunner.query(`
            UPDATE "reservations"
            SET "endDate" = "endDate" + INTERVAL '1 second'
            WHERE 
                EXTRACT(HOUR FROM "endDate" AT TIME ZONE 'UTC') = 14
                AND EXTRACT(MINUTE FROM "endDate" AT TIME ZONE 'UTC') = 59
                AND EXTRACT(SECOND FROM "endDate" AT TIME ZONE 'UTC') = 59
        `);

        await queryRunner.query(`
            UPDATE "schedules"
            SET "endDate" = "endDate" + INTERVAL '1 second'
            WHERE 
                EXTRACT(HOUR FROM "endDate" AT TIME ZONE 'UTC') = 14
                AND EXTRACT(MINUTE FROM "endDate" AT TIME ZONE 'UTC') = 59
                AND EXTRACT(SECOND FROM "endDate" AT TIME ZONE 'UTC') = 59
        `);

        console.log('마이그레이션 롤백 완료: endDate가 15:00:00으로 복원됨');
    }
}
