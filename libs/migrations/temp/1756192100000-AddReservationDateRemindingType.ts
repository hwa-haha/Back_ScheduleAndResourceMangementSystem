import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReservationDateRemindingType1756192100000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 RESERVATION_DATE_REMINDING 타입 추가 시작...');

        // 1단계: ENUM 타입에 RESERVATION_DATE_REMINDING 값 추가
        console.log('📝 ENUM 타입에 RESERVATION_DATE_REMINDING 값 추가...');

        try {
            await queryRunner.query(`
                ALTER TYPE "notifications_notificationtype_enum" 
                ADD VALUE 'RESERVATION_DATE_REMINDING';
            `);
            console.log('✅ RESERVATION_DATE_REMINDING ENUM 값 추가 완료');
        } catch (error) {
            console.log('ℹ️  ENUM 값 추가 실패 - 이미 존재할 수 있음');
            console.log(`   Error: ${error.message}`);
            throw error; // ENUM 값이 없으면 다음 단계 실패하므로 에러 발생
        }

        // 트랜잭션 커밋을 위해 현재 트랜잭션 종료 및 새 트랜잭션 시작
        await queryRunner.commitTransaction();
        await queryRunner.startTransaction();

        // 2단계: notification_types 테이블에 데이터 추가
        console.log('📝 notification_types에 RESERVATION_DATE_REMINDING 데이터 추가...');

        try {
            await queryRunner.query(`
                INSERT INTO "notification_types" ("notificationType", "requirements", "defaultTitleTemplate", "defaultBodyTemplate", "description") 
                VALUES (
                    'RESERVATION_DATE_REMINDING',
                    '{"reservation": {"required": true}, "resource": {"required": true}, "schedule": {"required": true}}',
                    '[{title}] {function}',
                    '{resourceName}',
                    '예약 리마인더 알림 (복잡한 시간 계산 로직 사용)'
                );
            `);
            console.log('✅ RESERVATION_DATE_REMINDING 데이터 추가 완료');
        } catch (error) {
            console.log('❌ RESERVATION_DATE_REMINDING 데이터 추가 실패');
            console.log(`   Error: ${error.message}`);
            throw error;
        }

        console.log('✅ RESERVATION_DATE_REMINDING 타입 추가 완료!');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 RESERVATION_DATE_REMINDING 타입 제거 시작...');

        // notification_types에서 데이터 제거
        try {
            await queryRunner.query(`
                DELETE FROM "notification_types" 
                WHERE "notificationType" = 'RESERVATION_DATE_REMINDING';
            `);
            console.log('✅ RESERVATION_DATE_REMINDING 데이터 제거 완료');
        } catch (error) {
            console.log('ℹ️  데이터 제거 실패 또는 존재하지 않음');
        }

        // PostgreSQL ENUM에서 값을 제거하는 것은 복잡하므로 생략
        console.log('ℹ️  ENUM 값 제거는 수동으로 처리하거나 별도 작업이 필요합니다.');
        console.log('✅ RESERVATION_DATE_REMINDING 타입 제거 완료!');
    }
}
