import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateResourceLocationAddress1748247203486 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 기존 리소스 데이터 조회
        const resources = await queryRunner.query(`
            SELECT "resourceId", location
            FROM resources
            WHERE location IS NOT NULL
        `);

        // 각 리소스의 location 업데이트
        for (const resource of resources) {
            const location = resource.location;
            if (location && location.detailAddress) {
                const updatedLocation = {
                    address: `${location.address} ${location.detailAddress}`,
                };

                await queryRunner.query(
                    `
                    UPDATE resources
                    SET location = $1
                    WHERE "resourceId" = $2
                    `,
                    [updatedLocation, resource.resourceId],
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 롤백 로직은 구현하지 않음 (원래 주소를 복원하기 어려움)
    }
}
