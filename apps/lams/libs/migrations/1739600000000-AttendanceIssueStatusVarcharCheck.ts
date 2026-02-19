import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * attendance_issue.status 컬럼을 enum → varchar(20) + CHECK 제약으로 변경
 */
export class AttendanceIssueStatusVarcharCheck1739600000000 implements MigrationInterface {
    name = 'AttendanceIssueStatusVarcharCheck1739600000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. 기존 CHECK 제약이 있으면 제거 (재실행 대비)
        await queryRunner.query(`
            ALTER TABLE "attendance_issue"
            DROP CONSTRAINT IF EXISTS "CHK_attendance_issue_status"
        `);

        // 2. status 컬럼을 varchar(20)으로 변경 (enum이었으면 ::text로 변환)
        await queryRunner.query(`
            ALTER TABLE "attendance_issue"
            ALTER COLUMN "status" TYPE character varying(20)
            USING "status"::text
        `);

        // 3. CHECK 제약 추가
        await queryRunner.query(`
            ALTER TABLE "attendance_issue"
            ADD CONSTRAINT "CHK_attendance_issue_status"
            CHECK ("status" IN ('pending', 'request', 'applied', 'not_applied'))
        `);

        // 4. 기본값 설정
        await queryRunner.query(`
            ALTER TABLE "attendance_issue"
            ALTER COLUMN "status" SET DEFAULT 'request'
        `);

        // 5. 기존 enum 타입이 있으면 제거
        await queryRunner.query(`
            DROP TYPE IF EXISTS "attendance_issue_status_enum" CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. CHECK 제약 제거
        await queryRunner.query(`
            ALTER TABLE "attendance_issue"
            DROP CONSTRAINT IF EXISTS "CHK_attendance_issue_status"
        `);

        // 2. enum 타입 생성
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "attendance_issue_status_enum" AS ENUM (
                    'pending', 'request', 'applied', 'not_applied'
                );
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;
        `);

        // 3. status 컬럼을 enum으로 되돌리기
        await queryRunner.query(`
            ALTER TABLE "attendance_issue"
            ALTER COLUMN "status" TYPE "attendance_issue_status_enum"
            USING "status"::"attendance_issue_status_enum"
        `);

        await queryRunner.query(`
            ALTER TABLE "attendance_issue"
            ALTER COLUMN "status" SET DEFAULT 'request'::"attendance_issue_status_enum"
        `);
    }
}
