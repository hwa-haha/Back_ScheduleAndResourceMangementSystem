import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransformNotificationDataToNestedStructure1756191156147 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 NotificationData에 중첩된 구조 추가 (기존 구조 유지) 시작...');

        // 🔄 단계별 안전한 마이그레이션: 기존 flat 구조를 유지하면서 새로운 nested 구조를 추가

        // 1단계: schedule 정보 추가
        await queryRunner.query(`
            UPDATE notifications 
            SET "notificationData" = "notificationData" || jsonb_build_object(
                'schedule', CASE 
                    WHEN ("notificationData"->>'scheduleId') IS NOT NULL OR 
                         ("notificationData"->>'scheduleTitle') IS NOT NULL OR 
                         ("notificationData"->>'beforeMinutes') IS NOT NULL OR
                         ("notificationData"->>'startDate') IS NOT NULL OR
                         ("notificationData"->>'endDate') IS NOT NULL OR
                         ("notificationData"->>'reservationId') IS NOT NULL
                    THEN jsonb_build_object(
                        'scheduleId', COALESCE("notificationData"->>'scheduleId', ''),
                        'scheduleTitle', COALESCE("notificationData"->>'scheduleTitle', "notificationData"->>'reservationTitle', ''),
                        'beforeMinutes', CASE 
                            WHEN ("notificationData"->>'beforeMinutes') IS NOT NULL 
                            AND ("notificationData"->>'beforeMinutes') != ''
                            AND ("notificationData"->>'beforeMinutes') ~ '^[0-9]+$'
                            THEN CAST("notificationData"->>'beforeMinutes' AS integer)
                            ELSE null
                        END,
                        'startDate', COALESCE("notificationData"->>'startDate', "notificationData"->>'reservationDate', ''),
                        'endDate', COALESCE("notificationData"->>'endDate', "notificationData"->>'reservationDate', '')
                    )
                    ELSE null::jsonb
                END
            )
            WHERE "notificationData" IS NOT NULL;
        `);

        // 2단계: schedule_relations에서 scheduleId 업데이트 (별도 쿼리로 안전하게)
        await queryRunner.query(`
            UPDATE notifications 
            SET "notificationData" = jsonb_set(
                "notificationData",
                '{schedule,scheduleId}',
                to_jsonb(sr."scheduleId"::text)
            )
            FROM schedule_relations sr
            WHERE "notificationData"->>'reservationId' IS NOT NULL
            AND sr."reservationId"::text = ("notificationData"->>'reservationId')
            AND ("notificationData"->'schedule'->>'scheduleId' IS NULL OR "notificationData"->'schedule'->>'scheduleId' = '');
        `);

        // 3단계: reservation 정보 추가
        await queryRunner.query(`
            UPDATE notifications 
            SET "notificationData" = "notificationData" || jsonb_build_object(
                'reservation', CASE 
                    WHEN ("notificationData"->>'reservationId') IS NOT NULL OR 
                         ("notificationData"->>'reservationTitle') IS NOT NULL OR 
                         ("notificationData"->>'reservationDate') IS NOT NULL
                    THEN jsonb_build_object(
                        'reservationId', COALESCE("notificationData"->>'reservationId', ''),
                        'reservationTitle', COALESCE("notificationData"->>'reservationTitle', ''),
                        'reservationDate', COALESCE("notificationData"->>'reservationDate', ''),
                        'status', COALESCE("notificationData"->>'status', 'PENDING')
                    )
                    ELSE null::jsonb
                END
            )
            WHERE "notificationData" IS NOT NULL;
        `);

        // 4단계: resource 정보 추가
        await queryRunner.query(`
            UPDATE notifications 
            SET "notificationData" = "notificationData" || jsonb_build_object(
                'resource', CASE 
                    WHEN ("notificationData"->>'resourceId') IS NOT NULL OR 
                         ("notificationData"->>'resourceName') IS NOT NULL OR 
                         ("notificationData"->>'resourceType') IS NOT NULL OR
                         ("notificationData"->>'consumableName') IS NOT NULL
                    THEN jsonb_build_object(
                        'resourceId', COALESCE("notificationData"->>'resourceId', ''),
                        'resourceName', COALESCE("notificationData"->>'resourceName', ''),
                        'resourceType', COALESCE("notificationData"->>'resourceType', 'MEETING_ROOM'),
                        'vehicleInfo', CASE 
                            WHEN ("notificationData"->>'consumableName') IS NOT NULL 
                            THEN jsonb_build_object(
                                'consumable', jsonb_build_object(
                                    'consumableName', "notificationData"->>'consumableName'
                                )
                            )
                            ELSE null::jsonb
                        END
                    )
                    ELSE null::jsonb
                END
            )
            WHERE "notificationData" IS NOT NULL;
        `);

        // 5단계: project 정보 추가
        await queryRunner.query(`
            UPDATE notifications 
            SET "notificationData" = "notificationData" || jsonb_build_object(
                'project', CASE 
                    WHEN ("notificationData"->>'projectId') IS NOT NULL OR 
                         ("notificationData"->>'projectName') IS NOT NULL
                    THEN jsonb_build_object(
                        'projectId', COALESCE("notificationData"->>'projectId', ''),
                        'projectName', COALESCE("notificationData"->>'projectName', '')
                    )
                    ELSE null::jsonb
                END
            )
            WHERE "notificationData" IS NOT NULL;
        `);

        // 변환된 레코드 수 확인
        const result = await queryRunner.query(`
            SELECT COUNT(*) as count FROM notifications WHERE "notificationData" IS NOT NULL;
        `);

        // 각 단계별 결과 확인
        const scheduleResult = await queryRunner.query(`
            SELECT COUNT(*) as count FROM notifications 
            WHERE "notificationData"->'schedule' IS NOT NULL;
        `);

        const reservationResult = await queryRunner.query(`
            SELECT COUNT(*) as count FROM notifications 
            WHERE "notificationData"->'reservation' IS NOT NULL;
        `);

        const resourceResult = await queryRunner.query(`
            SELECT COUNT(*) as count FROM notifications 
            WHERE "notificationData"->'resource' IS NOT NULL;
        `);

        const projectResult = await queryRunner.query(`
            SELECT COUNT(*) as count FROM notifications 
            WHERE "notificationData"->'project' IS NOT NULL;
        `);

        // schedule_relations에서 scheduleId를 찾아서 설정된 레코드 수 확인
        const scheduleIdUpdatedResult = await queryRunner.query(`
            SELECT COUNT(*) as count 
            FROM notifications 
            WHERE "notificationData"->>'reservationId' IS NOT NULL 
            AND "notificationData"->'schedule'->>'scheduleId' IS NOT NULL 
            AND "notificationData"->'schedule'->>'scheduleId' != '';
        `);

        console.log(`✅ NotificationData 중첩 구조 추가 완료! 전체 레코드 수: ${result[0]?.count || 0}개`);
        console.log(`   📋 schedule 구조 추가: ${scheduleResult[0]?.count || 0}개`);
        console.log(`   📋 reservation 구조 추가: ${reservationResult[0]?.count || 0}개`);
        console.log(`   📋 resource 구조 추가: ${resourceResult[0]?.count || 0}개`);
        console.log(`   📋 project 구조 추가: ${projectResult[0]?.count || 0}개`);
        console.log(`   🔗 schedule_relations에서 scheduleId 업데이트: ${scheduleIdUpdatedResult[0]?.count || 0}개`);
        console.log(
            '🎯 새로운 구조: 기존 flat 필드 + { schedule: {...}, reservation: {...}, resource: {...}, project: {...} }',
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 NotificationData에서 중첩된 구조만 제거 (기존 flat 구조 유지) 시작...');

        // 중첩된 구조(schedule, reservation, resource, project)만 안전하게 제거
        await queryRunner.query(`
            UPDATE notifications 
            SET "notificationData" = "notificationData" - 'schedule' - 'reservation' - 'resource' - 'project'
            WHERE "notificationData" IS NOT NULL 
            AND jsonb_typeof("notificationData") = 'object';
        `);

        // 롤백 결과 확인
        const result = await queryRunner.query(`
            SELECT COUNT(*) as count FROM notifications WHERE "notificationData" IS NOT NULL;
        `);

        const remainingNestedResult = await queryRunner.query(`
            SELECT COUNT(*) as count FROM notifications 
            WHERE "notificationData"->'schedule' IS NOT NULL 
            OR "notificationData"->'reservation' IS NOT NULL 
            OR "notificationData"->'resource' IS NOT NULL 
            OR "notificationData"->'project' IS NOT NULL;
        `);

        console.log(`✅ NotificationData 중첩 구조 제거 완료! 처리된 레코드 수: ${result[0]?.count || 0}개`);
        console.log(`   🗑️ 남은 중첩 구조: ${remainingNestedResult[0]?.count || 0}개 (0이어야 정상)`);
        console.log('📋 롤백 완료: 기존 flat 필드만 유지됨');
    }
}
