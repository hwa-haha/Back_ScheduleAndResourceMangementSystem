import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillScheduleDepartmentFromParticipants1756192900000 implements MigrationInterface {
    name = 'BackfillScheduleDepartmentFromParticipants1756192900000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 일정의 scheduleDepartment를 예약자(RESERVER)의 부서로 업데이트
        // 타입이 RESERVER인 참가자의 부서를 사용
        await queryRunner.query(`
            UPDATE schedules 
            SET "scheduleDepartment" = subquery.department
            FROM (
                SELECT DISTINCT ON (s."scheduleId") 
                    s."scheduleId",
                    e.department
                FROM schedules s
                INNER JOIN schedule_participants sp ON sp."scheduleId" = s."scheduleId"
                INNER JOIN employees e ON e."employeeId" = sp."employeeId"
                WHERE s."scheduleDepartment" IS NULL
                  AND sp."type" = 'RESERVER'
                  AND e.department IS NOT NULL
                  AND e.department != ''
                ORDER BY s."scheduleId", sp."participantId" ASC
            ) AS subquery
            WHERE schedules."scheduleId" = subquery."scheduleId"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // scheduleDepartment 컬럼의 모든 값을 NULL로 되돌림
        await queryRunner.query(`
            UPDATE schedules 
            SET "scheduleDepartment" = NULL
        `);

        console.log('Schedule Department 값들이 NULL로 초기화되었습니다.');
    }
}
