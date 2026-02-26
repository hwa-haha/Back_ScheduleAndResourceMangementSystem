import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationTypesTable1756192000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 notification_types 테이블 생성 시작...');
        console.log('ℹ️  전제조건: RESERVATION_DATE_REMINDING ENUM 값이 이미 존재해야 합니다.');

        // notification_types 테이블 생성 (기존 ENUM 타입 재사용)
        console.log('📝 notification_types 테이블 생성 (기존 ENUM 타입 재사용)...');
        await queryRunner.query(`
            CREATE TABLE "notification_types" (
                "notificationType" "notifications_notificationtype_enum" NOT NULL,
                "requirements" jsonb NOT NULL,
                "defaultTitleTemplate" varchar NOT NULL,
                "defaultBodyTemplate" varchar NOT NULL,
                "description" varchar NULL,
                CONSTRAINT "PK_notification_types" PRIMARY KEY ("notificationType")
            );
        `);

        // 컬럼 코멘트 추가
        await queryRunner.query(`
            COMMENT ON COLUMN "notification_types"."notificationType" IS '알림 타입 (기존 notifications 테이블과 동일한 ENUM 사용)';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "notification_types"."requirements" IS '알림 발송 시 필요한 정보 요구사항';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "notification_types"."defaultTitleTemplate" IS '기본 알림 제목 템플릿';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "notification_types"."defaultBodyTemplate" IS '기본 알림 내용 템플릿';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "notification_types"."description" IS '알림 설명';
        `);

        // 기본 데이터 삽입 (v2-notification.context.service.ts 내용 반영)
        await queryRunner.query(`
            INSERT INTO "notification_types" ("notificationType", "requirements", "defaultTitleTemplate", "defaultBodyTemplate", "description") VALUES
            (
                'RESERVATION_STATUS_CONFIRMED',
                '{"reservation": {"required": true}, "resource": {"required": true}, "schedule": {"required": true}}',
                '[예약 확정] {title}',
                '{dateRange}',
                '예약이 확정되었을 때 발송되는 알림'
            ),
            (
                'RESERVATION_STATUS_PENDING',
                '{"reservation": {"required": true}, "resource": {"required": true}, "schedule": {"required": true}}',
                '[숙소 확정 대기중] {title}',
                '{dateRange}',
                '예약이 승인 대기 상태일 때 발송되는 알림'
            ),
            (
                'RESERVATION_STATUS_CANCELLED',
                '{"reservation": {"required": true}, "resource": {"required": true}, "schedule": {"required": true}}',
                '[예약 취소] {title}',
                '{dateRange}',
                '예약이 취소되었을 때 발송되는 알림'
            ),
            (
                'RESERVATION_STATUS_REJECTED',
                '{"reservation": {"required": true}, "resource": {"required": true}, "schedule": {"required": true}}',
                '[예약 취소 (관리자)] {title}',
                '{dateRange}',
                '예약이 거절되었을 때 발송되는 알림'
            ),
            (
                'RESERVATION_DATE_UPCOMING',
                '{"reservation": {"required": true}, "resource": {"required": true}, "schedule": {"required": true}}',
                '예약 시간이 {beforeMinutes}분 남았습니다.',
                '{resourceName}',
                '예약 시간이 임박했을 때 발송되는 리마인더 알림'
            ),
            -- RESERVATION_DATE_REMINDING은 별도 마이그레이션에서 추가 예정
            -- (
            --     'RESERVATION_DATE_REMINDING',
            --     '{"reservation": {"required": true}, "resource": {"required": true}, "schedule": {"required": true}}',
            --     '[{title}] {function}',
            --     '{resourceName}',
            --     '예약 리마인더 알림 (복잡한 시간 계산 로직 사용)'
            -- ),
            (
                'RESERVATION_TIME_CHANGED',
                '{"reservation": {"required": true}, "resource": {"required": true}, "schedule": {"required": true}}',
                '[예약 시간 변경] {title}',
                '{dateRange}',
                '예약 시간이 변경되었을 때 발송되는 알림'
            ),
            (
                'RESERVATION_PARTICIPANT_CHANGED',
                '{"reservation": {"required": true}, "resource": {"required": true}, "schedule": {"required": true}}',
                '[참가자 변경] {title}',
                '{dateRange}',
                '예약 참가자가 변경되었을 때 발송되는 알림'
            ),
            (
                'RESOURCE_CONSUMABLE_REPLACING',
                '{"resource": {"required": true, "vehicleInfo": {"required": true, "consumable": {"required": true}}}}',
                '[교체 주기 알림] {consumableName}',
                '{resourceName}',
                '소모품 교체가 필요할 때 발송되는 알림'
            ),
            (
                'RESOURCE_CONSUMABLE_DELAYED_REPLACING',
                '{"resource": {"required": true, "vehicleInfo": {"required": true, "consumable": {"required": true}}}}',
                '[교체 지연 알림] {consumableName}',
                '{resourceName}',
                '소모품 교체가 지연되었을 때 발송되는 알림'
            ),
            (
                'RESOURCE_VEHICLE_RETURNED',
                '{"resource": {"required": true, "vehicleInfo": {"required": true}}}',
                '[차량 반납] 차량이 반납되었습니다.',
                '{resourceName}',
                '차량이 반납되었을 때 발송되는 알림'
            ),
            (
                'RESOURCE_VEHICLE_DELAYED_RETURNED',
                '{"resource": {"required": true, "vehicleInfo": {"required": true}}}',
                '[차량 반납 지연 알림] {resourceName}',
                '{dateRange}',
                '차량 반납이 지연되었을 때 발송되는 알림'
            ),
            (
                'RESOURCE_MAINTENANCE_COMPLETED',
                '{"resource": {"required": true}}',
                '[정비 완료] {consumableName}',
                '{resourceName}',
                '자원 정비가 완료되었을 때 발송되는 알림'
            );
        `);

        console.log('✅ notification_types 테이블 생성 및 기본 데이터 삽입 완료!');
        console.log('📋 생성된 알림 타입: 13개 (RESERVATION_DATE_REMINDING 제외)');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 notification_types 테이블 삭제 시작...');

        // notification_types 테이블 삭제
        await queryRunner.query(`DROP TABLE "notification_types";`);

        console.log('✅ notification_types 테이블 삭제 완료!');
    }
}
