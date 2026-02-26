import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsingAndClosingToReservationStatus1756192700000 implements MigrationInterface {
    name = 'AddUsingAndClosingToReservationStatus1756192700000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ADD VALUE를 사용하여 기존 enum에 새로운 값들 추가
        await queryRunner.query(`ALTER TYPE public.reservations_status_enum ADD VALUE 'USING'`);
        await queryRunner.query(`ALTER TYPE public.reservations_status_enum ADD VALUE 'CLOSING'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // ENUM에서 값을 제거하기 위해서는 enum을 재생성해야 함
        // 1. 임시 enum 타입 생성
        await queryRunner.query(`
            CREATE TYPE public.reservations_status_enum_temp AS ENUM (
                'PENDING',
                'CONFIRMED',
                'CANCELLED',
                'REJECTED',
                'CLOSED'
            )
        `);

        // 2. 기존 컬럼을 임시 타입으로 변경
        await queryRunner.query(`
            ALTER TABLE public.reservations 
            ALTER COLUMN status TYPE public.reservations_status_enum_temp 
            USING status::text::public.reservations_status_enum_temp
        `);

        // 3. 기존 enum 타입 삭제
        await queryRunner.query(`DROP TYPE public.reservations_status_enum`);

        // 4. 임시 타입을 원래 이름으로 변경
        await queryRunner.query(`ALTER TYPE public.reservations_status_enum_temp RENAME TO reservations_status_enum`);
    }
}
