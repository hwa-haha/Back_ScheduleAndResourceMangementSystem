import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSchedulesAndParticipants1748247203494 implements MigrationInterface {
    name = 'CreateSchedulesAndParticipants1748247203494';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // uuid-ossp 확장 활성화 (uuid_generate_v4() 함수 사용을 위해)
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // 기존 schedules 관련 테이블들 삭제 (사용하지 않는 테이블들)
        await queryRunner.query(`DROP TABLE IF EXISTS "schedules"`);

        // 기존 enum 타입들도 삭제
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_participants_type_enum') THEN
                    DROP TYPE "public"."schedule_participants_type_enum";
                END IF;
            END
            $$;
        `);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type_enum') THEN
                    DROP TYPE "public"."schedule_type_enum";
                END IF;
            END
            $$;
        `);

        // enum type for schedule_participants.type
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_participants_type_enum') THEN
                    CREATE TYPE "public"."schedule_participants_type_enum" AS ENUM ('RESERVER', 'PARTICIPANT', 'CC_RECEIPIENT');
                END IF;
            END
            $$;
        `);

        // enum type for schedule_relations.scheduleType
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type_enum') THEN
                    CREATE TYPE "public"."schedule_type_enum" AS ENUM ('COMPANY', 'DEPARTMENT', 'PERSONAL');
                END IF;
            END
            $$;
        `);

        // enum type for schedules.status (추가)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedules_status_enum') THEN
                    CREATE TYPE "public"."schedules_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');
                END IF;
            END
            $$;
        `);

        // schedules table with all columns
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "schedules" (
                "scheduleId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "description" text,
                "location" character varying,
                "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
                "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
                "notifyBeforeStart" boolean NOT NULL DEFAULT false,
                "notifyMinutesBeforeStart" jsonb,
                "scheduleType" "public"."schedule_type_enum" NOT NULL DEFAULT 'PERSONAL',
                "status" "public"."schedules_status_enum" NOT NULL DEFAULT 'PENDING',
                "completionReason" character varying,
                "scheduleDepartment" character varying,
                "deletedAt" timestamp with time zone,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_schedules" PRIMARY KEY ("scheduleId")
            );
            
            COMMENT ON COLUMN "schedules"."title" IS '일정 제목';
            COMMENT ON COLUMN "schedules"."description" IS '일정 설명';
            COMMENT ON COLUMN "schedules"."location" IS '장소';
            COMMENT ON COLUMN "schedules"."startDate" IS '시작 일시';
            COMMENT ON COLUMN "schedules"."endDate" IS '종료 일시';
            COMMENT ON COLUMN "schedules"."notifyBeforeStart" IS '시작 전 알림 여부';
            COMMENT ON COLUMN "schedules"."notifyMinutesBeforeStart" IS '시작 전 알림 시간(분)';
            COMMENT ON COLUMN "schedules"."scheduleType" IS '일정 유형';
            COMMENT ON COLUMN "schedules"."status" IS '일정 상태 (대기/진행중/완료/취소)';
            COMMENT ON COLUMN "schedules"."completionReason" IS '완료 사유';
            COMMENT ON COLUMN "schedules"."scheduleDepartment" IS '일정 담당 부서';
            COMMENT ON COLUMN "schedules"."deletedAt" IS '소프트 삭제 일시';
            COMMENT ON COLUMN "schedules"."createdAt" IS '생성일';
            COMMENT ON COLUMN "schedules"."updatedAt" IS '수정일';
        `);

        // schedule_participants table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "schedule_participants" (
                "participantId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "scheduleId" uuid NOT NULL,
                "employeeId" uuid NOT NULL,
                "type" "public"."schedule_participants_type_enum" NOT NULL,
                CONSTRAINT "PK_schedule_participants" PRIMARY KEY ("participantId"),
                CONSTRAINT "FK_schedule_participants_schedules" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("scheduleId") ON DELETE CASCADE
            );
            
            COMMENT ON TABLE "schedule_participants" IS '일정 참여자 테이블';
            COMMENT ON COLUMN "schedule_participants"."scheduleId" IS '일정 ID';
            COMMENT ON COLUMN "schedule_participants"."employeeId" IS '직원 ID';
            COMMENT ON COLUMN "schedule_participants"."type" IS '참여자 유형';
        `);

        // schedule_relations table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "schedule_relations" (
                "scheduleRelationId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "scheduleId" uuid NOT NULL,
                "reservationId" uuid,
                "projectId" uuid,
                CONSTRAINT "PK_schedule_relations" PRIMARY KEY ("scheduleRelationId"),
                CONSTRAINT "FK_schedule_relations_schedule" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("scheduleId") ON DELETE CASCADE
            );
            
            COMMENT ON TABLE "schedule_relations" IS '일정 관계 테이블';
            COMMENT ON COLUMN "schedule_relations"."scheduleId" IS '일정 ID';
            COMMENT ON COLUMN "schedule_relations"."reservationId" IS '예약 ID';
            COMMENT ON COLUMN "schedule_relations"."projectId" IS '프로젝트 ID';
        `);

        // 인덱스 생성
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_schedules_status" ON "schedules" ("status")`);
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_schedules_scheduleType" ON "schedules" ("scheduleType")`,
        );
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_schedules_startDate" ON "schedules" ("startDate")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_schedules_endDate" ON "schedules" ("endDate")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_schedules_deletedAt" ON "schedules" ("deletedAt")`);
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_schedules_scheduleDepartment" ON "schedules" ("scheduleDepartment")`,
        );

        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_schedule_participants_scheduleId" ON "schedule_participants" ("scheduleId");`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_schedule_participants_employeeId" ON "schedule_participants" ("employeeId");`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_schedule_participants_type" ON "schedule_participants" ("type")`,
        );

        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_schedule_relations_scheduleId" ON "schedule_relations" ("scheduleId");`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_schedule_relations_reservationId" ON "schedule_relations" ("reservationId")`,
        );
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_schedule_relations_projectId" ON "schedule_relations" ("projectId")`,
        );

        // backfill schedules from reservations (use reservationId as scheduleId for stable mapping)
        await queryRunner.query(`
            INSERT INTO "schedules" (
                "scheduleId", "title", "description", "startDate", "endDate",
                "notifyBeforeStart", "notifyMinutesBeforeStart", "scheduleType", 
                "status", "completionReason", "scheduleDepartment"
            )
            SELECT 
                r."reservationId", 
                r."title", 
                r."description", 
                r."startDate", 
                r."endDate",
                r."notifyBeforeStart", 
                r."notifyMinutesBeforeStart", 
                'PERSONAL'::schedule_type_enum,
                CASE 
                    WHEN r."status" = 'CANCELLED' THEN 'CANCELLED'::schedules_status_enum
                    WHEN r."endDate" < NOW() THEN 'COMPLETED'::schedules_status_enum
                    WHEN r."startDate" <= NOW() AND r."endDate" >= NOW() THEN 'PROCESSING'::schedules_status_enum
                    ELSE 'PENDING'::schedules_status_enum
                END,
                NULL, -- completionReason
                NULL -- scheduleDepartment
            FROM "reservations" r
            WHERE NOT EXISTS (
                SELECT 1 FROM "schedules" s WHERE s."scheduleId" = r."reservationId"
            );
        `);

        // backfill schedule_participants from reservation_participants
        await queryRunner.query(`
            INSERT INTO "schedule_participants" (
                "participantId", "scheduleId", "employeeId", "type"
            )
            SELECT uuid_generate_v4(), rp."reservationId", rp."employeeId",
                   (rp."type"::text)::"public"."schedule_participants_type_enum"
            FROM "reservation_participants" rp
            WHERE EXISTS (
                SELECT 1 FROM "schedules" s WHERE s."scheduleId" = rp."reservationId"
            );
        `);

        // backfill schedule_relations from reservations <-> schedules
        await queryRunner.query(`
            INSERT INTO "schedule_relations" (
                "scheduleRelationId", "scheduleId", "reservationId", "projectId"
            )
            SELECT uuid_generate_v4(), r."reservationId", r."reservationId", NULL
            FROM "reservations" r
            WHERE EXISTS (
                SELECT 1 FROM "schedules" s WHERE s."scheduleId" = r."reservationId"
            )
            AND NOT EXISTS (
                SELECT 1 FROM "schedule_relations" sr WHERE sr."reservationId" = r."reservationId"
            );
        `);

        // 취소된 일정에 deletedAt 설정 (시작날짜 1일 전으로)
        await queryRunner.query(`
            UPDATE "schedules" 
            SET "deletedAt" = ("startDate" - INTERVAL '1 day')
            WHERE "status" = 'CANCELLED' 
            AND "deletedAt" IS NULL
        `);

        // 취소된 일정에 완료 사유 설정
        await queryRunner.query(`
            UPDATE "schedules" 
            SET "completionReason" = '일정 취소'
            WHERE "status" = 'CANCELLED' 
            AND "completionReason" IS NULL
        `);

        // Schedule Relations에 추가 외래키 제약조건 설정 (reservations 테이블 참조)
        await queryRunner.query(`
            ALTER TABLE "schedule_relations" 
            ADD CONSTRAINT "FK_schedule_relations_reservationId" 
            FOREIGN KEY ("reservationId") 
            REFERENCES "reservations"("reservationId") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Schedule Relations 외래키 제약조건 제거
        await queryRunner.query(`
            ALTER TABLE "schedule_relations" 
            DROP CONSTRAINT IF EXISTS "FK_schedule_relations_reservationId"
        `);

        // 취소된 일정의 deletedAt과 완료 사유 초기화 (백필된 스케줄 삭제 전)
        await queryRunner.query(`
            UPDATE "schedules" 
            SET "deletedAt" = NULL,
                "completionReason" = NULL
            WHERE "status" = 'CANCELLED'
            AND ("deletedAt" IS NOT NULL OR "completionReason" IS NOT NULL)
        `);

        // remove backfilled relations
        await queryRunner.query(`
            DELETE FROM "schedule_relations" sr
            USING "reservations" r
            WHERE sr."reservationId" = r."reservationId";
        `);
        // remove backfilled participants
        await queryRunner.query(`
            DELETE FROM "schedule_participants" sp
            USING "reservations" r
            WHERE sp."scheduleId" = r."reservationId";
        `);

        // remove backfilled schedules
        await queryRunner.query(`
            DELETE FROM "schedules" s
            USING "reservations" r
            WHERE s."scheduleId" = r."reservationId";
        `);
        // 인덱스 삭제
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedule_relations_projectId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedule_relations_reservationId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedule_relations_scheduleId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedule_participants_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedule_participants_employeeId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedule_participants_scheduleId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedules_scheduleDepartment"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedules_deletedAt"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedules_endDate"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedules_startDate"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedules_scheduleType"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_schedules_status"`);

        // 테이블 삭제
        await queryRunner.query(`DROP TABLE IF EXISTS "schedule_relations"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "schedule_participants"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "schedules"`);

        // enum 타입들 삭제
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedules_status_enum') THEN
                    DROP TYPE "public"."schedules_status_enum";
                END IF;
            END
            $$;
        `);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_participants_type_enum') THEN
                    DROP TYPE "public"."schedule_participants_type_enum";
                END IF;
            END
            $$;
        `);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type_enum') THEN
                    DROP TYPE "public"."schedule_type_enum";
                END IF;
            END
            $$;
        `);
    }
}
