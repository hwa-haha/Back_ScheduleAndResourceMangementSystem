import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateScheduleDepartmentsTable1748247203500 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // schedule_departments 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "schedule_departments" (
                "scheduleDepartmentId" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "scheduleId" uuid NOT NULL,
                "departmentId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_schedule_departments" PRIMARY KEY ("scheduleDepartmentId")
            );
            COMMENT ON TABLE "schedule_departments" IS '일정-부서 중간 테이블';
            COMMENT ON COLUMN "schedule_departments"."scheduleDepartmentId" IS '일정-부서 관계 ID';
            COMMENT ON COLUMN "schedule_departments"."scheduleId" IS '일정 ID';
            COMMENT ON COLUMN "schedule_departments"."departmentId" IS '부서 ID';
            COMMENT ON COLUMN "schedule_departments"."createdAt" IS '생성일시';
        `);

        // 인덱스 생성
        await queryRunner.query(`
            CREATE INDEX "IDX_schedule_departments_scheduleId" ON "schedule_departments" ("scheduleId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_schedule_departments_departmentId" ON "schedule_departments" ("departmentId")
        `);

        // 유니크 제약조건 (하나의 일정에 같은 부서가 중복으로 배정되지 않도록)
        await queryRunner.query(`
            ALTER TABLE "schedule_departments" 
            ADD CONSTRAINT "UQ_schedule_departments_schedule_department" 
            UNIQUE ("scheduleId", "departmentId")
        `);

        // 외래키 제약조건
        await queryRunner.query(`
            ALTER TABLE "schedule_departments" 
            ADD CONSTRAINT "FK_schedule_departments_scheduleId" 
            FOREIGN KEY ("scheduleId") 
            REFERENCES "schedules"("scheduleId") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "schedule_departments" 
            ADD CONSTRAINT "FK_schedule_departments_departmentId" 
            FOREIGN KEY ("departmentId") 
            REFERENCES "departments"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // schedule_departments 테이블 삭제
        await queryRunner.query(`DROP TABLE IF EXISTS "schedule_departments"`);
    }
}
