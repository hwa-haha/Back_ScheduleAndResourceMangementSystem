import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDepartmentsTable1748247203492 implements MigrationInterface {
    name = 'CreateDepartmentsTable1748247203492';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // departments 테이블 생성
        await queryRunner.query(`
            CREATE TABLE "departments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "departmentName" character varying NOT NULL,
                "departmentCode" character varying NOT NULL,
                "type" character varying NOT NULL,
                "parentDepartmentId" uuid,
                "order" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_departments" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_departments_departmentCode" UNIQUE ("departmentCode")
            );
            COMMENT ON TABLE "departments" IS '부서 테이블';
            COMMENT ON COLUMN "departments"."departmentName" IS '부서명';
            COMMENT ON COLUMN "departments"."departmentCode" IS '부서 코드';
            COMMENT ON COLUMN "departments"."type" IS '유형';
            COMMENT ON COLUMN "departments"."parentDepartmentId" IS '상위 부서 ID';
            COMMENT ON COLUMN "departments"."order" IS '정렬 순서';
            COMMENT ON COLUMN "departments"."createdAt" IS '생성일';
            COMMENT ON COLUMN "departments"."updatedAt" IS '수정일';
        `);

        // 자기 참조 외래키 제약조건 추가
        await queryRunner.query(`
            ALTER TABLE "departments" 
            ADD CONSTRAINT "FK_departments_parentDepartmentId" 
            FOREIGN KEY ("parentDepartmentId") 
            REFERENCES "departments"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION;
        `);

        // 인덱스 생성
        await queryRunner.query(`
            CREATE INDEX "IDX_departments_parentDepartmentId" 
            ON "departments" ("parentDepartmentId");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_departments_type" 
            ON "departments" ("type");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_departments_order" 
            ON "departments" ("order");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 인덱스 삭제
        await queryRunner.query(`DROP INDEX "IDX_departments_order"`);
        await queryRunner.query(`DROP INDEX "IDX_departments_type"`);
        await queryRunner.query(`DROP INDEX "IDX_departments_parentDepartmentId"`);

        // 외래키 제약조건 삭제
        await queryRunner.query(`
            ALTER TABLE "departments" 
            DROP CONSTRAINT "FK_departments_parentDepartmentId"
        `);

        // 테이블 삭제
        await queryRunner.query(`DROP TABLE "departments"`);
    }
}
